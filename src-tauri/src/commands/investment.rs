use crate::models::investment::{CreateInvestmentDto, Investment};
use crate::services::auth::AuthState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_investments(state: State<'_, AuthState>) -> Result<Vec<Investment>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let investments = sqlx::query_as::<_, Investment>("SELECT * FROM investments")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(investments)
}

#[tauri::command]
pub async fn create_investment(
    state: State<'_, AuthState>,
    data: CreateInvestmentDto,
) -> Result<Investment, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO investments (id, name, type, ticker, quantity, average_price, current_price) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&data.name)
    .bind(&data.r#type)
    .bind(&data.ticker)
    .bind(data.quantity)
    .bind(data.average_price)
    .bind(data.current_price)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let investment = sqlx::query_as::<_, Investment>("SELECT * FROM investments WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(investment)
}

#[tauri::command]
pub async fn update_investment_price(
    state: State<'_, AuthState>,
    id: String,
    current_price: f64,
) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("UPDATE investments SET current_price = ? WHERE id = ?")
        .bind(current_price)
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_investment(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("DELETE FROM investments WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
