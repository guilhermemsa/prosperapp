use crate::models::account::Account;
use crate::models::category::Category;
use crate::models::transaction::Transaction;
use crate::services::auth::AuthState;
use std::fs::File;
use std::io::Write;
use tauri::State;

#[tauri::command]
pub async fn export_csv(state: State<'_, AuthState>, file_path: String) -> Result<(), String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let transactions =
        sqlx::query_as::<_, Transaction>("SELECT * FROM transactions ORDER BY date DESC")
            .fetch_all(&pool)
            .await
            .map_err(|e| e.to_string())?;

    let accounts = sqlx::query_as::<_, Account>("SELECT * FROM accounts")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let categories = sqlx::query_as::<_, Category>("SELECT * FROM categories")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;

    // Escreve cabeçalho
    writeln!(file, "ID,Data,Tipo,Valor,Conta,Categoria,Descricao,Tags")
        .map_err(|e| e.to_string())?;

    for tx in transactions {
        let account_name = accounts
            .iter()
            .find(|a| a.id == tx.account_id)
            .map(|a| a.name.clone())
            .unwrap_or_default();

        let category_name = tx
            .category_id
            .as_ref()
            .and_then(|cid| {
                categories
                    .iter()
                    .find(|c| c.id == *cid)
                    .map(|c| c.name.clone())
            })
            .unwrap_or_default();

        let desc = tx
            .description
            .clone()
            .unwrap_or_default()
            .replace("\"", "\"\"");
        let tags = tx.tags.clone().unwrap_or_default().replace("\"", "\"\"");

        let line = format!(
            "{},{},{},{},\"{}\",\"{}\",\"{}\",\"{}\"",
            tx.id, tx.date, tx.r#type, tx.amount, account_name, category_name, desc, tags
        );

        writeln!(file, "{}", line).map_err(|e| e.to_string())?;
    }

    file.sync_all().map_err(|e| e.to_string())?;

    Ok(())
}
