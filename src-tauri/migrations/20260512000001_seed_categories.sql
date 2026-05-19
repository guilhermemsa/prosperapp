-- Seed default categories
INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES
    ('cat-alimentacao', 'Alimentação', '🍔', '#ef4444'),
    ('cat-transporte', 'Transporte', '🚗', '#f97316'),
    ('cat-moradia', 'Moradia', '🏠', '#eab308'),
    ('cat-saude', 'Saúde', '💊', '#22c55e'),
    ('cat-educacao', 'Educação', '📚', '#3b82f6'),
    ('cat-lazer', 'Lazer', '🎮', '#8b5cf6'),
    ('cat-vestuario', 'Vestuário', '👕', '#ec4899'),
    ('cat-servicos', 'Serviços', '🔧', '#6366f1'),
    ('cat-salario', 'Salário', '💰', '#10b981'),
    ('cat-investimento', 'Investimento', '📈', '#14b8a6'),
    ('cat-outros', 'Outros', '📦', '#64748b');
