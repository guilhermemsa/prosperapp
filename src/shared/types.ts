export interface Account {
  id: string
  name: string
  type: 'bank' | 'wallet' | 'savings'
  balance: number
  currency: string
  created_at?: string
}

export interface CreateAccountDto {
  name: string
  type: string
  balance: number
  currency: string
}

export interface Transaction {
  id: string
  account_id: string
  category_id?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  description?: string
  date: string
  tags?: string
  created_at?: string
}

export interface CreateTransactionDto {
  account_id: string
  category_id?: string
  amount: number
  type: string
  description?: string
  date: string
  tags?: string
}

export interface UpdateTransactionDto {
  account_id?: string
  category_id?: string
  amount?: number
  type?: string
  description?: string
  date?: string
  tags?: string
}

export interface CreditCard {
  id: string
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  account_id?: string
}

export interface CreateCreditCardDto {
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  account_id?: string
}
export interface Investment {
  id: string
  name: string
  type: 'stock' | 'fii' | 'crypto' | 'fixed' | 'other'
  ticker?: string
  quantity: number
  average_price: number
  current_price: number
  created_at?: string
}

export interface CreateInvestmentDto {
  name: string
  type: string
  ticker?: string
  quantity: number
  average_price: number
}

export interface RecurringRule {
  id: string
  account_id: string
  category_id?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  description?: string
  interval_type: 'monthly' | 'weekly' | 'yearly'
  interval_value: number
  start_date: string
  next_date: string
  end_date?: string
  tags?: string
  created_at?: string
}

export interface CreateRecurringRuleDto {
  account_id: string
  category_id?: string
  amount: number
  type: string
  description?: string
  interval_type: string
  interval_value?: number
  start_date: string
  end_date?: string
  tags?: string
}

export interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string
  color?: string
  icon?: string
  created_at?: string
}

export interface CreateGoalDto {
  name: string
  target_amount: number
  current_amount: number
  deadline?: string
  color?: string
  icon?: string
}

export interface ExtractedTransaction {
  amount: number
  type: 'income' | 'expense'
  description: string
  date: string
  category?: string
  confidence: number
}

export interface ImportResult {
  document_type: string
  emitter?: string
  transactions: ExtractedTransaction[]
}
