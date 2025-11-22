'use client';

import clsx from 'clsx';
import { Page } from '@/components/PageLayout';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { Plus } from 'iconoir-react';
import { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  getJoinedGroups,
  createAvailableGroup,
  type Group,
} from '@/lib/groups';

const filterOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'unread', label: 'Não lidos' },
];

export default function Home() {
  const session = useSession();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMinWld, setNewGroupMinWld] = useState('');
  const [error, setError] = useState('');
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);

  // Carrega grupos do localStorage
  useEffect(() => {
    const loadGroups = () => {
      setJoinedGroups(getJoinedGroups());
    };
    
    loadGroups();
    
    // Listener para mudanças no localStorage (de outras abas)
    const handleStorageChange = () => {
      loadGroups();
    };
    
    // Listener para quando a página recebe foco (volta de outra página)
    const handleFocus = () => {
      loadGroups();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    // Polling para detectar mudanças na mesma aba
    const interval = setInterval(loadGroups, 1000);
    
    // Listener para eventos customizados (quando grupos são adicionados)
    window.addEventListener('groupsUpdated', loadGroups);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('groupsUpdated', loadGroups);
      clearInterval(interval);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'unread') {
      return joinedGroups.filter((g) => g.unread > 0);
    }
    return joinedGroups;
  }, [activeFilter, joinedGroups]);

  const handleCreate = () => {
    if (!newGroupName.trim()) {
      setError('Adicione um nome.');
      return;
    }
    const min = Number(newGroupMinWld);
    if (Number.isNaN(min) || min <= 0) {
      setError('Defina o mínimo de WLD.');
      return;
    }
    
    try {
      // Cores de avatar aleatórias
      const avatarColors = [
        'bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500',
        'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500',
        'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500',
        'bg-gradient-to-br from-teal-500 via-emerald-500 to-lime-500',
        'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500',
        'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500',
      ];
      const randomAvatar =
        avatarColors[Math.floor(Math.random() * avatarColors.length)];
      
      createAvailableGroup(
        newGroupName.trim(),
        `Grupo criado por ${session?.data?.user?.username || 'você'}`,
        min,
        randomAvatar,
      );
      
      setError('');
      setIsCreating(false);
      setNewGroupName('');
      setNewGroupMinWld('');
      
      // Navega para a página de grupos para ver o grupo criado
      router.push('/groups');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar grupo. Tente novamente.');
    }
  };

  const openChat = (group: Group) => {
    router.push(`/chat/${group.id}`);
  };

  return (
    <>
      <Page.Header className="p-0 bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
              My groups
            </p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              Chats
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <p className="text-sm font-semibold capitalize leading-tight text-slate-900">
                {session?.data?.user?.username}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[11px] text-slate-500 font-medium">online</p>
              </div>
            </div>
            <Marble
              src={session?.data?.user?.profilePictureUrl}
              className="w-11 h-11 shadow-md ring-2 ring-white"
            />
          </div>
        </div>
      </Page.Header>

      <Page.Main className="relative flex flex-col bg-gradient-to-b from-slate-50/50 to-white px-0 pb-32">
        {/* Filter Section */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-50/95 to-transparent backdrop-blur-sm px-6 pt-6 pb-4">
          <div className="flex gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={clsx(
                  'rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                  activeFilter === filter.key
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Groups List */}
        <div className="px-6 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {joinedGroups.length === 0
                  ? 'Você ainda não está em nenhum grupo'
                  : 'Nenhum grupo encontrado'}
              </h3>
              <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
                {joinedGroups.length === 0
                  ? 'Explore grupos disponíveis na aba "Groups" e entre usando prova ZK para começar a conversar!'
                  : 'Tente ajustar os filtros para ver mais grupos.'}
              </p>
              {joinedGroups.length === 0 && (
                <button
                  onClick={() => router.push('/groups')}
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Explorar grupos
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <button
                key={group.name}
                onClick={() => openChat(group)}
                className="w-full group"
              >
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={clsx(
                        'flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-base font-bold uppercase text-white shadow-lg ring-2 ring-white/50',
                        group.avatarBg,
                      )}
                    >
                      {group.name
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')}
                    </div>
                    {group.unread > 0 && (
                      <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white">
                        {group.unread > 9 ? '9+' : group.unread}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                        {group.name}
                      </h3>
                      {group.unread === 0 && (
                        <span className="shrink-0 rounded-lg bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-bold">
                          {group.minWld} WLD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="font-semibold text-slate-800">
                        {group.lastSender}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 truncate flex-1">
                        {group.lastMessage}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {group.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0 pt-1">
                    <svg
                      className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-24 right-5 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:scale-105 active:scale-100 z-10"
        >
          <Plus className="w-5 h-5" />
          <span>Criar grupo</span>
        </button>

        {/* Create Modal */}
        {isCreating && (
          <div
            className="fixed inset-0 z-30 flex items-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsCreating(false)}
          >
            <div
              className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 rounded-full bg-slate-300"></div>
              </div>

              {/* Header */}
              <div className="px-6 pt-4 pb-6 border-b border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                      Criar grupo
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Configure o nome e o mínimo em WLD necessário para entrar.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors ml-4"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-6 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-900">
                    Nome do grupo
                  </span>
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex.: Builders SP"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-2 ring-transparent focus:bg-white focus:border-slate-300 focus:ring-slate-200 transition-all"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-900">
                    Mínimo em WLD para entrar
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-3 text-xs font-bold shadow-sm">
                      WLD
                    </span>
                    <input
                      value={newGroupMinWld}
                      onChange={(e) => setNewGroupMinWld(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.50"
                      className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-2 ring-transparent focus:bg-white focus:border-slate-300 focus:ring-slate-200 transition-all"
                    />
                  </div>
                </label>

                {error && (
                  <div className="rounded-xl bg-amber-50 border-2 border-amber-200 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleCreate}
                    className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Criar grupo
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Page.Main>
    </>
  );
}
