use crate::database::DbService;
use sqlx::SqlitePool;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct AuthState {
    pub is_locked: Mutex<bool>,
    pub db: Mutex<Option<DbService>>,
}

impl AuthState {
    pub fn new() -> Self {
        Self {
            is_locked: Mutex::new(true),
            db: Mutex::new(None),
        }
    }

    /// Helper to extract the database pool. Eliminates boilerplate across all commands.
    pub fn get_pool(&self) -> Result<SqlitePool, String> {
        let db_guard = self.db.lock().unwrap();
        db_guard
            .as_ref()
            .ok_or_else(|| "Database not initialized".to_string())
            .map(|db| db.pool.clone())
    }

    /// Guard that ensures the app is unlocked before allowing any operation.
    pub fn require_unlocked(&self) -> Result<(), String> {
        let locked = self.is_locked.lock().unwrap();
        if *locked {
            Err("Aplicativo bloqueado. Faça login primeiro.".to_string())
        } else {
            Ok(())
        }
    }
}

pub struct AuthService;

impl AuthService {
    pub async fn init_app(app_handle: &AppHandle, password: &str) -> anyhow::Result<()> {
        // 1. Hash the password for verification (optional if using SQLCipher as check)
        // 2. Save the salt/hash if needed
        // 3. Initialize DB with this password
        let db = DbService::init(app_handle, password).await?;

        // 4. Update state
        let state = app_handle.state::<AuthState>();
        *state.is_locked.lock().unwrap() = false;
        *state.db.lock().unwrap() = Some(db);

        Ok(())
    }

    pub async fn unlock_app(app_handle: &AppHandle, password: &str) -> anyhow::Result<()> {
        // Try to initialize DB with the provided password
        let db = DbService::init(app_handle, password).await.map_err(|e| {
            let err_str = e.to_string();
            if err_str.contains("file is not a database") || err_str.contains("code: 26") {
                anyhow::anyhow!("Senha incorreta.")
            } else {
                anyhow::anyhow!("Erro ao acessar o banco de dados: {}", err_str)
            }
        })?;

        let state = app_handle.state::<AuthState>();
        *state.is_locked.lock().unwrap() = false;
        *state.db.lock().unwrap() = Some(db);

        Ok(())
    }

    pub async fn change_password(app_handle: &AppHandle, new_password: &str) -> anyhow::Result<()> {
        let state = app_handle.state::<AuthState>();

        {
            let is_locked = state.is_locked.lock().unwrap();
            if *is_locked {
                return Err(anyhow::anyhow!("App is locked"));
            }
        }

        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");
        let db_path = app_dir.join("prosperapp.db");

        // Get the old pool to run rekey on an existing authenticated connection
        let old_pool = {
            let db_lock = state.db.lock().unwrap();
            if let Some(db) = db_lock.as_ref() {
                db.pool.clone()
            } else {
                return Err(anyhow::anyhow!("Database not initialized"));
            }
        };

        // Execute rekey using a parameterized approach via sqlx::query
        // SQLCipher's PRAGMA rekey changes the encryption key for the database
        println!("Alterando chave de criptografia (rekey)...");
        {
            let mut conn = old_pool.acquire().await?;
            // Use the safe pragma format — same pattern used in DbService::init
            let safe_password = format!("'{}'", new_password.replace("'", "''"));
            sqlx::query(&format!("PRAGMA rekey = {}", safe_password))
                .execute(&mut *conn)
                .await?;
            println!("Rekey executado com sucesso.");
        }

        // Create a new pool with the new password
        println!("Reinicializando banco de dados com a nova senha...");
        let safe_password = format!("'{}'", new_password.replace("'", "''"));
        let options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true)
            .pragma("key", safe_password);

        let new_pool = sqlx::SqlitePool::connect_with(options).await?;

        // Run migrations on the new pool to ensure it's valid
        sqlx::migrate!("./migrations").run(&new_pool).await?;

        // Swap the new pool into state — the old pool is dropped naturally
        // when all existing references (from concurrent queries) are released
        {
            let mut db_lock = state.db.lock().unwrap();
            *db_lock = Some(DbService { pool: new_pool });
        }
        println!("Processo de troca de senha concluído no backend.");

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_state_initial_state() {
        let state = AuthState::new();
        assert!(*state.is_locked.lock().unwrap());
        assert!(state.db.lock().unwrap().is_none());
    }

    #[test]
    fn test_require_unlocked() {
        let state = AuthState::new();
        assert!(state.require_unlocked().is_err());

        *state.is_locked.lock().unwrap() = false;
        assert!(state.require_unlocked().is_ok());
    }

    #[test]
    fn test_get_pool_fails_when_none() {
        let state = AuthState::new();
        assert!(state.get_pool().is_err());
    }
}
