import { describe, it, expect, vi, beforeEach } from 'vitest'
import { categoryService } from './category'
import { invoke } from '@tauri-apps/api/core'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('Category Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call get_categories', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await categoryService.getCategories()
    expect(invoke).toHaveBeenCalledWith('get_categories')
  })

  it('should call create_category', async () => {
    const payload = { name: 'Test', color: '#000', icon: 'test' }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...payload })
    await categoryService.createCategory(payload)
    expect(invoke).toHaveBeenCalledWith('create_category', payload)
  })

  it('should call update_category', async () => {
    const payload = { name: 'Test Updated' }
    vi.mocked(invoke).mockResolvedValueOnce({ id: '1', ...payload })
    await categoryService.updateCategory('1', payload)
    expect(invoke).toHaveBeenCalledWith('update_category', {
      id: '1',
      ...payload,
    })
  })

  it('should call delete_category', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await categoryService.deleteCategory('1')
    expect(invoke).toHaveBeenCalledWith('delete_category', { id: '1' })
  })
})
