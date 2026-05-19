use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Investment {
    pub id: String,
    pub name: String,
    pub r#type: String, // 'stock', 'fii', 'crypto', 'fixed_income'
    pub ticker: Option<String>,
    pub quantity: f64,
    pub average_price: f64,
    pub current_price: f64,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateInvestmentDto {
    pub name: String,
    pub r#type: String,
    pub ticker: Option<String>,
    pub quantity: f64,
    pub average_price: f64,
    pub current_price: f64,
}
