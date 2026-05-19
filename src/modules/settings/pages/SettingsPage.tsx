import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth'
import { useThemeStore, Theme, ThemeColor } from '@/store/theme'
import { useNavigate } from '@tanstack/react-router'
import {
  LogOut,
  Save,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  FileDown,
} from 'lucide-react'
import { authService } from '@/services/auth'
import { settingsService } from '@/services/settings'
import { save } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'

export const SettingsPage = () => {
  const { theme, setTheme, themeColor, setThemeColor } = useThemeStore()
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [geminiModel, setGeminiModel] = useState('gemini-3.1-flash-lite')
  const queryClient = useQueryClient()

  const { data: savedApiKey } = useQuery({
    queryKey: ['settings', 'gemini_api_key'],
    queryFn: () => settingsService.getSetting('gemini_api_key'),
  })

  const { data: savedModel } = useQuery({
    queryKey: ['settings', 'gemini_model'],
    queryFn: () => settingsService.getSetting('gemini_model'),
  })

  useEffect(() => {
    if (savedApiKey) setApiKey(savedApiKey)
  }, [savedApiKey])

  useEffect(() => {
    if (savedModel) setGeminiModel(savedModel)
  }, [savedModel])
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccessDialogOpen, setResetSuccessDialogOpen] = useState(false)
  const { setAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handleSavePreferences = () => {
    localStorage.setItem('prosperapp_currency', 'BRL')
  }

  const handleLogout = () => {
    setAuthenticated(false)
    navigate({ to: '/login' })
  }

  const handleRequestPasswordChange = () => {
    setPasswordError('')
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    setIsConfirmDialogOpen(true)
  }

  const handleConfirmPasswordChange = async () => {
    try {
      setIsChangingPassword(true)
      setIsConfirmDialogOpen(false)
      await authService.changePassword(newPassword)
      setNewPassword('')
      setPasswordError('')
      setIsSuccessDialogOpen(true)
    } catch (error) {
      setErrorMessage(`${error}`)
      setIsErrorDialogOpen(true)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      const filePath = await save({
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        defaultPath: 'prosperapp_backup.csv',
      })
      if (filePath) {
        await invoke('export_csv', { filePath })
        setErrorMessage('Exportado com sucesso!')
        setIsSuccessDialogOpen(true)
      }
    } catch (error) {
      setErrorMessage(`${error}`)
      setIsErrorDialogOpen(true)
    } finally {
      setIsExporting(false)
    }
  }

  const handleResetDatabase = async () => {
    try {
      setIsResetting(true)
      setIsResetDialogOpen(false)
      await settingsService.resetDatabase()
      queryClient.invalidateQueries()
      setResetSuccessDialogOpen(true)
    } catch (error) {
      setErrorMessage(`${error}`)
      setIsErrorDialogOpen(true)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as preferências do seu aplicativo.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Geral</CardTitle>
            <CardDescription>Preferências básicas do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4 max-w-lg">
              <div className="grid gap-2">
                <Label htmlFor="theme">Aparência</Label>
                <Select
                  value={theme}
                  onValueChange={(v) => setTheme(v as Theme)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="theme-color">Cor Principal</Label>
                <Select
                  value={themeColor}
                  onValueChange={(v) => setThemeColor(v as ThemeColor)}
                >
                  <SelectTrigger id="theme-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zinc">Cinza (Padrão)</SelectItem>
                    <SelectItem value="rose">Rosa</SelectItem>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="orange">Laranja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="gap-2" onClick={handleSavePreferences}>
              <Save size={16} />
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-500" />
              Inteligência Artificial
            </CardTitle>
            <CardDescription>
              Configure a API do Gemini para importação inteligente de
              documentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-w-lg">
              <Label htmlFor="api-key">Chave da API do Gemini</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Cole sua API key aqui"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setApiKeySaved(false)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await settingsService.setSetting('gemini_api_key', apiKey)
                    queryClient.invalidateQueries({
                      queryKey: ['settings', 'gemini_api_key'],
                    })
                    setApiKeySaved(true)
                    setTimeout(() => setApiKeySaved(false), 3000)
                  }}
                  disabled={!apiKey.trim()}
                >
                  {apiKeySaved ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span className="ml-1.5">
                    {apiKeySaved ? 'Salvo' : 'Salvar'}
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtenha sua chave gratuita em{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  aistudio.google.com/apikey
                </a>
                . A chave fica armazenada de forma criptografada.
              </p>
            </div>

            <div className="grid gap-2 max-w-sm">
              <Label htmlFor="gemini-model">Modelo do Gemini</Label>
              <Select
                value={geminiModel}
                onValueChange={async (v) => {
                  setGeminiModel(v)
                  await settingsService.setSetting('gemini_model', v)
                  queryClient.invalidateQueries({
                    queryKey: ['settings', 'gemini_model'],
                  })
                }}
              >
                <SelectTrigger id="gemini-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-3.1-flash-lite">
                    Gemini 3.1 Flash-Lite (Rápido, Estável)
                  </SelectItem>
                  <SelectItem value="gemini-3-flash-preview">
                    Gemini 3 Flash (Avançado, Preview)
                  </SelectItem>
                  <SelectItem value="gemini-2.5-flash">
                    Gemini 2.5 Flash (Estável)
                  </SelectItem>
                  <SelectItem value="gemini-2.5-pro">
                    Gemini 2.5 Pro (Mais preciso)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Modelos mais avançados são mais precisos, mas podem ser mais
                lentos ou ter quota menor.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados e Backup</CardTitle>
            <CardDescription>
              Faça backup das suas transações para uma planilha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Exportar Transações (CSV)</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baixe todo o histórico para abrir no Excel ou Numbers.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="gap-2"
                >
                  <FileDown size={18} />
                  {isExporting ? 'Exportando...' : 'Exportar CSV'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert size={20} />
              Segurança e Sessão
            </CardTitle>
            <CardDescription>
              Opções avançadas e controle de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 max-w-sm">
              <Label htmlFor="new-password">Alterar Senha Mestre</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError('')
                  }}
                  disabled={isChangingPassword}
                />
                <Button
                  variant="outline"
                  onClick={handleRequestPasswordChange}
                  disabled={isChangingPassword || !newPassword}
                >
                  {isChangingPassword ? 'Salvando...' : 'Atualizar'}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} />
                  {passwordError}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                A nova senha será usada na próxima vez que você desbloquear o
                aplicativo.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut size={16} />
                Bloquear Aplicativo (Sair)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle size={20} />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam todos os seus dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Apagar Todos os Dados</p>
                <p className="text-xs text-muted-foreground">
                  Remove todas as transações, contas, cartões, investimentos e
                  metas. As categorias e configurações serão preservadas.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setIsResetDialogOpen(true)}
                disabled={isResetting}
                className="gap-2 shrink-0"
              >
                <Trash2 size={16} />
                {isResetting ? 'Apagando...' : 'Apagar Tudo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração de Senha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja alterar a senha mestre? A nova senha será
              exigida na próxima vez que você abrir ou desbloquear o aplicativo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmPasswordChange}>
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Sucesso */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              Senha Alterada com Sucesso
            </DialogTitle>
            <DialogDescription>
              Sua senha mestre foi atualizada. Da próxima vez que abrir o
              aplicativo, use a nova senha para desbloquear.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsSuccessDialogOpen(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Erro */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={20} />
              Erro ao Alterar Senha
            </DialogTitle>
            <DialogDescription>
              Não foi possível alterar a senha mestre. Tente novamente.
              {errorMessage && (
                <span className="block mt-2 text-xs font-mono bg-muted p-2 rounded-md">
                  {errorMessage}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsErrorDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Reset */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Apagar Todos os Dados
            </DialogTitle>
            <DialogDescription>
              Esta ação é{' '}
              <strong className="text-destructive">
                permanente e irreversível
              </strong>
              . Todos os registros abaixo serão excluídos:
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-1.5">
            <p className="text-sm flex items-center gap-2">
              • Todas as <strong>transações</strong>
            </p>
            <p className="text-sm flex items-center gap-2">
              • Todas as <strong>contas bancárias</strong>
            </p>
            <p className="text-sm flex items-center gap-2">
              • Todos os <strong>cartões de crédito</strong>
            </p>
            <p className="text-sm flex items-center gap-2">
              • Todos os <strong>investimentos</strong>
            </p>
            <p className="text-sm flex items-center gap-2">
              • Todas as <strong>metas financeiras</strong>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetDatabase}
              className="gap-2"
            >
              <Trash2 size={16} />
              Confirmar Exclusão Total
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Sucesso do Reset */}
      <Dialog
        open={resetSuccessDialogOpen}
        onOpenChange={setResetSuccessDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={20} />
              Dados Apagados com Sucesso
            </DialogTitle>
            <DialogDescription>
              Todos os dados financeiros foram removidos. O aplicativo está
              pronto para começar do zero.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setResetSuccessDialogOpen(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
