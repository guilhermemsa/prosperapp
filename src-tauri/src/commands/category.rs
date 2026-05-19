use crate::models::category::Category;
use crate::services::auth::AuthState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_categories(state: State<'_, AuthState>) -> Result<Vec<Category>, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let categories = sqlx::query_as::<_, Category>("SELECT * FROM categories ORDER BY name")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(categories)
}

#[tauri::command]
pub async fn create_category(
    state: State<'_, AuthState>,
    name: String,
    icon: Option<String>,
    color: Option<String>,
    parent_id: Option<String>,
    r#type: Option<String>,
    monthly_budget: Option<f64>,
) -> Result<Category, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let id = Uuid::new_v4().to_string();

    let category = sqlx::query_as::<_, Category>(
        "INSERT INTO categories (id, name, icon, color, parent_id, type, monthly_budget) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(&id)
    .bind(name)
    .bind(icon)
    .bind(color)
    .bind(parent_id)
    .bind(r#type)
    .bind(monthly_budget)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(category)
}

#[tauri::command]
pub async fn update_category(
    state: State<'_, AuthState>,
    id: String,
    name: String,
    icon: Option<String>,
    color: Option<String>,
    parent_id: Option<String>,
    r#type: Option<String>,
) -> Result<Category, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let category = sqlx::query_as::<_, Category>(
        "UPDATE categories SET name = ?, icon = ?, color = ?, parent_id = ?, type = ? WHERE id = ? RETURNING *"
    )
    .bind(name)
    .bind(icon)
    .bind(color)
    .bind(parent_id)
    .bind(r#type)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(category)
}

#[tauri::command]
pub async fn delete_category(state: State<'_, AuthState>, id: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    sqlx::query("DELETE FROM categories WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
