use crate::models::goal::{CreateGoalDto, Goal};
use crate::services::auth::AuthState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_goals(state: State<'_, AuthState>) -> Result<Vec<Goal>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let goals = sqlx::query_as::<_, Goal>("SELECT * FROM goals")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(goals)
}

#[tauri::command]
pub async fn create_goal(state: State<'_, AuthState>, data: CreateGoalDto) -> Result<Goal, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO goals (id, name, target_amount, current_amount, deadline, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&data.name)
    .bind(data.target_amount)
    .bind(data.current_amount)
    .bind(&data.deadline)
    .bind(&data.color)
    .bind(&data.icon)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let goal = sqlx::query_as::<_, Goal>("SELECT * FROM goals WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(goal)
}

#[tauri::command]
pub async fn update_goal_amount(
    state: State<'_, AuthState>,
    id: String,
    amount: f64,
) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("UPDATE goals SET current_amount = current_amount + ? WHERE id = ?")
        .bind(amount)
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_goal(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("DELETE FROM goals WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
