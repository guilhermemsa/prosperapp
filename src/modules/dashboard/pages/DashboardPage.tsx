import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CreditCard,
  Calendar as CalendarIcon,
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { accountService } from '@/services/account'
import { transactionService } from '@/services/transaction'
import { creditCardService } from '@/services/credit_card'
import { categoryService } from '@/services/category'
import { goalService } from '@/services/goal'
import { cn } from '@/lib/utils'
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  differenceInDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BankIcon } from '@/components/BankIcon'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'

const StatCard = ({
  title,
  amount,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: any) => (
  <div
    className={cn(
      'p-6 rounded-lg shadow-sm border bg-card border-border',
      className,
    )}
  >
    <div className="flex items-center justify-between mb-6">
      <div
        className={cn(
          'p-2.5 rounded-md bg-secondary text-primary',
          iconClassName,
        )}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      {trend !== undefined && (
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded',
            trend >= 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700',
          )}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <h3 className="text-2xl font-bold tracking-tight text-foreground">
        R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </h3>
    </div>
  </div>
)

export const DashboardPage = () => {
  const [filterDate, setFilterDate] = useState<Date>(new Date())
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear())
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getTransactions(),
  })

  const { data: creditCards } = useQuery({
    queryKey: ['credit_cards'],
    queryFn: creditCardService.getCreditCards,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: goalService.getGoals,
  })

  const totalCreditLimit =
    creditCards?.reduce((acc, card) => acc + card.limit_amount, 0) || 0

  const totalBalance =
    accounts?.reduce((acc, curr) => acc + curr.balance, 0) || 0

  const monthStart = startOfMonth(filterDate)
  const monthEnd = endOfMonth(filterDate)

  const currentMonthTransactions =
    transactions?.filter((tx) =>
      isWithinInterval(new Date(tx.date), { start: monthStart, end: monthEnd }),
    ) || []

  const monthlyIncome = currentMonthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const monthlyExpense = currentMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  // Calcular orçamentos
  const budgetedCategories =
    categories?.filter((cat) => cat.monthly_budget && cat.monthly_budget > 0) ||
    []
  const categoryExpenses = budgetedCategories
    .map((cat) => {
      const spent = currentMonthTransactions
        .filter((tx) => tx.category_id === cat.id && tx.type === 'expense')
        .reduce((acc, tx) => acc + tx.amount, 0)

      const budget = cat.monthly_budget || 0
      const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
      const isOver = spent > budget
      const isNear = percentage >= 80 && !isOver

      return { ...cat, spent, budget, percentage, isOver, isNear }
    })
    .sort((a, b) => b.percentage - a.percentage)

  // Calcular notificações (Cartões e Metas)
  const notifications = (() => {
    const alerts: {
      id: string
      title: string
      desc: string
      type: 'warning' | 'danger'
      days: number
    }[] = []
    const today = new Date()

    // Faturas de Cartão
    creditCards?.forEach((card) => {
      if (card.due_day) {
        // Assume due date is in the current month or next depending on if passed
        let dueDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          card.due_day,
        )
        if (today.getDate() > card.due_day) {
          // Check for next month
          dueDate = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            card.due_day,
          )
        }

        const daysToDue = differenceInDays(dueDate, today)
        if (daysToDue >= 0 && daysToDue <= 7) {
          alerts.push({
            id: `card-${card.id}`,
            title: `Fatura: ${card.name}`,
            desc: `Vence em ${daysToDue === 0 ? 'hoje' : `${daysToDue} dias`} (Dia ${card.due_day}).`,
            type: daysToDue <= 3 ? 'danger' : 'warning',
            days: daysToDue,
          })
        }
      }
    })

    // Metas
    goals?.forEach((goal) => {
      if (goal.deadline) {
        const dl = new Date(goal.deadline)
        const daysToDeadline = differenceInDays(dl, today)

        // Alert if deadline is within 15 days and goal is not met
        if (
          daysToDeadline >= 0 &&
          daysToDeadline <= 15 &&
          goal.current_amount < goal.target_amount
        ) {
          alerts.push({
            id: `goal-${goal.id}`,
            title: `Meta: ${goal.name}`,
            desc: `Prazo encerra em ${daysToDeadline === 0 ? 'hoje' : `${daysToDeadline} dias`}.`,
            type: daysToDeadline <= 5 ? 'danger' : 'warning',
            days: daysToDeadline,
          })
        }
      }
    })

    return alerts.sort((a, b) => a.days - b.days)
  })()

  // Dados do gráfico — últimos 6 meses calculados a partir das transações reais
  const chartData = (() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        filterDate.getFullYear(),
        filterDate.getMonth() - i,
        1,
      )
      const mStart = startOfMonth(date)
      const mEnd = endOfMonth(date)

      const monthTxs =
        transactions?.filter((tx) =>
          isWithinInterval(new Date(tx.date), { start: mStart, end: mEnd }),
        ) || []

      const income = monthTxs
        .filter((tx) => tx.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0)

      const expense = monthTxs
        .filter((tx) => tx.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0)

      months.push({
        name: format(date, 'MMM', { locale: ptBR }).replace('.', ''),
        income,
        expense,
      })
    }
    return months
  })()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumo das suas finanças.
          </p>
        </div>
        <div>
          <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal text-sm',
                  !filterDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? (
                  format(filterDate, "MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione o mês</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <Button variant="ghost" size="icon" onClick={() => setPickerYear(y => y - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="font-semibold text-sm">{pickerYear}</span>
                <Button variant="ghost" size="icon" onClick={() => setPickerYear(y => y + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((m, i) => (
                  <Button 
                    key={m} 
                    variant={filterDate.getMonth() === i && filterDate.getFullYear() === pickerYear ? "default" : "outline"}
                    className="text-xs h-9"
                    onClick={() => {
                      setFilterDate(new Date(pickerYear, i, 1))
                      setIsMonthPickerOpen(false)
                    }}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Saldo Total" amount={totalBalance} icon={Wallet} />
        <StatCard
          title="Receitas (Mês)"
          amount={monthlyIncome}
          icon={ArrowUpCircle}
          trend={12}
        />
        <StatCard
          title="Despesas (Mês)"
          amount={monthlyExpense}
          icon={ArrowDownCircle}
          trend={-5}
        />
        <StatCard
          title="Limite Disponível"
          amount={totalCreditLimit}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold tracking-tight">Fluxo de Caixa</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Receitas
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Despesas
                </span>
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--card))',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '8px',
                  }}
                  itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                  labelStyle={{
                    fontWeight: 700,
                    marginBottom: '2px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: any) =>
                    `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Receitas"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Despesas"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-bold tracking-tight mb-6">
              Minhas Contas
            </h3>
            <div className="space-y-4">
              {accounts?.slice(0, 5).map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between group cursor-default border-b border-border/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
                      <BankIcon
                        name={acc.name}
                        size={20}
                        className="text-primary"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-none mb-1">
                        {acc.name}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {acc.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base tracking-tight text-foreground">
                      R${' '}
                      {acc.balance.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(!accounts || accounts.length === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Wallet className="text-muted-foreground/40" size={20} />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                    Nenhuma conta ativa
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-bold tracking-tight mb-6">
              Orçamentos
            </h3>
            <div className="space-y-5">
              {categoryExpenses.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#ccc' }}
                      />
                      {cat.name}
                    </span>
                    <span className="text-muted-foreground">
                      R${' '}
                      {cat.spent.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      /{' '}
                      {cat.budget.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={cat.percentage}
                      className="h-2 flex-1"
                      indicatorClassName={cn(
                        cat.isOver
                          ? 'bg-rose-500'
                          : cat.isNear
                            ? 'bg-amber-500'
                            : 'bg-emerald-500',
                      )}
                    />
                    {(cat.isOver || cat.isNear) && (
                      <AlertCircle
                        size={14}
                        className={
                          cat.isOver ? 'text-rose-500' : 'text-amber-500'
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
              {categoryExpenses.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Nenhum orçamento definido.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Notificações
            </h3>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex gap-3 items-start border-b border-border/50 pb-4 last:border-0 last:pb-0"
                >
                  <div
                    className={cn(
                      'mt-0.5 p-1.5 rounded-full shrink-0',
                      notif.type === 'danger'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-amber-100 text-amber-600',
                    )}
                  >
                    <AlertCircle size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none mb-1">
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notif.desc}
                    </p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Nenhuma notificação pendente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
