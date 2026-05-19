use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Transaction {
    pub id: String,
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub r#type: String, // 'income', 'expense', 'transfer'
    pub description: Option<String>,
    pub date: String,
    pub tags: Option<String>,
    pub recurring_id: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateTransactionDto {
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub r#type: String,
    pub description: Option<String>,
    pub date: String,
    pub tags: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateTransactionDto {
    pub account_id: Option<String>,
    pub category_id: Option<String>,
    pub amount: Option<f64>,
    pub r#type: Option<String>,
    pub description: Option<String>,
    pub date: Option<String>,
    pub tags: Option<String>,
}
