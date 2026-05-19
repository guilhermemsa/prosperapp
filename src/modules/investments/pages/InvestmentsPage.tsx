import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { investmentService } from '@/services/investment'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const InvestmentsPage = () => {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [updatePriceId, setUpdatePriceId] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState(0)
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null)
  const [newInv, setNewInv] = useState({
    name: '',
    type: 'stock',
    ticker: '',
    quantity: 0,
    average_price: 0,
    current_price: 0,
  })

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: investmentService.getInvestments,
  })

  const createMutation = useMutation({
    mutationFn: investmentService.createInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      setIsDialogOpen(false)
      setNewInv({
        name: '',
        type: 'stock',
        ticker: '',
        quantity: 0,
        average_price: 0,
        current_price: 0,
      })
    },
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      investmentService.updatePrice(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      setUpdatePriceId(null)
      setNewPrice(0)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: investmentService.deleteInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      setDeleteInvId(null)
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      ...newInv,
      ticker: newInv.ticker || undefined,
    })
  }

  const totalInvested =
    investments?.reduce(
      (acc, inv) => acc + inv.quantity * inv.average_price,
      0,
    ) || 0
  const currentEquity =
    investments?.reduce(
      (acc, inv) => acc + inv.quantity * inv.current_price,
      0,
    ) || 0
  const totalProfit = currentEquity - totalInvested
  const profitPercentage =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground">
            Acompanhe sua carteira e rentabilidade.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={18} />
              Novo Ativo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Investimento</DialogTitle>
              <DialogDescription>
                Registre um novo ativo na sua carteira.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Petrobras"
                    value={newInv.name}
                    onChange={(e) =>
                      setNewInv({ ...newInv, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ticker (Opcional)</Label>
                  <Input
                    placeholder="Ex: PETR4"
                    value={newInv.ticker}
                    onChange={(e) =>
                      setNewInv({ ...newInv, ticker: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={newInv.type}
                  onValueChange={(v) => setNewInv({ ...newInv, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Ações</SelectItem>
                    <SelectItem value="fii">FIIs</SelectItem>
                    <SelectItem value="crypto">Cripto</SelectItem>
                    <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    value={newInv.quantity}
                    onChange={(e) =>
                      setNewInv({
                        ...newInv,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Preço Médio</Label>
                  <Input
                    type="number"
                    value={newInv.average_price}
                    onChange={(e) =>
                      setNewInv({
                        ...newInv,
                        average_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Preço Atual</Label>
                  <Input
                    type="number"
                    value={newInv.current_price}
                    onChange={(e) =>
                      setNewInv({
                        ...newInv,
                        current_price: parseFloat(e.target.value) || 0,
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/70 text-white/70">
              Patrimônio Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R${' '}
              {currentEquity.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-white/50 mt-1">
              Total investido: R${' '}
              {totalInvested.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro/Prejuízo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-3xl font-bold flex items-center gap-2',
                totalProfit >= 0 ? 'text-green-500' : 'text-red-500',
              )}
            >
              {totalProfit >= 0 ? (
                <TrendingUp size={24} />
              ) : (
                <TrendingDown size={24} />
              )}
              R${' '}
              {Math.abs(totalProfit).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <p
              className={cn(
                'text-xs font-semibold mt-1',
                totalProfit >= 0 ? 'text-green-500' : 'text-red-500',
              )}
            >
              {totalProfit >= 0 ? '+' : ''}
              {profitPercentage.toFixed(2)}% de rentabilidade
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <PieChart size={32} className="text-primary" />
              <div className="space-y-2 flex-1">
                {(() => {
                  const typeLabels: Record<string, string> = {
                    stock: 'Ações',
                    fii: 'FIIs',
                    crypto: 'Cripto',
                    fixed_income: 'Renda Fixa',
                  }
                  const typeColors: Record<string, string> = {
                    stock: 'bg-blue-500',
                    fii: 'bg-emerald-500',
                    crypto: 'bg-amber-500',
                    fixed_income: 'bg-violet-500',
                  }
                  const groups: Record<string, number> = {}
                  investments?.forEach((inv) => {
                    const value = inv.quantity * inv.current_price
                    groups[inv.type] = (groups[inv.type] || 0) + value
                  })
                  const entries = Object.entries(groups)
                  if (entries.length === 0)
                    return (
                      <p className="text-xs text-muted-foreground">
                        Nenhum ativo registrado.
                      </p>
                    )
                  return entries.map(([type, value]) => {
                    const pct =
                      currentEquity > 0 ? (value / currentEquity) * 100 : 0
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-xs">
                          <span>{typeLabels[type] || type}</span>
                          <span className="font-bold">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              typeColors[type] || 'bg-primary',
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Preço Médio</TableHead>
              <TableHead className="text-right">Preço Atual</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Carregando investimentos...
                </TableCell>
              </TableRow>
            ) : investments?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  Nenhum investimento registrado.
                </TableCell>
              </TableRow>
            ) : (
              investments?.map((inv) => {
                const total = inv.quantity * inv.current_price
                const cost = inv.quantity * inv.average_price
                const profit = total - cost
                const profitP = cost > 0 ? (profit / cost) * 100 : 0

                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{inv.ticker || inv.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {inv.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{inv.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      R$ {inv.average_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {inv.current_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {total.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right',
                        profit >= 0 ? 'text-green-500' : 'text-red-500',
                      )}
                    >
                      <p className="font-bold">R$ {profit.toFixed(2)}</p>
                      <p className="text-[10px]">
                        {profit >= 0 ? '+' : ''}
                        {profitP.toFixed(2)}%
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setUpdatePriceId(inv.id)
                            setNewPrice(inv.current_price)
                          }}
                          title="Atualizar preço"
                        >
                          <RefreshCw size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-500"
                          onClick={() => setDeleteInvId(inv.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Atualizar Preço */}
      <Dialog
        open={!!updatePriceId}
        onOpenChange={(open) => {
          if (!open) setUpdatePriceId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={20} className="text-primary" />
              Atualizar Preço
            </DialogTitle>
            <DialogDescription>
              Informe o preço atual do ativo para recalcular a rentabilidade.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Novo Preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatePriceId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                updatePriceId &&
                updatePriceMutation.mutate({
                  id: updatePriceId,
                  price: newPrice,
                })
              }
              disabled={updatePriceMutation.isPending || newPrice <= 0}
            >
              {updatePriceMutation.isPending ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Deleção */}
      <Dialog
        open={!!deleteInvId}
        onOpenChange={(open) => {
          if (!open) setDeleteInvId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Investimento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este investimento? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteInvId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteInvId && deleteMutation.mutate(deleteInvId)}
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
