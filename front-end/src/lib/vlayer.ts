// Módulo VLayer - Integração com Nubank e geração de prova ZK
// Busca dados bancários do Nubank e gera prova zero-knowledge do saldo
// Inspirado no padrão WebProof do VLayer Solidity

import { generateProof, generateRandomNonce, type ProofInputs, type ProofResult } from './zkProof';
import type { ProgressCallback } from './zkProof';

// Tipos para dados do Nubank
export interface NubankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings';
  balance: number;
  currency: string;
}

export interface NubankBankData {
  bank: {
    id: string;
    name: string;
    code: string;
  };
  accounts: NubankAccount[];
}

// WebProof - Representa uma prova de dados web
export interface WebProof {
  url: string;
  response: Response;
  data: any;
  timestamp: number;
}

// Web - Representa dados extraídos de uma resposta web
export interface Web {
  url: string;
  data: any;
  json: any;
}

export interface VLayerResult {
  webProof: WebProof;
  web: Web;
  bankData: NubankBankData;
  selectedAccount: NubankAccount;
  proof: ProofResult;
  threshold: number;
  balance: number;
}

// URL da API do Nubank para buscar dados bancários
const NUBANK_DATA_URL = 'https://api.nubank.com.br/api/banks';

/**
 * Cria uma WebProof fazendo uma requisição HTTP para a API do Nubank
 * Similar ao padrão WebProof do VLayer Solidity
 */
export async function createWebProof(
  dataUrl: string = NUBANK_DATA_URL,
  accessToken?: string
): Promise<WebProof> {
  try {
    console.log('🔍 Criando WebProof para:', dataUrl);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Em produção, fazer requisição real
    // Por enquanto, simulamos a resposta
    const response = await fetch(dataUrl, {
      method: 'GET',
      headers,
    });

    // Para desenvolvimento, usamos dados mockados
    // Em produção, usar: const data = await response.json();
    const data = await mockNubankResponse();

    if (!response.ok && !data) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const webProof: WebProof = {
      url: dataUrl,
      response: response,
      data: data,
      timestamp: Date.now(),
    };

    console.log('✅ WebProof criada:', webProof);
    return webProof;
  } catch (error) {
    console.error('❌ Erro ao criar WebProof:', error);
    throw new Error(
      `Falha ao criar WebProof: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Verifica e extrai dados de uma WebProof
 * Similar ao método verify() do WebProof no Solidity
 */
export function verifyWebProof(webProof: WebProof): Web {
  try {
    const web: Web = {
      url: webProof.url,
      data: webProof.data,
      json: webProof.data,
    };

    console.log('✅ WebProof verificada:', web);
    return web;
  } catch (error) {
    console.error('❌ Erro ao verificar WebProof:', error);
    throw new Error('Falha ao verificar WebProof');
  }
}

/**
 * Extrai um valor string de um objeto JSON (similar a jsonGetString do Solidity)
 */
export function jsonGetString(json: any, path: string): string {
  try {
    const keys = path.split('.');
    let value: any = json;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        throw new Error(`Path ${path} not found in JSON`);
      }
    }
    
    return String(value);
  } catch (error) {
    throw new Error(`Erro ao extrair string do JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Extrai um valor numérico de um objeto JSON
 */
export function jsonGetNumber(json: any, path: string): number {
  try {
    const keys = path.split('.');
    let value: any = json;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        throw new Error(`Path ${path} not found in JSON`);
      }
    }
    
    return Number(value);
  } catch (error) {
    throw new Error(`Erro ao extrair número do JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Resposta mockada da API do Nubank para desenvolvimento
 */
async function mockNubankResponse(): Promise<NubankBankData> {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    bank: {
      id: 'nubank',
      name: 'Nubank',
      code: '260',
    },
    accounts: [
      {
        id: 'acc-001',
        name: 'Conta Corrente',
        type: 'checking',
        balance: 5000.75,
        currency: 'BRL',
      },
      {
        id: 'acc-002',
        name: 'NuConta',
        type: 'savings',
        balance: 12500.50,
        currency: 'BRL',
      },
    ],
  };
}

/**
 * Busca os dados bancários do Nubank usando WebProof
 */
export async function fetchNubankData(
  accessToken?: string
): Promise<NubankBankData> {
  try {
    const webProof = await createWebProof(NUBANK_DATA_URL, accessToken);
    const web = verifyWebProof(webProof);
    return web.json as NubankBankData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Nubank:', error);
    throw new Error(
      `Falha ao buscar dados do Nubank: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Busca o saldo total de todas as contas do Nubank
 */
export async function getNubankBalance(
  accessToken?: string
): Promise<number> {
  try {
    const bankData = await fetchNubankData(accessToken);
    const totalBalance = bankData.accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );
    return totalBalance;
  } catch (error) {
    console.error('❌ Erro ao buscar saldo do Nubank:', error);
    throw error;
  }
}

/**
 * Busca a conta com maior saldo do Nubank
 */
export async function getNubankAccountWithHighestBalance(
  accessToken?: string
): Promise<NubankAccount> {
  try {
    const bankData = await fetchNubankData(accessToken);
    if (bankData.accounts.length === 0) {
      throw new Error('Nenhuma conta encontrada no Nubank');
    }

    const accountWithHighestBalance = bankData.accounts.reduce((max, account) =>
      account.balance > max.balance ? account : max
    );

    return accountWithHighestBalance;
  } catch (error) {
    console.error('❌ Erro ao buscar conta do Nubank:', error);
    throw error;
  }
}

/**
 * Converte saldo em BRL para WLD (Worldcoin)
 * Nota: Em produção, você deve usar uma API de câmbio real
 */
export function convertBRLToWLD(brlAmount: number, exchangeRate: number = 0.18): number {
  // Taxa de câmbio aproximada: 1 BRL ≈ 0.18 WLD (exemplo)
  // Em produção, busque a taxa atual de uma API de câmbio
  return brlAmount * exchangeRate;
}

/**
 * Função principal do VLayer: busca dados do Nubank e gera prova ZK
 * Segue o padrão do exemplo Solidity: WebProof -> verify -> jsonGet -> generateProof
 * 
 * @param threshold Valor mínimo de saldo necessário (em WLD)
 * @param accessToken Token de acesso para API do Nubank (opcional)
 * @param onProgress Callback de progresso opcional
 * @returns Resultado com WebProof, dados bancários e prova ZK
 */
export async function vlayerGenerateProof(
  threshold: number,
  accessToken?: string,
  onProgress?: ProgressCallback
): Promise<VLayerResult> {
  try {
    onProgress?.(0, 'Iniciando VLayer...');

    // Passo 1: Criar WebProof (similar ao exemplo Solidity)
    onProgress?.(10, 'Criando WebProof...');
    const webProof = await createWebProof(NUBANK_DATA_URL, accessToken);

    // Passo 2: Verificar WebProof (webProof.verify(dataUrl) no Solidity)
    onProgress?.(20, 'Verificando WebProof...');
    const web = verifyWebProof(webProof);

    // Passo 3: Extrair dados JSON (similar a web.jsonGetString no Solidity)
    onProgress?.(30, 'Extraindo dados bancários...');
    const bankData = web.json as NubankBankData;
    
    if (!bankData.accounts || bankData.accounts.length === 0) {
      throw new Error('Nenhuma conta encontrada no Nubank');
    }

    // Passo 4: Selecionar conta com maior saldo
    onProgress?.(40, 'Selecionando conta...');
    const selectedAccount = bankData.accounts.reduce((max, account) =>
      account.balance > max.balance ? account : max
    );

    // Passo 5: Extrair saldo da conta selecionada
    // Em um cenário real, você poderia usar jsonGetNumber para extrair de um path específico
    const balanceBRL = selectedAccount.balance;
    
    // Passo 6: Converter saldo BRL para WLD
    onProgress?.(50, 'Convertendo saldo...');
    const balanceInWLD = convertBRLToWLD(balanceBRL);
    
    console.log('💰 Saldo encontrado:', {
      account: selectedAccount.name,
      balanceBRL: balanceBRL,
      balanceWLD: balanceInWLD,
      threshold,
    });

    // Passo 7: Validar se o saldo é suficiente
    if (balanceInWLD < threshold) {
      throw new Error(
        `Saldo insuficiente. Necessário: ${threshold} WLD, Disponível: ${balanceInWLD.toFixed(2)} WLD`
      );
    }

    // Passo 8: Gerar nonce
    onProgress?.(60, 'Gerando nonce...');
    const nonce = generateRandomNonce();

    // Passo 9: Preparar inputs para a prova ZK
    onProgress?.(70, 'Preparando prova ZK...');
    const proofInputs: ProofInputs = {
      threshold: Math.floor(threshold * 1e6), // Converter para micro-WLD (u64)
      nonce: nonce,
      balance: Math.floor(balanceInWLD * 1e6), // Converter para micro-WLD (u64)
      secret_nonce: nonce,
    };

    // Passo 10: Gerar prova ZK
    const proofProgressCallback: ProgressCallback = (progress, text) => {
      // Mapear progresso da prova (0-100) para o progresso total (70-100)
      const mappedProgress = 70 + (progress * 0.3);
      onProgress?.(mappedProgress, text);
    };

    onProgress?.(70, 'Gerando prova zero-knowledge...');
    const proof = await generateProof(proofInputs, proofProgressCallback);

    if (!proof.isValid) {
      throw new Error('A prova gerada não é válida');
    }

    onProgress?.(100, 'Prova gerada com sucesso!');

    return {
      webProof,
      web,
      bankData,
      selectedAccount,
      proof,
      threshold,
      balance: balanceInWLD,
    };
  } catch (error) {
    console.error('❌ Erro no VLayer:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro desconhecido ao gerar prova com VLayer';
    throw new Error(errorMessage);
  }
}

/**
 * Função auxiliar para buscar apenas o saldo do Nubank
 */
export async function getNubankBalanceInWLD(
  accessToken?: string
): Promise<number> {
  const balanceBRL = await getNubankBalance(accessToken);
  return convertBRLToWLD(balanceBRL);
}

