import { useState, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  Loader2,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { importService } from '@/services/import'
import { accountService } from '@/services/account'
import { categoryService } from '@/services/category'
import { settingsService } from '@/services/settings'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ExtractedTransaction, CreateTransactionDto } from '@/shared/types'

type ImportState = 'upload' | 'processing' | 'review' | 'success'

interface ReviewTransaction extends ExtractedTransaction {
  selected: boolean
  account_id: string
  category_id: string
}

export const ImportPage = () => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ImportState>('upload')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [documentInfo, setDocumentInfo] = useState({ type: '', emitter: '' })
  const [transactions, setTransactions] = useState<ReviewTransaction[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  })

  const { data: apiKey } = useQuery({
    queryKey: ['settings', 'gemini_api_key'],
    queryFn: () => settingsService.getSetting('gemini_api_key'),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const hasApiKey = !!apiKey && apiKey.trim().length > 0

  const matchCategory = useCallback(
    (name?: string, txType?: string): string => {
      const fallback =
        txType === 'income' ? 'cat-outros-rec' : 'cat-outros-desp'
      if (!name || !categories?.length) return fallback
      const normalized = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      const filtered = categories.filter((c) => c.type === txType)
      const found = filtered.find((c) => {
        const catName = c.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        return (
          catName === normalized ||
          normalized.includes(catName) ||
          catName.includes(normalized)
        )
      })
      return found?.id || fallback
    },
    [categories],
  )

  const processFile = useCallback(
    async (filePath: string, name: string) => {
      setError('')
      setFileName(name)
      setState('processing')

      try {
        const result = await importService.importDocument(filePath)
        setDocumentInfo({
          type: result.document_type,
          emitter: result.emitter || '',
        })

        const defaultAccountId = accounts?.[0]?.id || ''
        setTransactions(
          result.transactions.map((tx) => ({
            ...tx,
            selected: true,
            account_id: defaultAccountId,
            category_id: matchCategory(tx.category, tx.type),
          })),
        )
        setState('review')
      } catch (err) {
        setError(`${err}`)
        setState('upload')
      }
    },
    [accounts, matchCategory],
  )

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'application/pdf',
      ]
      const isOfx =
        file.name.toLowerCase().endsWith('.ofx') ||
        file.name.toLowerCase().endsWith('.qif')
      if (
        !validTypes.includes(file.type) &&
        !file.name.toLowerCase().endsWith('.pdf') &&
        !isOfx
      ) {
        setError(
          'Formato não suportado. Use OFX, QIF, PDF ou imagens (JPG, PNG, WebP).',
        )
        return
      }

      // In Tauri context, we need to use the actual file path
      // For now, we'll read the file and use a temp approach
      // The Tauri file dialog will provide the actual path

      // We need the real file path for the backend
      // This will work when using the native file picker via Tauri dialog
      // For drag-and-drop, we'll need to write to a temp file
      const tempPath = `${file.name}`
      try {
        await processFile((file as any).path || tempPath, file.name)
      } catch {
        setError(
          'Para importar documentos, use o botão "Selecionar Arquivo" que acessa o file picker nativo.',
        )
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const handleSelectFile = useCallback(async () => {
    try {
      // Try Tauri's native dialog first
      const path = await open({
        multiple: false,
        filters: [
          {
            name: 'Documentos',
            extensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic'],
          },
        ],
      })
      if (path) {
        const name = (path as string).split('/').pop() || 'documento'
        await processFile(path as string, name)
      }
    } catch {
      // Fallback to HTML input
      fileInputRef.current?.click()
    }
  }, [processFile])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const toggleTransaction = (index: number) => {
    setTransactions((prev) =>
      prev.map((tx, i) =>
        i === index ? { ...tx, selected: !tx.selected } : tx,
      ),
    )
  }

  const removeTransaction = (index: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTransaction = (index: number, field: string, value: any) => {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, [field]: value } : tx)),
    )
  }

  const setAllAccountId = (accountId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => ({ ...tx, account_id: accountId })),
    )
  }

  const selectedCount = transactions.filter((tx) => tx.selected).length

  const handleConfirm = async () => {
    const selected = transactions.filter((tx) => tx.selected)
    if (selected.length === 0) return

    const batch: CreateTransactionDto[] = selected.map((tx) => ({
      account_id: tx.account_id,
      category_id: tx.category_id || undefined,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      date: tx.date,
    }))

    try {
      setIsSaving(true)
      const count = await importService.createTransactionsBatch(batch)
      setSavedCount(count)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setIsSuccessDialogOpen(true)
    } catch (err) {
      setError(`Erro ao salvar transações: ${err}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setState('upload')
    setTransactions([])
    setError('')
    setFileName('')
    setDocumentInfo({ type: '', emitter: '' })
    setIsSuccessDialogOpen(false)
  }

  const typeLabels: Record<string, string> = {
    fatura: 'Fatura',
    recibo: 'Recibo',
    extrato: 'Extrato Bancário',
    nota_fiscal: 'Nota Fiscal',
    boleto: 'Boleto',
    outro: 'Documento',
  }

  const confidenceColor = (c: number) => {
    if (c >= 0.9) return 'text-green-500'
    if (c >= 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  // --- NO API KEY STATE ---
  if (!hasApiKey) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Importação Inteligente
          </h1>
          <p className="text-muted-foreground">
            Importe documentos financeiros com inteligência artificial.
          </p>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Sparkles size={32} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">Configure a API do Gemini</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para usar a importação inteligente, você precisa configurar uma
              chave da API do Google Gemini nas Configurações.
            </p>
            <div className="pt-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Acesse{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  aistudio.google.com/apikey
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                2. Crie uma chave gratuita
              </p>
              <p className="text-sm text-muted-foreground">
                3. Cole a chave em Configurações → Inteligência Artificial
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- UPLOAD STATE ---
  if (state === 'upload') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Importação Inteligente
          </h1>
          <p className="text-muted-foreground">
            Importe documentos financeiros com inteligência artificial.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card
            className={cn(
              'border-2 border-dashed transition-all duration-200 cursor-pointer',
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border/60 hover:border-primary/50 hover:bg-accent/50',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleSelectFile}
          >
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <div
                className={cn(
                  'w-20 h-20 rounded-lg flex items-center justify-center mx-auto transition-colors',
                  dragActive ? 'bg-primary/20' : 'bg-primary/10',
                )}
              >
                <Upload size={36} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Arraste um documento aqui
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ou clique para selecionar um arquivo
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="secondary">OFX</Badge>
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">JPG</Badge>
                <Badge variant="secondary">PNG</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Extratos OFX, Faturas em PDF, recibos, comprovantes...
              </p>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.ofx,.qif"
            className="hidden"
            onChange={handleInputChange}
          />

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertCircle
                size={18}
                className="text-destructive shrink-0 mt-0.5"
              />
              <div>
                <p className="font-medium text-destructive">
                  Erro na importação
                </p>
                <p className="text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- PROCESSING STATE ---
  if (state === 'processing') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Importação Inteligente
          </h1>
          <p className="text-muted-foreground">
            Importe documentos financeiros com inteligência artificial.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-16 pb-16 text-center space-y-6">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 size={36} className="text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Analisando documento...</h3>
              <p className="text-sm text-muted-foreground mt-2">
                A IA está lendo{' '}
                <span className="font-medium text-foreground">{fileName}</span>{' '}
                e extraindo as transações.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Isso pode levar alguns segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- REVIEW STATE ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Revisar Importação
          </h1>
          <p className="text-muted-foreground">
            {documentInfo.emitter && (
              <span className="font-medium text-foreground">
                {documentInfo.emitter}
              </span>
            )}
            {documentInfo.emitter && ' · '}
            {typeLabels[documentInfo.type] || 'Documento'} ·{' '}
            {transactions.length} transaç
            {transactions.length === 1 ? 'ão' : 'ões'} encontrada
            {transactions.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <X size={16} className="mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving || selectedCount === 0}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Importar {selectedCount} transaç
                {selectedCount === 1 ? 'ão' : 'ões'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Account selector for all */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <Label className="shrink-0 font-medium">Conta destino:</Label>
        <Select
          value={transactions[0]?.account_id || ''}
          onValueChange={setAllAccountId}
        >
          <SelectTrigger className="max-w-xs">
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
        <p className="text-xs text-muted-foreground ml-auto">
          Aplicado a todas as transações selecionadas
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
          <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-destructive/80">{error}</p>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={transactions.every((tx) => tx.selected)}
                  onChange={(e) =>
                    setTransactions((prev) =>
                      prev.map((tx) => ({ ...tx, selected: e.target.checked })),
                    )
                  }
                  className="rounded"
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-16">Conf.</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow
                key={index}
                className={cn(!tx.selected && 'opacity-40')}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={tx.selected}
                    onChange={() => toggleTransaction(index)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <Input
                    type="date"
                    value={tx.date}
                    onChange={(e) =>
                      updateTransaction(index, 'date', e.target.value)
                    }
                    className="h-8 w-[140px] text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={tx.description}
                    onChange={(e) =>
                      updateTransaction(index, 'description', e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={tx.category_id}
                    onValueChange={(v) =>
                      updateTransaction(index, 'category_id', v)
                    }
                  >
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        ?.filter((cat) => cat.type === tx.type)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={tx.type}
                    onValueChange={(v) => updateTransaction(index, 'type', v)}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    step="0.01"
                    value={tx.amount}
                    onChange={(e) =>
                      updateTransaction(
                        index,
                        'amount',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className={cn(
                      'h-8 w-[120px] text-right text-sm font-bold ml-auto',
                      tx.type === 'expense' ? 'text-red-500' : 'text-green-500',
                    )}
                  />
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      confidenceColor(tx.confidence),
                    )}
                  >
                    {(tx.confidence * 100).toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTransaction(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="font-bold text-green-500">
              R${' '}
              {transactions
                .filter((tx) => tx.selected && tx.type === 'income')
                .reduce((acc, tx) => acc + tx.amount, 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="font-bold text-red-500">
              R${' '}
              {transactions
                .filter((tx) => tx.selected && tx.type === 'expense')
                .reduce((acc, tx) => acc + tx.amount, 0)
                .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedCount} de {transactions.length} selecionada
          {transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              Importação Concluída
            </DialogTitle>
            <DialogDescription>
              {savedCount} transaç
              {savedCount === 1 ? 'ão foi importada' : 'ões foram importadas'}{' '}
              com sucesso a partir do documento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>
              Importar Outro
            </Button>
            <Button
              onClick={() => {
                handleReset()
                window.location.href = '/transactions'
              }}
            >
              Ver Transações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
