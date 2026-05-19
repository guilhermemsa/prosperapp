-- Add type column to categories
ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'expense';

-- Clear FK references first
UPDATE transactions SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE id LIKE 'cat-%');

-- Remove old seed data
DELETE FROM categories WHERE id LIKE 'cat-%';

-- Expense categories
INSERT OR IGNORE INTO categories (id, name, icon, color, type) VALUES
    ('cat-alimentacao', 'Alimentação', '🍔', '#ef4444', 'expense'),
    ('cat-transporte', 'Transporte', '🚗', '#f97316', 'expense'),
    ('cat-moradia', 'Moradia', '🏠', '#eab308', 'expense'),
    ('cat-saude', 'Saúde', '💊', '#22c55e', 'expense'),
    ('cat-educacao', 'Educação', '📚', '#3b82f6', 'expense'),
    ('cat-lazer', 'Lazer', '🎮', '#8b5cf6', 'expense'),
    ('cat-vestuario', 'Vestuário', '👕', '#ec4899', 'expense'),
    ('cat-servicos', 'Serviços', '🔧', '#6366f1', 'expense'),
    ('cat-assinaturas', 'Assinaturas', '📱', '#a855f7', 'expense'),
    ('cat-mercado', 'Supermercado', '🛒', '#f43f5e', 'expense'),
    ('cat-restaurante', 'Restaurante', '🍽️', '#e11d48', 'expense'),
    ('cat-combustivel', 'Combustível', '⛽', '#ea580c', 'expense'),
    ('cat-farmacia', 'Farmácia', '💉', '#16a34a', 'expense'),
    ('cat-pet', 'Pet', '🐾', '#d946ef', 'expense'),
    ('cat-presentes', 'Presentes', '🎁', '#f472b6', 'expense'),
    ('cat-viagem', 'Viagem', '✈️', '#0ea5e9', 'expense'),
    ('cat-impostos', 'Impostos e Taxas', '🏛️', '#64748b', 'expense'),
    ('cat-seguros', 'Seguros', '🛡️', '#475569', 'expense'),
    ('cat-outros-desp', 'Outros', '📦', '#94a3b8', 'expense'),

-- Income categories
    ('cat-salario', 'Salário', '💰', '#10b981', 'income'),
    ('cat-freelance', 'Freelance', '💻', '#14b8a6', 'income'),
    ('cat-investimento', 'Rendimentos', '📈', '#06b6d4', 'income'),
    ('cat-aluguel-rec', 'Aluguel Recebido', '🏘️', '#0891b2', 'income'),
    ('cat-vendas', 'Vendas', '🏷️', '#059669', 'income'),
    ('cat-bonus', 'Bônus', '🎉', '#65a30d', 'income'),
    ('cat-restituicao', 'Restituição', '🔄', '#2563eb', 'income'),
    ('cat-outros-rec', 'Outros', '📥', '#78716c', 'income');
