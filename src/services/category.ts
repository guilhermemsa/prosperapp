import { invoke } from '@tauri-apps/api/core'

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  parent_id?: string
  type?: 'expense' | 'income'
  monthly_budget?: number
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    return await invoke('get_categories')
  },
  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    return await invoke('create_category', { ...category })
  },
  updateCategory: async (
    id: string,
    category: Partial<Category>,
  ): Promise<Category> => {
    return await invoke('update_category', { id, ...category })
  },
  deleteCategory: async (id: string): Promise<void> => {
    return await invoke('delete_category', { id })
  },
}
