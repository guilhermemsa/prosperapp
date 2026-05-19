use crate::models::transaction::{CreateTransactionDto, Transaction, UpdateTransactionDto};
use crate::services::auth::AuthState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_transactions(
    state: State<'_, AuthState>,
    account_id: Option<String>,
) -> Result<Vec<Transaction>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let query = match account_id {
        Some(_) => "SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC",
        None => "SELECT * FROM transactions ORDER BY date DESC",
    };

    let mut q = sqlx::query_as::<_, Transaction>(query);
    if let Some(id) = account_id {
        q = q.bind(id);
    }

    let transactions = q.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    Ok(transactions)
}

#[derive(serde::Serialize)]
pub struct PaginatedTransactions {
    pub items: Vec<Transaction>,
    pub total: i64,
}

#[tauri::command]
pub async fn get_paginated_transactions(
    state: State<'_, AuthState>,
    limit: u32,
    offset: u32,
    account_id: Option<String>,
    search_term: Option<String>,
    transaction_type: Option<String>,
) -> Result<PaginatedTransactions, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let mut items_query = "SELECT * FROM transactions WHERE 1=1".to_string();
    let mut count_query = "SELECT COUNT(*) FROM transactions WHERE 1=1".to_string();

    if account_id.is_some() {
        items_query.push_str(" AND account_id = ?");
        count_query.push_str(" AND account_id = ?");
    }

    if let Some(ref t_type) = transaction_type {
        if t_type != "all" {
            items_query.push_str(" AND type = ?");
            count_query.push_str(" AND type = ?");
        }
    }

    let mut pattern = String::new();
    if let Some(ref term) = search_term {
        if !term.trim().is_empty() {
            pattern = format!("%{}%", term);
            items_query.push_str(" AND (description LIKE ? OR tags LIKE ?)");
            count_query.push_str(" AND (description LIKE ? OR tags LIKE ?)");
        }
    }

    items_query.push_str(" ORDER BY date DESC LIMIT ? OFFSET ?");

    let mut q_items = sqlx::query_as::<_, Transaction>(&items_query);
    let mut q_count = sqlx::query_scalar::<_, i64>(&count_query);

    if let Some(ref id) = account_id {
        q_items = q_items.bind(id);
        q_count = q_count.bind(id);
    }

    if let Some(ref t_type) = transaction_type {
        if t_type != "all" {
            q_items = q_items.bind(t_type);
            q_count = q_count.bind(t_type);
        }
    }

    if !pattern.is_empty() {
        q_items = q_items.bind(&pattern).bind(&pattern);
        q_count = q_count.bind(&pattern).bind(&pattern);
    }

    q_items = q_items.bind(limit).bind(offset);

    let total = q_count.fetch_one(&pool).await.map_err(|e| e.to_string())?;
    let items = q_items.fetch_all(&pool).await.map_err(|e| e.to_string())?;

    Ok(PaginatedTransactions { items, total })
}

#[tauri::command]
pub async fn create_transaction(
    state: State<'_, AuthState>,
    data: CreateTransactionDto,
) -> Result<Transaction, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();

    // Start transaction to update account balance as well
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&data.account_id)
    .bind(&data.category_id)
    .bind(data.amount)
    .bind(&data.r#type)
    .bind(&data.description)
    .bind(&data.date)
    .bind(&data.tags)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // Update account balance
    let amount_diff = if data.r#type == "expense" {
        -data.amount
    } else {
        data.amount
    };

    sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
        .bind(amount_diff)
        .bind(&data.account_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    let transaction = sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(transaction)
}

#[tauri::command]
pub async fn update_transaction(
    state: State<'_, AuthState>,
    id: String,
    data: UpdateTransactionDto,
) -> Result<Transaction, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    // 1. Get the original transaction to reverse its balance impact
    let original = sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Transação não encontrada".to_string())?;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 2. Reverse the old balance impact on the original account
    let old_diff = if original.r#type == "expense" {
        original.amount
    } else {
        -original.amount
    };
    sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
        .bind(old_diff)
        .bind(&original.account_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // 3. Update the transaction
    let new_type = data.r#type.as_deref().unwrap_or(&original.r#type);
    let new_amount = data.amount.unwrap_or(original.amount);
    let new_account_id = data.account_id.as_deref().unwrap_or(&original.account_id);

    sqlx::query(
        "UPDATE transactions SET account_id = ?, category_id = ?, amount = ?, type = ?, description = ?, date = ?, tags = ? WHERE id = ?"
    )
    .bind(new_account_id)
    .bind(data.category_id.as_ref().or(original.category_id.as_ref()))
    .bind(new_amount)
    .bind(new_type)
    .bind(data.description.as_ref().or(original.description.as_ref()))
    .bind(data.date.as_deref().unwrap_or(&original.date))
    .bind(data.tags.as_ref().or(original.tags.as_ref()))
    .bind(&id)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // 4. Apply the new balance impact on the (possibly new) account
    let new_diff = if new_type == "expense" {
        -new_amount
    } else {
        new_amount
    };
    sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
        .bind(new_diff)
        .bind(new_account_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    let updated = sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(updated)
}

#[tauri::command]
pub async fn delete_transaction(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    // Get the transaction first to reverse balance
    let tx = sqlx::query_as::<_, Transaction>("SELECT * FROM transactions WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Transação não encontrada".to_string())?;

    let mut db_tx = pool.begin().await.map_err(|e| e.to_string())?;

    // Reverse the balance impact
    let amount_diff = if tx.r#type == "expense" {
        tx.amount
    } else {
        -tx.amount
    };
    sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
        .bind(amount_diff)
        .bind(&tx.account_id)
        .execute(&mut *db_tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM transactions WHERE id = ?")
        .bind(&id)
        .execute(&mut *db_tx)
        .await
        .map_err(|e| e.to_string())?;

    db_tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn create_transfer(
    state: State<'_, AuthState>,
    from_account_id: String,
    to_account_id: String,
    amount: f64,
    description: Option<String>,
    date: String,
) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    if from_account_id == to_account_id {
        return Err("Conta de origem e destino devem ser diferentes.".to_string());
    }

    if amount <= 0.0 {
        return Err("O valor da transferência deve ser positivo.".to_string());
    }

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let desc = description.unwrap_or_else(|| "Transferência entre contas".to_string());

    // Create expense transaction on source account
    let id_out = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO transactions (id, account_id, amount, type, description, date) VALUES (?, ?, ?, 'transfer', ?, ?)"
    )
    .bind(&id_out)
    .bind(&from_account_id)
    .bind(amount)
    .bind(&desc)
    .bind(&date)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // Create income transaction on destination account
    let id_in = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO transactions (id, account_id, amount, type, description, date) VALUES (?, ?, ?, 'transfer', ?, ?)"
    )
    .bind(&id_in)
    .bind(&to_account_id)
    .bind(amount)
    .bind(&desc)
    .bind(&date)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // Update balances: debit source, credit destination
    sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
        .bind(amount)
        .bind(&from_account_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
        .bind(amount)
        .bind(&to_account_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
