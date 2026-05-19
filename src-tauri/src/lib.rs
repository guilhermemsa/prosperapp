mod commands;
mod database;
mod encryption;
mod models;
mod services;

use services::auth::AuthState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AuthState::new())
        .invoke_handler(tauri::generate_handler![
            commands::auth::check_onboarding,
            commands::auth::setup_password,
            commands::auth::login,
            commands::auth::change_password,
            commands::account::get_accounts,
            commands::account::create_account,
            commands::account::delete_account,
            commands::transaction::get_transactions,
            commands::transaction::get_paginated_transactions,
            commands::transaction::create_transaction,
            commands::transaction::update_transaction,
            commands::transaction::delete_transaction,
            commands::transaction::create_transfer,
            commands::credit_card::get_credit_cards,
            commands::credit_card::create_credit_card,
            commands::credit_card::delete_credit_card,
            commands::investment::get_investments,
            commands::investment::create_investment,
            commands::investment::update_investment_price,
            commands::investment::delete_investment,
            commands::goal::get_goals,
            commands::goal::create_goal,
            commands::goal::update_goal_amount,
            commands::goal::delete_goal,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::reset_database,
            commands::import::import_document,
            commands::import::import_ofx,
            commands::import::create_transactions_batch,
            commands::category::get_categories,
            commands::category::create_category,
            commands::category::update_category,
            commands::category::delete_category,
            commands::recurring::get_recurring_rules,
            commands::recurring::create_recurring_rule,
            commands::recurring::delete_recurring_rule,
            commands::recurring::process_recurring_transactions,
            commands::backup::export_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
