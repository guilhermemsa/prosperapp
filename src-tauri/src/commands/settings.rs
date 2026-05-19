use crate::encryption::EncryptionService;
use crate::services::auth::AuthState;
use tauri::State;

#[tauri::command]
pub async fn get_setting(
    state: State<'_, AuthState>,
    key: String,
) -> Result<Option<String>, String> {
    get_setting_internal(&state, key).await
}

pub async fn get_setting_internal(
    state: &AuthState,
    key: String,
) -> Result<Option<String>, String> {
    state.require_unlocked()?;

    if key == "gemini_api_key" {
        return EncryptionService::get_from_keyring("com.prosperapp.app", &key)
            .map(Some)
            .or_else(|_| Ok(None));
    }

    let pool = state.get_pool()?;

    let row: Option<(String,)> = sqlx::query_as("SELECT value FROM settings WHERE key = ?")
        .bind(&key)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row.map(|r| r.0))
}

#[tauri::command]
pub async fn set_setting(
    state: State<'_, AuthState>,
    key: String,
    value: String,
) -> Result<(), String> {
    set_setting_internal(&state, key, value).await
}

pub async fn set_setting_internal(
    state: &AuthState,
    key: String,
    value: String,
) -> Result<(), String> {
    state.require_unlocked()?;

    if key == "gemini_api_key" {
        EncryptionService::save_to_keyring("com.prosperapp.app", &key, &value)
            .map_err(|e| format!("Falha ao salvar no Keychain do sistema: {}", e))?;
        return Ok(());
    }

    let pool = state.get_pool()?;

    sqlx::query("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .bind(&key)
        .bind(&value)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn reset_database(state: State<'_, AuthState>) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // Delete all user data but preserve structure, categories, and settings
    sqlx::query("DELETE FROM transactions")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM accounts")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM credit_cards")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM investments")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM goals")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
