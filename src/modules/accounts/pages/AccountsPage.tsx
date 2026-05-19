import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { BankIcon } from '@/components/BankIcon'
import { MoneyInput } from '@/components/MoneyInput'
import { accountService } from '@/services/account'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const AccountsPage = () => {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank',
    balance: 0,
    currency: 'BRL',
  })

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const createMutation = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsDialogOpen(false)
      setNewAccount({ name: '', type: 'bank', balance: 0, currency: 'BRL' })
    },
    onError: (error) => {
      console.error('Failed to create account:', error)
      alert(`Erro ao criar conta: ${error}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: accountService.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setDeleteAccountId(null)
    },
  })

  const handleCreate = () => {
    createMutation.mutate(newAccount)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e carteiras.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Conta</DialogTitle>
              <DialogDescription>
                Adicione uma nova conta bancária ou carteira para começar a
                registrar transações.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Nubank, Carteira Principal"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newAccount.type}
                  onValueChange={(v) =>
                    setNewAccount({ ...newAccount, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Conta Corrente</SelectItem>
                    <SelectItem value="savings">
                      Poupança / Investimento
                    </SelectItem>
                    <SelectItem value="wallet">Dinheiro / Carteira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="balance">Saldo Inicial</Label>
                <MoneyInput
                  id="balance"
                  value={newAccount.balance}
                  onChange={(val) =>
                    setNewAccount({ ...newAccount, balance: val })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Conta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Carregando contas...</p>
        ) : accounts?.length === 0 ? (
          <p className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
            Nenhuma conta encontrada. Crie sua primeira conta para começar.
          </p>
        ) : (
          accounts?.map((account) => {
            return (
              <Card key={account.id} className="group overflow-hidden relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
                  <div className="flex items-center gap-3">
                    <BankIcon name={account.name} type={account.type} />
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {account.name}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {account.type === 'bank'
                          ? 'Conta Corrente'
                          : account.type === 'savings'
                            ? 'Poupança'
                            : 'Carteira'}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => setDeleteAccountId(account.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground font-medium">
                      Saldo Atual
                    </p>
                    <h3 className="text-2xl font-bold">
                      R${' '}
                      {account.balance.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog de Confirmação de Deleção */}
      <Dialog
        open={!!deleteAccountId}
        onOpenChange={(open) => {
          if (!open) setDeleteAccountId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Conta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta conta? Todas as transações
              associadas poderão ficar sem conta vinculada. Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccountId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteAccountId && deleteMutation.mutate(deleteAccountId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
