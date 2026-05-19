use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

pub struct DbService {
    pub pool: SqlitePool,
}

impl DbService {
    pub async fn init(app_handle: &AppHandle, password: &str) -> anyhow::Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");

        if !app_dir.exists() {
            fs::create_dir_all(&app_dir)?;
        }

        let db_path = app_dir.join("prosperapp.db");

        // SQLx Connect Options
        let safe_password = format!("'{}'", password.replace("'", "''"));
        let options = SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true)
            // SQLCipher key
            .pragma("key", safe_password);

        let pool = SqlitePool::connect_with(options).await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }
}
