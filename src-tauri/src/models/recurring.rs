use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct RecurringRule {
    pub id: String,
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub r#type: String,
    pub description: Option<String>,
    pub interval_type: String,
    pub interval_value: i32,
    pub start_date: String,
    pub next_date: String,
    pub end_date: Option<String>,
    pub tags: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRecurringRuleDto {
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub r#type: String,
    pub description: Option<String>,
    pub interval_type: String,
    pub interval_value: Option<i32>,
    pub start_date: String,
    pub end_date: Option<String>,
    pub tags: Option<String>,
}
