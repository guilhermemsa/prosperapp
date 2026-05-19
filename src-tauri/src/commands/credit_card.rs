use crate::models::credit_card::{CreateCreditCardDto, CreditCard};
use crate::services::auth::AuthState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_credit_cards(state: State<'_, AuthState>) -> Result<Vec<CreditCard>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let cards = sqlx::query_as::<_, CreditCard>("SELECT * FROM credit_cards")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(cards)
}

#[tauri::command]
pub async fn create_credit_card(
    state: State<'_, AuthState>,
    data: CreateCreditCardDto,
) -> Result<CreditCard, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO credit_cards (id, name, limit_amount, closing_day, due_day, account_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&data.name)
    .bind(data.limit_amount)
    .bind(data.closing_day)
    .bind(data.due_day)
    .bind(&data.account_id)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let card = sqlx::query_as::<_, CreditCard>("SELECT * FROM credit_cards WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(card)
}

#[tauri::command]
pub async fn delete_credit_card(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("DELETE FROM credit_cards WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
