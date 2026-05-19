import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, CalendarDays } from 'lucide-react'
import { BankIcon } from '@/components/BankIcon'
import { MoneyInput } from '@/components/MoneyInput'
import { creditCardService } from '@/services/credit_card'
import { accountService } from '@/services/account'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export const CreditCardsPage = () => {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null)
  const [newCard, setNewCard] = useState({
    name: '',
    limit_amount: 0,
    closing_day: 1,
    due_day: 10,
    account_id: '',
  })

  const { data: cards, isLoading } = useQuery({
    queryKey: ['credit_cards'],
    queryFn: creditCardService.getCreditCards,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const createMutation = useMutation({
    mutationFn: creditCardService.createCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards'] })
      setIsDialogOpen(false)
      setNewCard({
        name: '',
        limit_amount: 0,
        closing_day: 1,
        due_day: 10,
        account_id: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: creditCardService.deleteCreditCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards'] })
      setDeleteCardId(null)
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      ...newCard,
      account_id: newCard.account_id || undefined,
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cartões de Crédito
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus cartões, limites e faturas.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Cartão</DialogTitle>
              <DialogDescription>
                Configure os detalhes do seu novo cartão de crédito.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Cartão</Label>
                <Input
                  placeholder="Ex: Nubank, Visa Infinite"
                  value={newCard.name}
                  onChange={(e) =>
                    setNewCard({ ...newCard, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Limite</Label>
                  <MoneyInput
                    value={newCard.limit_amount}
                    onChange={(val) =>
                      setNewCard({ ...newCard, limit_amount: val })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Conta Vinculada (Opcional)</Label>
                  <Select
                    value={newCard.account_id || 'none'}
                    onValueChange={(v) =>
                      setNewCard({
                        ...newCard,
                        account_id: v === 'none' ? '' : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Dia de Fechamento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={newCard.closing_day}
                    onChange={(e) =>
                      setNewCard({
                        ...newCard,
                        closing_day: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dia de Vencimento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={newCard.due_day}
                    onChange={(e) =>
                      setNewCard({
                        ...newCard,
                        due_day: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
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
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <p>Carregando cartões...</p>
        ) : cards?.length === 0 ? (
          <p className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
            Nenhum cartão cadastrado.
          </p>
        ) : (
          cards?.map((card) => (
            <Card
              key={card.id}
              className="group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <BankIcon
                    name={card.name}
                    size={32}
                    className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0"
                  />
                  <CardTitle className="text-xl font-bold">
                    {card.name}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/50 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteCardId(card.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-xs text-white/60 uppercase font-semibold tracking-wider">
                    Limite Disponível
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    R${' '}
                    {card.limit_amount.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </div>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-white/40" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold">
                        Fechamento
                      </p>
                      <p className="text-sm font-medium">
                        Dia {card.closing_day}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-white/40" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold">
                        Vencimento
                      </p>
                      <p className="text-sm font-medium">Dia {card.due_day}</p>
                    </div>
                  </div>
                </div>
                {card.account_id && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-bold">
                      Conta de Débito
                    </p>
                    <p className="text-xs font-medium">
                      {accounts?.find((a) => a.id === card.account_id)?.name}
                    </p>
                  </div>
                )}
              </CardContent>
              {/* Card visual elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Confirmação de Deleção */}
      <Dialog
        open={!!deleteCardId}
        onOpenChange={(open) => {
          if (!open) setDeleteCardId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cartão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este cartão de crédito? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCardId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteCardId && deleteMutation.mutate(deleteCardId)
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
