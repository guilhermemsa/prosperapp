import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Settings,
  Smile,
  Wallet,
  ArrowLeftRight,
  Tags,
  Palette
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

import { transactionService } from "@/services/transaction"
import { accountService } from "@/services/account"
import { categoryService } from "@/services/category"
import { useThemeStore } from '@/store/theme'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { setTheme, setThemeColor } = useThemeStore()

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getTransactions(),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou busque por algo..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Sugestões">
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate({ to: '/transactions' }))
              }
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <span>Nova Transação</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate({ to: '/accounts' }))}
            >
              <Wallet className="mr-2 h-4 w-4" />
              <span>Nova Conta</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => navigate({ to: '/categories' }))}
            >
              <Tags className="mr-2 h-4 w-4" />
              <span>Gerenciar Categorias</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />

          {accounts.length > 0 && (
            <>
              <CommandGroup heading="Contas">
                {accounts.map((acc) => (
                  <CommandItem
                    key={acc.id}
                    onSelect={() =>
                      runCommand(() => navigate({ to: '/accounts' }))
                    }
                  >
                    <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{acc.name}</span>
                    <span className="ml-auto text-muted-foreground text-xs">
                      Conta
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {categories.length > 0 && (
            <>
              <CommandGroup heading="Categorias">
                {categories.map((cat) => (
                  <CommandItem
                    key={cat.id}
                    onSelect={() =>
                      runCommand(() => navigate({ to: '/categories' }))
                    }
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-3"
                      style={{ backgroundColor: cat.color || '#ccc' }}
                    />
                    <span>{cat.name}</span>
                    <span className="ml-auto text-muted-foreground text-xs">
                      Categoria
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {transactions.length > 0 && (
            <>
              <CommandGroup heading="Transações Recentes">
                {transactions.slice(0, 500).map((tx) => (
                  <CommandItem
                    key={tx.id}
                    value={`${tx.description || ''} ${tx.tags || ''}`}
                    onSelect={() =>
                      runCommand(() => navigate({ to: '/transactions' }))
                    }
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{tx.description || 'Sem descrição'}</span>
                      <span className="text-xs text-muted-foreground">
                        {tx.type === 'income' ? '+' : '-'} R${' '}
                        {tx.amount.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Configurações">
            <CommandItem
              onSelect={() => runCommand(() => navigate({ to: '/settings' }))}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações Gerais</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Smile className="mr-2 h-4 w-4" />
              <span>Modo Claro</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Smile className="mr-2 h-4 w-4" />
              <span>Modo Escuro</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Smile className="mr-2 h-4 w-4" />
              <span>Modo do Sistema</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setThemeColor('zinc'))}
            >
              <Palette className="mr-2 h-4 w-4" />
              <span>Cor: Cinza (Padrão)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setThemeColor('rose'))}
            >
              <Palette className="mr-2 h-4 w-4 text-rose-500" />
              <span>Cor: Rosa</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setThemeColor('blue'))}
            >
              <Palette className="mr-2 h-4 w-4 text-blue-500" />
              <span>Cor: Azul</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setThemeColor('green'))}
            >
              <Palette className="mr-2 h-4 w-4 text-emerald-500" />
              <span>Cor: Verde</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => setThemeColor('orange'))}
            >
              <Palette className="mr-2 h-4 w-4 text-orange-500" />
              <span>Cor: Laranja</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
