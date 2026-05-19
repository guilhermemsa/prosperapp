import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      value: {
        invoke: (cmd: string, args: any) => {
          console.log(`Tauri Mock Invoke: ${cmd}`, args);
          if (cmd === 'check_onboarding') {
            return Promise.resolve(window.sessionStorage.getItem('onboarded') === 'true');
          }
          if (cmd === 'setup_password' || cmd === 'login') {
            window.sessionStorage.setItem('onboarded', 'true');
            return Promise.resolve();
          }
          
          if (cmd === 'get_accounts') return Promise.resolve([{
            id: 'mock-account',
            name: 'Mock Account',
            type: 'bank',
            balance: 5000,
            currency: 'BRL'
          }]);
          if (cmd === 'create_account') return Promise.resolve({
            id: 'mock-account-2',
            name: args.data.name,
            type: args.data.type,
            balance: args.data.balance,
            currency: args.data.currency
          });

          if (cmd === 'get_transactions') return Promise.resolve([]);
          if (cmd === 'create_transaction') return Promise.resolve({
            id: 'mock-tx',
            ...args.data
          });

          if (cmd === 'get_credit_cards') return Promise.resolve([]);
          if (cmd === 'create_credit_card') return Promise.resolve({
            id: 'mock-card',
            ...args.data
          });

          if (cmd === 'get_investments') return Promise.resolve([]);
          if (cmd === 'create_investment') return Promise.resolve({
            id: 'mock-inv',
            ...args.data
          });

          if (cmd === 'get_goals') return Promise.resolve([]);
          if (cmd === 'create_goal') return Promise.resolve({
            id: 'mock-goal',
            ...args.data
          });
          
          return Promise.resolve();
        }
      }
    });
  });
});

test('E2E: Completes onboarding and navigates all modules', async ({ page }) => {
  // Start on the onboarding page
  await page.goto('http://localhost:1420/onboarding');

  // Fill password and setup
  await page.fill('input[placeholder="Escolha sua Senha Mestre"]', '123456');
  await page.click('button:has-text("Começar Agora")');

  // Dashboard
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

  // Accounts
  await page.click('a:has-text("Contas")');
  await expect(page.locator('h1:has-text("Contas")')).toBeVisible();
  await page.click('button:has-text("Nova Conta")');
  await expect(page.locator('h2:has-text("Criar Nova Conta")')).toBeVisible();
  await page.fill('input#name', 'My Mock Bank');
  await page.fill('input#balance', '500');
  await page.click('button:has-text("Criar Conta")');
  
  // Transactions
  await page.click('a:has-text("Transações")');
  await expect(page.locator('h1:has-text("Transações")')).toBeVisible();
  await page.click('button:has-text("Nova Transação")');
  await expect(page.locator('h2:has-text("Nova Transação")')).toBeVisible();
  await page.fill('input[placeholder="0,00"]', '150');
  await page.fill('input[placeholder="Ex: Almoço, Salário..."]', 'Supermarket');
  await page.click('button:has-text("Cancelar")');

  // Credit Cards
  await page.click('a:has-text("Cartões")');
  await expect(page.locator('h1:has-text("Cartões de Crédito")')).toBeVisible();
  await page.click('button:has-text("Novo Cartão")');
  await expect(page.locator('h2:has-text("Adicionar Cartão")')).toBeVisible();
  await page.fill('input[placeholder="Ex: Nubank, Visa Infinite"]', 'Mock Card');
  await page.click('button:has-text("Cancelar")');

  // Investments
  await page.click('a:has-text("Investimentos")');
  await expect(page.locator('h1:has-text("Investimentos")')).toBeVisible();
  await page.click('button:has-text("Novo Ativo")');
  await expect(page.locator('h2:has-text("Adicionar Investimento")')).toBeVisible();
  await page.fill('input[placeholder="Ex: Petrobras"]', 'Mock Stock');
  await page.click('button:has-text("Cancelar")');

  // Goals
  await page.click('a:has-text("Metas")');
  await expect(page.locator('h1:has-text("Metas")')).toBeVisible();
  await page.click('button:has-text("Nova Meta")');
  await expect(page.locator('h2:has-text("Criar Nova Meta")')).toBeVisible();
  await page.fill('input[placeholder="Ex: Viagem para o Japão, Carro Novo"]', 'Mock Goal');
  await page.click('button:has-text("Cancelar")');

  // Settings
  await page.click('a:has-text("Configurações")');
  await expect(page.locator('h1:has-text("Configurações")')).toBeVisible();
});
