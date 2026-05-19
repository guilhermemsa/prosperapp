import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { format, subMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { transactionService } from '@/services/transaction'
import { categoryService } from '@/services/category'
import { accountService } from '@/services/account'
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

export const ReportsPage = () => {
  const [monthsBack, setMonthsBack] = useState(6)

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getTransactions(),
  })

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const { data: accounts = [], isLoading: loadingAcc } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const now = new Date()

  // 1. Gráfico de Pizza por Categoria (Mês Atual)
  const currentMonthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && isSameMonth(new Date(tx.date), now),
  )

  const expensesByCategory = currentMonthExpenses.reduce(
    (acc, tx) => {
      const catId = tx.category_id || 'uncategorized'
      acc[catId] = (acc[catId] || 0) + tx.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(expensesByCategory)
    .map(([id, amount]) => {
      const cat = categories.find((c) => c.id === id)
      return {
        name: cat ? cat.name : 'Sem Categoria',
        value: amount,
        color: cat?.color || '#cbd5e1',
      }
    })
    .sort((a, b) => b.value - a.value)

  // 2. Comparativo Mês a Mês
  const barData = Array.from({ length: monthsBack }).map((_, i) => {
    const d = subMonths(now, monthsBack - 1 - i)
    const monthTxs = transactions.filter((tx) =>
      isSameMonth(new Date(tx.date), d),
    )

    const income = monthTxs
      .filter((tx) => tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const expense = monthTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0)

    return {
      name: format(d, 'MMM/yy', { locale: ptBR }),
      Receitas: income,
      Despesas: expense,
    }
  })

  // 3. Ranking de Maiores Gastos (Mês Atual)
  const topExpenses = [...currentMonthExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // 4. Evolução Patrimonial (Simplificada: Saldo atual - despesas passadas + receitas passadas)
  // Como não temos um snapshot do saldo histórico, faremos uma projeção regressiva a partir do saldo atual
  const currentTotalBalance = accounts.reduce((acc, a) => acc + a.balance, 0)

  let runningBalance = currentTotalBalance
  const areaData = []

  // Calcular de tráz pra frente e depois inverter
  for (let i = 0; i < monthsBack; i++) {
    const d = subMonths(now, i)
    areaData.unshift({
      name: format(d, 'MMM/yy', { locale: ptBR }),
      Patrimonio: runningBalance,
    })

    // Para encontrar o saldo do mês anterior, subtraímos as receitas deste mês e somamos as despesas deste mês
    const monthTxs = transactions.filter((tx) =>
      isSameMonth(new Date(tx.date), d),
    )
    const income = monthTxs
      .filter((tx) => tx.type === 'income')
      .reduce((acc, tx) => acc + tx.amount, 0)
    const expense = monthTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0)

    runningBalance = runningBalance - income + expense
  }

  const isLoading = loadingTx || loadingCat || loadingAcc

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">Carregando relatórios...</div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise avançada das suas finanças.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select
            value={monthsBack.toString()}
            onValueChange={(v) => setMonthsBack(Number(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Evolução Patrimonial */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Patrimonial</CardTitle>
            <CardDescription>
              Crescimento do seu saldo total ao longo do tempo (projeção baseada
              em transações).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorPatrimonio"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    formatter={(value: any) =>
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="Patrimonio"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPatrimonio)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>
              Mês atual ({format(now, 'MMMM', { locale: ptBR })})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) =>
                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma despesa no mês atual.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparativo Mês a Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Fluxo</CardTitle>
            <CardDescription>
              Receitas vs Despesas nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) =>
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="Receitas"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Despesas"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ranking de Maiores Gastos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Maiores Gastos do Mês</CardTitle>
            <CardDescription>
              As 5 maiores transações de despesa do mês atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topExpenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topExpenses.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.category_id)
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">
                          {tx.description || 'Sem descrição'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat?.color || '#ccc' }}
                            />
                            {cat ? cat.name : 'Nenhuma'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(tx.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-500">
                          R${' '}
                          {tx.amount.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum gasto registrado neste mês.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
