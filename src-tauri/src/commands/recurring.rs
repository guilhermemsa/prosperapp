use crate::models::recurring::{CreateRecurringRuleDto, RecurringRule};
use crate::services::auth::AuthState;
use chrono::{Duration, Months, NaiveDateTime, Utc};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_recurring_rules(
    state: State<'_, AuthState>,
) -> Result<Vec<RecurringRule>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let rules = sqlx::query_as::<_, RecurringRule>("SELECT * FROM recurring_rules")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rules)
}

fn calculate_next_date(
    start_date: &str,
    interval_type: &str,
    interval_value: i32,
) -> Result<String, String> {
    let date = NaiveDateTime::parse_from_str(
        &format!("{} 00:00:00", &start_date[0..10]),
        "%Y-%m-%d %H:%M:%S",
    )
    .unwrap_or_else(|_| Utc::now().naive_utc());

    let next_date = match interval_type {
        "monthly" => date
            .checked_add_months(Months::new(interval_value as u32))
            .unwrap_or(date),
        "weekly" => date
            .checked_add_signed(Duration::days((interval_value * 7) as i64))
            .unwrap_or(date),
        "yearly" => date
            .checked_add_months(Months::new((interval_value * 12) as u32))
            .unwrap_or(date),
        _ => date,
    };

    Ok(next_date.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string())
}

#[tauri::command]
pub async fn create_recurring_rule(
    state: State<'_, AuthState>,
    data: CreateRecurringRuleDto,
) -> Result<RecurringRule, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();
    let interval_value = data.interval_value.unwrap_or(1);

    // Calcula a primeira data de cobrança (se start_date > now, next_date = start_date, senão calcula o próximo)
    // Para simplificar, definimos next_date como start_date inicialmente
    let next_date = data.start_date.clone();

    sqlx::query(
        "INSERT INTO recurring_rules (id, account_id, category_id, amount, type, description, interval_type, interval_value, start_date, next_date, end_date, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&data.account_id)
    .bind(&data.category_id)
    .bind(data.amount)
    .bind(&data.r#type)
    .bind(&data.description)
    .bind(&data.interval_type)
    .bind(interval_value)
    .bind(&data.start_date)
    .bind(&next_date)
    .bind(&data.end_date)
    .bind(&data.tags)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let rule = sqlx::query_as::<_, RecurringRule>("SELECT * FROM recurring_rules WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rule)
}

#[tauri::command]
pub async fn delete_recurring_rule(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("DELETE FROM recurring_rules WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn process_recurring_transactions(state: State<'_, AuthState>) -> Result<i32, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let now = Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

    // Busca regras que já passaram da next_date
    let rules = sqlx::query_as::<_, RecurringRule>(
        "SELECT * FROM recurring_rules WHERE next_date <= ? AND (end_date IS NULL OR end_date >= ?)"
    )
    .bind(&now)
    .bind(&now)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut created_count = 0;

    for rule in rules {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

        let tx_id = Uuid::new_v4().to_string();

        // Cria a transação
        sqlx::query(
            "INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, tags, recurring_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&tx_id)
        .bind(&rule.account_id)
        .bind(&rule.category_id)
        .bind(rule.amount)
        .bind(&rule.r#type)
        .bind(&rule.description)
        .bind(&rule.next_date)
        .bind(&rule.tags)
        .bind(&rule.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        // Atualiza saldo da conta
        let amount_diff = if rule.r#type == "expense" {
            -rule.amount
        } else {
            rule.amount
        };
        sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
            .bind(amount_diff)
            .bind(&rule.account_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        // Calcula a nova data
        let new_next_date =
            calculate_next_date(&rule.next_date, &rule.interval_type, rule.interval_value)?;

        // Atualiza a recurring_rule com o novo next_date
        sqlx::query("UPDATE recurring_rules SET next_date = ? WHERE id = ?")
            .bind(&new_next_date)
            .bind(&rule.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
        created_count += 1;
    }

    Ok(created_count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_next_date_monthly() {
        let next = calculate_next_date("2023-01-15T12:00:00.000Z", "monthly", 1).unwrap();
        assert!(next.starts_with("2023-02-15"));
    }

    #[test]
    fn test_calculate_next_date_weekly() {
        let next = calculate_next_date("2023-01-15T12:00:00.000Z", "weekly", 1).unwrap();
        assert!(next.starts_with("2023-01-22"));
    }

    #[test]
    fn test_calculate_next_date_yearly() {
        let next = calculate_next_date("2023-01-15T12:00:00.000Z", "yearly", 1).unwrap();
        assert!(next.starts_with("2024-01-15"));
    }
}
