use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct CreditCard {
    pub id: String,
    pub name: String,
    pub limit_amount: f64,
    pub closing_day: i32,
    pub due_day: i32,
    pub account_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateCreditCardDto {
    pub name: String,
    pub limit_amount: f64,
    pub closing_day: i32,
    pub due_day: i32,
    pub account_id: Option<String>,
}
