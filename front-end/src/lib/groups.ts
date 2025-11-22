export type Group = {
  id: string;
  name: string;
  lastMessage: string;
  lastSender: string;
  description: string;
  minWld: number;
  unread: number;
  avatarBg: string;
  members: number;
  joinedAt: string;
};

export type AvailableGroup = {
  id: string;
  name: string;
  description: string;
  minWld: number;
  avatarBg: string;
  members: number;
};

const STORAGE_KEY = 'zkvip_joined_groups';
const AVAILABLE_GROUPS_KEY = 'zkvip_available_groups';

// Grupos pré-criados
const DEFAULT_AVAILABLE_GROUPS: AvailableGroup[] = [
  {
    id: 'zk-builders',
    name: 'ZK Builders',
    description: 'Discussões diárias sobre ZK, provas e tooling.',
    minWld: 0.5,
    avatarBg: 'bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500',
    members: 124,
  },
  {
    id: 'ethereum-sp',
    name: 'Ethereum São Paulo',
    description: 'Eventos, meetups e grants da comunidade paulista.',
    minWld: 1,
    avatarBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500',
    members: 89,
  },
];

export const getJoinedGroups = (): Group[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addJoinedGroup = (group: AvailableGroup): void => {
  if (typeof window === 'undefined') return;
  
  const joinedGroups = getJoinedGroups();
  
  // Verifica se o grupo já existe
  if (joinedGroups.some((g) => g.id === group.id)) {
    return;
  }

  // Cria o grupo com dados iniciais
  const newGroup: Group = {
    ...group,
    lastMessage: 'Bem-vindo ao grupo!',
    lastSender: 'Sistema',
    unread: 0,
    joinedAt: new Date().toISOString(),
  };

  joinedGroups.push(newGroup);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(joinedGroups));
    // Dispara evento para atualizar outras partes da aplicação
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('groupsUpdated'));
    }
  } catch (error) {
    console.error('Erro ao salvar grupo:', error);
  }
};

export const updateGroupLastMessage = (
  groupId: string,
  message: string,
  sender: string,
): void => {
  if (typeof window === 'undefined') return;
  
  const joinedGroups = getJoinedGroups();
  const groupIndex = joinedGroups.findIndex((g) => g.id === groupId);
  
  if (groupIndex !== -1) {
    joinedGroups[groupIndex].lastMessage = message;
    joinedGroups[groupIndex].lastSender = sender;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(joinedGroups));
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
    }
  }
};

export const incrementUnread = (groupId: string): void => {
  if (typeof window === 'undefined') return;
  
  const joinedGroups = getJoinedGroups();
  const groupIndex = joinedGroups.findIndex((g) => g.id === groupId);
  
  if (groupIndex !== -1) {
    joinedGroups[groupIndex].unread += 1;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(joinedGroups));
    } catch (error) {
      console.error('Erro ao incrementar não lidas:', error);
    }
  }
};

export const clearUnread = (groupId: string): void => {
  if (typeof window === 'undefined') return;
  
  const joinedGroups = getJoinedGroups();
  const groupIndex = joinedGroups.findIndex((g) => g.id === groupId);
  
  if (groupIndex !== -1) {
    joinedGroups[groupIndex].unread = 0;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(joinedGroups));
    } catch (error) {
      console.error('Erro ao limpar não lidas:', error);
    }
  }
};

// Funções para gerenciar grupos disponíveis
export const getAvailableGroups = (): AvailableGroup[] => {
  if (typeof window === 'undefined') return DEFAULT_AVAILABLE_GROUPS;
  
  try {
    const stored = localStorage.getItem(AVAILABLE_GROUPS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Se não existir, inicializa com os grupos padrão
    initializeAvailableGroups();
    return DEFAULT_AVAILABLE_GROUPS;
  } catch {
    return DEFAULT_AVAILABLE_GROUPS;
  }
};

export const initializeAvailableGroups = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = localStorage.getItem(AVAILABLE_GROUPS_KEY);
    if (!existing) {
      localStorage.setItem(
        AVAILABLE_GROUPS_KEY,
        JSON.stringify(DEFAULT_AVAILABLE_GROUPS),
      );
    }
  } catch (error) {
    console.error('Erro ao inicializar grupos disponíveis:', error);
  }
};

export const createAvailableGroup = (
  name: string,
  description: string,
  minWld: number,
  avatarBg: string,
): AvailableGroup => {
  if (typeof window === 'undefined') {
    throw new Error('Não é possível criar grupo no servidor');
  }
  
  const availableGroups = getAvailableGroups();
  
  // Gera um ID único baseado no nome
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Verifica se já existe um grupo com esse ID
  const existingGroup = availableGroups.find((g) => g.id === id);
  if (existingGroup) {
    throw new Error('Já existe um grupo com esse nome');
  }
  
  const newGroup: AvailableGroup = {
    id,
    name,
    description,
    minWld,
    avatarBg,
    members: 0,
  };
  
  availableGroups.push(newGroup);
  
  try {
    localStorage.setItem(AVAILABLE_GROUPS_KEY, JSON.stringify(availableGroups));
    // Dispara evento para atualizar outras partes da aplicação
    window.dispatchEvent(new Event('availableGroupsUpdated'));
    return newGroup;
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    throw error;
  }
};

