CREATE TABLE IF NOT EXISTS recurring_rules (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category_id TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    interval_type TEXT NOT NULL, -- 'monthly', 'weekly', 'yearly'
    interval_value INTEGER DEFAULT 1,
    start_date DATETIME NOT NULL,
    next_date DATETIME NOT NULL,
    end_date DATETIME,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES accounts(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);