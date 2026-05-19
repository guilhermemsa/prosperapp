use crate::services::auth::AuthService;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn check_onboarding(app_handle: AppHandle) -> Result<bool, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let db_path = app_dir.join("prosperapp.db");
    Ok(db_path.exists())
}

#[tauri::command]
pub async fn setup_password(app_handle: AppHandle, password: String) -> Result<(), String> {
    AuthService::init_app(&app_handle, &password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn login(app_handle: AppHandle, password: String) -> Result<(), String> {
    AuthService::unlock_app(&app_handle, &password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn change_password(app_handle: AppHandle, new_password: String) -> Result<(), String> {
    AuthService::change_password(&app_handle, &new_password)
        .await
        .map_err(|e| e.to_string())
}
