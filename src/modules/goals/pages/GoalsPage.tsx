import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Target, Trash2, Calendar, PiggyBank } from 'lucide-react'
import { goalService } from '@/services/goal'
import { MoneyInput } from '@/components/MoneyInput'
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
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'

export const GoalsPage = () => {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState(0)
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: 0,
    current_amount: 0,
    deadline: '',
    color: '#2563eb',
  })

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalService.getGoals,
  })

  const createMutation = useMutation({
    mutationFn: goalService.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setIsDialogOpen(false)
      setNewGoal({
        name: '',
        target_amount: 0,
        current_amount: 0,
        deadline: '',
        color: '#2563eb',
      })
    },
  })

  const updateAmountMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      goalService.updateAmount(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setDepositGoalId(null)
      setDepositAmount(0)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: goalService.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setDeleteGoalId(null)
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      ...newGoal,
      deadline: newGoal.deadline || undefined,
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground">
            Defina e acompanhe seus objetivos financeiros.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                O que você deseja conquistar?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Objetivo</Label>
                <Input
                  placeholder="Ex: Viagem para o Japão, Carro Novo"
                  value={newGoal.name}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor Alvo</Label>
                  <MoneyInput
                    value={newGoal.target_amount}
                    onChange={(val) =>
                      setNewGoal({ ...newGoal, target_amount: val })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Valor Já Salvo</Label>
                  <MoneyInput
                    value={newGoal.current_amount}
                    onChange={(val) =>
                      setNewGoal({ ...newGoal, current_amount: val })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Data Limite (Opcional)</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, deadline: e.target.value })
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
                Criar Meta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <p>Carregando metas...</p>
        ) : goals?.length === 0 ? (
          <p className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
            Nenhuma meta definida. Qual é o seu próximo grande sonho?
          </p>
        ) : (
          goals?.map((goal) => {
            const progress =
              goal.target_amount > 0
                ? (goal.current_amount / goal.target_amount) * 100
                : 0
            const remaining = goal.target_amount - goal.current_amount

            return (
              <Card key={goal.id} className="relative overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Target size={20} />
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {goal.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary"
                      onClick={() => {
                        setDepositGoalId(goal.id)
                        setDepositAmount(0)
                      }}
                    >
                      <PiggyBank size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => setDeleteGoalId(goal.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold">
                        R$ {goal.current_amount.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        de R$ {goal.target_amount.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {Math.min(progress, 100).toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        concluído
                      </p>
                    </div>
                  </div>

                  <Progress value={Math.min(progress, 100)} className="h-2" />

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar size={12} />
                      {goal.deadline
                        ? format(new Date(goal.deadline), 'dd/MM/yyyy')
                        : 'Sem prazo'}
                    </div>
                    <p className="font-medium">
                      {remaining > 0
                        ? `Faltam R$ ${remaining.toLocaleString('pt-BR')}`
                        : '✅ Meta atingida!'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog de Depósito */}
      <Dialog
        open={!!depositGoalId}
        onOpenChange={(open) => {
          if (!open) setDepositGoalId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank size={20} className="text-primary" />
              Depositar na Meta
            </DialogTitle>
            <DialogDescription>
              Quanto você deseja adicionar a esta meta?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Valor do Depósito</Label>
            <MoneyInput value={depositAmount} onChange={setDepositAmount} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositGoalId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                depositGoalId &&
                updateAmountMutation.mutate({
                  id: depositGoalId,
                  amount: depositAmount,
                })
              }
              disabled={updateAmountMutation.isPending || depositAmount <= 0}
            >
              {updateAmountMutation.isPending ? 'Depositando...' : 'Depositar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Deleção */}
      <Dialog
        open={!!deleteGoalId}
        onOpenChange={(open) => {
          if (!open) setDeleteGoalId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Meta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGoalId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteGoalId && deleteMutation.mutate(deleteGoalId)
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
