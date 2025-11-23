// Módulo de Integração com XMTP
// Integração com o SDK oficial do XMTP para mensagens criptografadas
// Referência: https://docs.xmtp.org/

import { Client, Conversation, DecodedMessage } from '@xmtp/xmtp-js';

// Tipo Signer do XMTP
export interface Signer {
  getAddress: () => Promise<`0x${string}`>;
  signMessage: (message: string | Uint8Array) => Promise<`0x${string}`>;
}

// Tipos e Interfaces

/**
 * Configuração do cliente XMTP
 */
export interface XMTPConfig {
  env?: 'dev' | 'production';
  appVersion?: string;
}

/**
 * Mensagem XMTP formatada
 */
export interface XMTPMessage {
  id: string;
  content: string;
  senderAddress: string;
  sent: Date;
  conversationTopic: string;
}

/**
 * Conversa XMTP formatada
 */
export interface XMTPConversation {
  topic: string;
  peerAddress: string;
  createdAt: Date;
}

/**
 * Estado do cliente XMTP
 */
export interface XMTPClientState {
  client: Client | null;
  isInitialized: boolean;
  address: string | null;
}

// Gerenciamento do Cliente XMTP

let xmtpClient: Client | null = null;
let clientState: XMTPClientState = {
  client: null,
  isInitialized: false,
  address: null,
};

/**
 * Cria um signer a partir de uma wallet
 * @param getAddress Função para obter o endereço da wallet
 * @param signMessage Função para assinar mensagens
 */
export function createSigner(
  getAddress: () => Promise<`0x${string}`>,
  signMessage: (message: string | Uint8Array) => Promise<`0x${string}`>
): Signer {
  return {
    getAddress,
    signMessage,
  };
}

/**
 * Inicializa o cliente XMTP
 * @param signer Signer para autenticação (wallet)
 * @param config Configuração opcional do XMTP
 */
export async function initializeXMTPClient(
  signer: Signer,
  config: XMTPConfig = {}
): Promise<Client> {
  try {
    const address = await signer.getAddress();
    
    // Verificar se já existe uma identidade
    const isCreated = await Client.canMessage(address);
    
    if (!isCreated) {
      console.log('📝 Criando nova identidade XMTP...');
    }

    // Criar ou conectar ao cliente
    const client = await Client.create(signer, {
      env: config.env || 'production',
      appVersion: config.appVersion || 'zkvip-ethglobal/1.0.0',
    });

    xmtpClient = client;
    clientState = {
      client,
      isInitialized: true,
      address,
    };

    console.log('✅ Cliente XMTP inicializado:', {
      address,
      env: config.env || 'production',
    });

    return client;
  } catch (error) {
    console.error('❌ Erro ao inicializar cliente XMTP:', error);
    throw new Error(
      `Falha ao inicializar XMTP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Obtém o cliente XMTP atual
 */
export function getXMTPClient(): Client | null {
  return xmtpClient;
}

/**
 * Obtém o estado do cliente
 */
export function getXMTPClientState(): XMTPClientState {
  return { ...clientState };
}

/**
 * Verifica se um endereço pode receber mensagens XMTP
 */
export async function canMessage(address: string): Promise<boolean> {
  try {
    return await Client.canMessage(address as `0x${string}`);
  } catch {
    return false;
  }
}

// Gerenciamento de Conversas

/**
 * Lista todas as conversas do cliente
 */
export async function listConversations(): Promise<XMTPConversation[]> {
  if (!xmtpClient) {
    throw new Error('Cliente XMTP não inicializado');
  }

  try {
    const conversations = await xmtpClient.conversations.list();
    
    return conversations.map((conv) => ({
      topic: conv.topic,
      peerAddress: conv.peerAddress,
      createdAt: conv.createdAt,
    }));
  } catch (error) {
    console.error('❌ Erro ao listar conversas:', error);
    throw error;
  }
}

/**
 * Cria uma nova conversa com um endereço
 */
export async function createConversation(
  peerAddress: string
): Promise<Conversation> {
  if (!xmtpClient) {
    throw new Error('Cliente XMTP não inicializado');
  }

  try {
    const conversation = await xmtpClient.conversations.newConversation(
      peerAddress as `0x${string}`
    );

    console.log('✅ Conversa criada:', {
      topic: conversation.topic,
      peerAddress: conversation.peerAddress,
    });

    return conversation;
  } catch (error) {
    console.error('❌ Erro ao criar conversa:', error);
    throw error;
  }
}

/**
 * Obtém uma conversa existente pelo endereço do peer
 */
export async function getConversation(
  peerAddress: string
): Promise<Conversation | null> {
  if (!xmtpClient) {
    throw new Error('Cliente XMTP não inicializado');
  }

  try {
    const conversations = await xmtpClient.conversations.list();
    return conversations.find((conv) => conv.peerAddress === peerAddress) || null;
  } catch (error) {
    console.error('❌ Erro ao buscar conversa:', error);
    return null;
  }
}

/**
 * Obtém ou cria uma conversa com um endereço
 */
export async function getOrCreateConversation(
  peerAddress: string
): Promise<Conversation> {
  const existing = await getConversation(peerAddress);
  if (existing) {
    return existing;
  }
  return await createConversation(peerAddress);
}

// Gerenciamento de Mensagens

/**
 * Envia uma mensagem em uma conversa
 */
export async function sendMessage(
  conversation: Conversation,
  content: string
): Promise<DecodedMessage> {
  try {
    const message = await conversation.send(content);
    
    console.log('✅ Mensagem enviada:', {
      id: message.id,
      content: message.content,
      sent: message.sent,
    });

    return message;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    throw error;
  }
}

/**
 * Lista mensagens de uma conversa
 */
export async function listMessages(
  conversation: Conversation,
  limit?: number
): Promise<XMTPMessage[]> {
  try {
    const messages = await conversation.messages({
      limit,
    });

    return messages.map((msg) => ({
      id: msg.id,
      content: typeof msg.content === 'string' ? msg.content : String(msg.content),
      senderAddress: msg.senderAddress,
      sent: msg.sent,
      conversationTopic: conversation.topic,
    }));
  } catch (error) {
    console.error('❌ Erro ao listar mensagens:', error);
    throw error;
  }
}

/**
 * Escuta novas mensagens em uma conversa
 */
export async function streamMessages(
  conversation: Conversation,
  onMessage: (message: XMTPMessage) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  try {
    const stream = await conversation.streamMessages();

    (async () => {
      for await (const message of stream) {
        try {
          const xmtpMessage: XMTPMessage = {
            id: message.id,
            content: typeof message.content === 'string' ? message.content : String(message.content),
            senderAddress: message.senderAddress,
            sent: message.sent,
            conversationTopic: conversation.topic,
          };
          onMessage(xmtpMessage);
        } catch (error) {
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    })();

    // Retorna função para parar o stream
    return () => {
      stream.return?.();
    };
  } catch (error) {
    console.error('❌ Erro ao iniciar stream de mensagens:', error);
    throw error;
  }
}

/**
 * Escuta novas conversas
 */
export async function streamConversations(
  onConversation: (conversation: XMTPConversation) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  if (!xmtpClient) {
    throw new Error('Cliente XMTP não inicializado');
  }

  try {
    const stream = await xmtpClient.conversations.stream();

    (async () => {
      for await (const conversation of stream) {
        try {
          const xmtpConversation: XMTPConversation = {
            topic: conversation.topic,
            peerAddress: conversation.peerAddress,
            createdAt: conversation.createdAt,
          };
          onConversation(xmtpConversation);
        } catch (error) {
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    })();

    // Retorna função para parar o stream
    return () => {
      stream.return?.();
    };
  } catch (error) {
    console.error('❌ Erro ao iniciar stream de conversas:', error);
    throw error;
  }
}

// Funções de Utilidade

/**
 * Formata uma mensagem XMTP para exibição
 */
export function formatXMTPMessage(message: XMTPMessage): {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
} {
  const currentAddress = clientState.address;
  const isOwn = message.senderAddress.toLowerCase() === currentAddress?.toLowerCase();

  return {
    id: message.id,
    text: message.content,
    sender: isOwn ? 'You' : message.senderAddress.slice(0, 6) + '...' + message.senderAddress.slice(-4),
    timestamp: message.sent,
    isOwn,
  };
}

/**
 * Desconecta o cliente XMTP
 */
export function disconnectXMTP(): void {
  if (xmtpClient) {
    // O cliente XMTP não tem um método explícito de desconexão
    // mas podemos limpar a referência
    xmtpClient = null;
    clientState = {
      client: null,
      isInitialized: false,
      address: null,
    };
    console.log('✅ Cliente XMTP desconectado');
  }
}

// Função principal de uso - Enviar mensagem para um endereço
/**
 * Envia uma mensagem criptografada para um endereço
 * Cria a conversa se necessário
 */
export async function sendEncryptedMessage(
  peerAddress: string,
  content: string
): Promise<XMTPMessage> {
  if (!xmtpClient) {
    throw new Error('Cliente XMTP não inicializado. Chame initializeXMTPClient primeiro.');
  }

  try {
    // Verificar se o endereço pode receber mensagens
    const canReceive = await canMessage(peerAddress);
    if (!canReceive) {
      throw new Error(`O endereço ${peerAddress} não está registrado no XMTP`);
    }

    // Obter ou criar conversa
    const conversation = await getOrCreateConversation(peerAddress);

    // Enviar mensagem
    const message = await sendMessage(conversation, content);

    return {
      id: message.id,
      content: typeof message.content === 'string' ? message.content : String(message.content),
      senderAddress: message.senderAddress,
      sent: message.sent,
      conversationTopic: conversation.topic,
    };
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem criptografada:', error);
    throw error;
  }
}

/**
 * Recebe mensagens de uma conversa
 */
export async function receiveMessages(
  peerAddress: string,
  limit?: number
): Promise<XMTPMessage[]> {
  if (!xmtpClient) {
    throw new Error('Cliente XMTP não inicializado. Chame initializeXMTPClient primeiro.');
  }

  try {
    const conversation = await getConversation(peerAddress);
    
    if (!conversation) {
      return [];
    }

    return await listMessages(conversation, limit);
  } catch (error) {
    console.error('❌ Erro ao receber mensagens:', error);
    throw error;
  }
}
