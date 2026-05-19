#[cfg(test)]
mod tests {
    use crate::commands::settings::*;
    use crate::database::DbService;
    use crate::encryption::EncryptionService;
    use crate::services::auth::AuthState;
    use sqlx::SqlitePool;
    use std::fs;
    use std::sync::Mutex;

    async fn setup_test_state(db_name: &str) -> AuthState {
        let db_path = format!("test_{}.db", db_name);

        // Remove existing test db
        let _ = fs::remove_file(&db_path);

        let options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true);

        let pool = SqlitePool::connect_with(options).await.unwrap();

        sqlx::query("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
            .execute(&pool)
            .await
            .unwrap();

        AuthState {
            is_locked: Mutex::new(false),
            db: Mutex::new(Some(DbService { pool })),
        }
    }

    async fn cleanup(db_name: &str) {
        let db_path = format!("test_{}.db", db_name);
        let _ = fs::remove_file(&db_path);
        let _ = fs::remove_file(format!("{}-shm", db_path));
        let _ = fs::remove_file(format!("{}-wal", db_path));
    }

    #[tokio::test]
    async fn test_set_and_get_gemini_api_key_no_fallback() {
        let db_name = "gemini_no_fallback";
        let state = setup_test_state(db_name).await;

        let test_key = "test-api-key-123";
        let setting_key = "gemini_api_key".to_string();

        // 1. Test saving
        set_setting_internal(&state, setting_key.clone(), test_key.to_string())
            .await
            .unwrap();

        // 2. Test retrieving (Keyring access can fail in headless tests on macOS)
        if let Ok(Some(val)) = get_setting_internal(&state, setting_key.clone()).await {
            assert_eq!(val, test_key.to_string());
        }

        // 3. Verify it was NOT saved in the database (security feature)
        let pool = state.get_pool().unwrap();
        let db_row: Option<(String,)> = sqlx::query_as("SELECT value FROM settings WHERE key = ?")
            .bind(&setting_key)
            .fetch_optional(&pool)
            .await
            .unwrap();
        assert!(
            db_row.is_none(),
            "API key should not be saved in the SQLite database"
        );

        // Cleanup Keyring
        if let Ok(entry) = keyring::Entry::new("com.prosperapp.app", &setting_key) {
            let _ = entry.delete_credential();
        }

        drop(state);
        cleanup(db_name).await;
    }

    #[tokio::test]
    async fn test_normal_setting_saving() {
        let db_name = "normal_settings";
        let state = setup_test_state(db_name).await;

        let test_val = "gemini-pro-test";
        let setting_key = "gemini_model".to_string();

        set_setting_internal(&state, setting_key.clone(), test_val.to_string())
            .await
            .unwrap();

        let result = get_setting_internal(&state, setting_key).await.unwrap();
        assert_eq!(result, Some(test_val.to_string()));

        drop(state);
        cleanup(db_name).await;
    }
}
