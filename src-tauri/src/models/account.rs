use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Account {
    pub id: String,
    pub name: String,
    pub r#type: String, // 'bank', 'wallet', 'savings'
    pub balance: f64,
    pub currency: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateAccountDto {
    pub name: String,
    pub r#type: String,
    pub balance: f64,
    pub currency: String,
}
