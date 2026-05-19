import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Trash2,
  AlertTriangle,
  Pencil,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { transactionService } from '@/services/transaction'
import { recurringService } from '@/services/recurring'
import { accountService } from '@/services/account'
import { categoryService } from '@/services/category'
import { BankIcon } from '@/components/BankIcon'
import { MoneyInput } from '@/components/MoneyInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Transaction } from '@/shared/types'

export const TransactionsPage = () => {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [date, setDate] = useState<Date>(new Date())
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [intervalType, setIntervalType] = useState('monthly')
  const [page, setPage] = useState(1)
  const limit = 10
  const [newTransaction, setNewTransaction] = useState({
    account_id: '',
    category_id: '',
    amount: 0,
    type: 'expense',
    description: '',
    tags: '',
    to_account_id: '',
  })

  const { data: paginatedData, isLoading: loadingTransactions } = useQuery({
    queryKey: [
      'transactions',
      page,
      limit,
      searchTerm,
      typeFilter,
      accountFilter,
    ],
    queryFn: () =>
      transactionService.getPaginatedTransactions(
        limit,
        (page - 1) * limit,
        accountFilter,
        searchTerm,
        typeFilter,
      ),
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const resetForm = () => {
    setNewTransaction({
      account_id: '',
      category_id: '',
      amount: 0,
      type: 'expense',
      description: '',
      tags: '',
      to_account_id: '',
    })
    setDate(new Date())
    setEditTargetId(null)
    setIsRecurring(false)
    setIntervalType('monthly')
  }

  const createTransferMutation = useMutation({
    mutationFn: (data: any) =>
      transactionService.createTransfer(
        data.account_id,
        data.to_account_id,
        data.amount,
        data.description,
        data.date,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', page, limit] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Failed to create transfer:', error)
      alert(`Erro ao transferir: ${error}`)
    },
  })

  const createMutation = useMutation({
    mutationFn: transactionService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error)
      alert(`Erro ao criar transação: ${error}`)
    },
  })

  const createRecurringMutation = useMutation({
    mutationFn: recurringService.createRecurringRule,
    onSuccess: async () => {
      await recurringService.processRecurringTransactions()
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Failed to create recurring rule:', error)
      alert(`Erro ao criar transação recorrente: ${error}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      transactionService.updateTransaction(editTargetId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Failed to update transaction:', error)
      alert(`Erro ao atualizar transação: ${error}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: transactionService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setDeleteTarget(null)
    },
    onError: (error) => {
      console.error('Failed to delete transaction:', error)
      setDeleteTarget(null)
    },
  })

  const handleSubmit = () => {
    const payload = {
      ...newTransaction,
      category_id: newTransaction.category_id || undefined,
      description: newTransaction.description || undefined,
      tags: newTransaction.tags || undefined,
      date: date.toISOString(),
    }
    if (editTargetId) {
      updateMutation.mutate(payload)
    } else if (newTransaction.type === 'transfer') {
      createTransferMutation.mutate(payload)
    } else if (isRecurring) {
      createRecurringMutation.mutate({
        ...payload,
        interval_type: intervalType,
        interval_value: 1,
      } as any)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEditClick = (tx: Transaction) => {
    setEditTargetId(tx.id)
    setNewTransaction({
      account_id: tx.account_id,
      category_id: tx.category_id || '',
      amount: tx.amount,
      type: tx.type,
      description: tx.description || '',
      tags: tx.tags || '',
      to_account_id: '',
    })
    setDate(new Date(tx.date))
    setIsDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Histórico completo de suas movimentações financeiras.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editTargetId ? 'Editar Transação' : 'Nova Transação'}
              </DialogTitle>
              <DialogDescription>
                {editTargetId
                  ? 'Edite os detalhes da sua transação.'
                  : 'Registre uma nova entrada ou saída de valores.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(v) =>
                      setNewTransaction({ ...newTransaction, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Valor</Label>
                  <MoneyInput
                    value={newTransaction.amount}
                    onChange={(val) =>
                      setNewTransaction({ ...newTransaction, amount: val })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>
                  {newTransaction.type === 'transfer'
                    ? 'Conta de Origem'
                    : 'Conta'}
                </Label>
                <Select
                  value={newTransaction.account_id || undefined}
                  onValueChange={(v) =>
                    setNewTransaction({ ...newTransaction, account_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newTransaction.type === 'transfer' && (
                <div className="grid gap-2 animate-in slide-in-from-top-2">
                  <Label>Conta de Destino</Label>
                  <Select
                    value={(newTransaction as any).to_account_id || undefined}
                    onValueChange={(v) =>
                      setNewTransaction({
                        ...newTransaction,
                        to_account_id: v,
                      } as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        ?.filter((a) => a.id !== newTransaction.account_id)
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newTransaction.type !== 'transfer' && (
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newTransaction.category_id || undefined}
                    onValueChange={(v) =>
                      setNewTransaction({ ...newTransaction, category_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        ?.filter((cat) => cat.type === newTransaction.type)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Almoço, Salário..."
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!editTargetId && (
                <div className="flex items-center space-x-2 pt-2 border-t mt-2">
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                  <Label htmlFor="recurring">Repetir esta transação</Label>
                </div>
              )}

              {isRecurring && !editTargetId && (
                <div className="grid gap-2 animate-in slide-in-from-top-2">
                  <Label>Frequência</Label>
                  <Select value={intervalType} onValueChange={setIntervalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="yearly">Anualmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending ||
                  updateMutation?.isPending ||
                  createRecurringMutation.isPending ||
                  !newTransaction.account_id ||
                  (newTransaction.type === 'transfer' &&
                    !(newTransaction as any).to_account_id)
                }
              >
                {editTargetId ? 'Salvar Alterações' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            className="pl-10"
            placeholder="Buscar por descrição ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Filtros
              {(typeFilter !== 'all' || accountFilter !== 'all') && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0.5 text-[10px]"
                >
                  Ativo
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filtros</h4>
                <p className="text-sm text-muted-foreground">
                  Refine a lista de transações.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type-filter">Tipo de Transação</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-filter">Conta</Label>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger id="account-filter">
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(typeFilter !== 'all' || accountFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter('all')
                    setAccountFilter('all')
                  }}
                  className="mt-2 text-xs"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingTransactions ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando transações...
                </TableCell>
              </TableRow>
            ) : paginatedData?.items?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  Nenhuma transação registrada.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData?.items?.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.date), 'dd MMM yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.description || 'Sem descrição'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BankIcon
                          name={
                            accounts?.find((a) => a.id === tx.account_id)
                              ?.name || ''
                          }
                          size={16}
                          className="w-5 h-5 rounded bg-secondary flex items-center justify-center shrink-0"
                        />
                        <Badge variant="outline">
                          {accounts?.find((a) => a.id === tx.account_id)
                            ?.name || 'Desconhecida'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(() => {
                          const cat = categories?.find(
                            (c) => c.id === tx.category_id,
                          )
                          if (cat) return `${cat.icon || ''} ${cat.name}`
                          return tx.tags || 'Sem categoria'
                        })()}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold',
                        tx.type === 'expense'
                          ? 'text-red-500'
                          : 'text-green-500',
                      )}
                    >
                      {tx.type === 'expense' ? '-' : '+'} R${' '}
                      {tx.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        onClick={() => handleEditClick(tx)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(tx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Página {page} de{' '}
          {Math.max(1, Math.ceil((paginatedData?.total || 0) / limit))} (Total:{' '}
          {paginatedData?.total || 0} transações)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loadingTransactions}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={
              !paginatedData ||
              page >= Math.ceil(paginatedData.total / limit) ||
              loadingTransactions
            }
          >
            Próxima
          </Button>
        </div>
      </div>
      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Excluir Transação
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? O saldo da conta
              será revertido automaticamente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Descrição</span>
                <span className="text-sm font-medium">
                  {deleteTarget.description || 'Sem descrição'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    deleteTarget.type === 'expense'
                      ? 'text-red-500'
                      : 'text-green-500',
                  )}
                >
                  {deleteTarget.type === 'expense' ? '-' : '+'} R${' '}
                  {deleteTarget.amount.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm">
                  {format(new Date(deleteTarget.date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              <Trash2 size={16} />
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Transação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
