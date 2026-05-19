use crate::models::account::{Account, CreateAccountDto};
use crate::services::auth::AuthState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_accounts(state: State<'_, AuthState>) -> Result<Vec<Account>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let accounts = sqlx::query_as::<_, Account>("SELECT * FROM accounts")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(accounts)
}

#[tauri::command]
pub async fn create_account(
    state: State<'_, AuthState>,
    data: CreateAccountDto,
) -> Result<Account, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO accounts (id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?)")
        .bind(&id)
        .bind(&data.name)
        .bind(&data.r#type)
        .bind(data.balance)
        .bind(&data.currency)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let account = sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(account)
}

#[tauri::command]
pub async fn delete_account(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // Delete orphan transactions first to maintain data integrity
    sqlx::query("DELETE FROM transactions WHERE account_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM accounts WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
