'use client';

import clsx from 'clsx';
import { Page } from '@/components/PageLayout';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { Plus } from 'iconoir-react';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  addJoinedGroup,
  getAvailableGroups,
  initializeAvailableGroups,
  createAvailableGroup,
  type AvailableGroup,
} from '@/lib/groups';

const filterOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'low', label: '≤ 1 WLD' },
];

const proofSteps = [
  'Checando saldo WLD',
  'Gerando prova ZK',
  'Enviando prova',
  'Confirmando acesso',
];

type StepStatus = 'pending' | 'active' | 'done';

export default function Groups() {
  const session = useSession();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<AvailableGroup | null>(null);
  const [availableGroups, setAvailableGroups] = useState<AvailableGroup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMinWld, setNewGroupMinWld] = useState('');
  const [error, setError] = useState('');
  const [proofState, setProofState] = useState<'idle' | 'running' | 'success'>(
    'idle',
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsStatus, setStepsStatus] = useState<StepStatus[]>(
    proofSteps.map(() => 'pending'),
  );

  // Carrega grupos disponíveis do localStorage
  useEffect(() => {
    // Inicializa grupos padrão se necessário
    initializeAvailableGroups();
    
    const loadGroups = () => {
      setAvailableGroups(getAvailableGroups());
    };
    
    loadGroups();
    
    // Listener para atualizações
    const handleUpdate = () => {
      loadGroups();
    };
    
    window.addEventListener('availableGroupsUpdated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    
    return () => {
      window.removeEventListener('availableGroupsUpdated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'low') {
      return availableGroups.filter((g) => g.minWld <= 1);
    }
    return availableGroups;
  }, [activeFilter, availableGroups]);

  const startProof = () => {
    setProofState('running');
    setCurrentStep(0);
    setStepsStatus(
      proofSteps.map((_, idx) => (idx === 0 ? 'active' : 'pending')),
    );
  };

  useEffect(() => {
    if (proofState !== 'running') return;

    if (currentStep === proofSteps.length - 1) {
      const doneTimer = setTimeout(() => {
        setStepsStatus(proofSteps.map(() => 'done'));
        setProofState('success');
      }, 600);
      return () => clearTimeout(doneTimer);
    }

    const timer = setTimeout(() => {
      setStepsStatus((prev) =>
        prev.map((status, idx) => {
          if (idx < currentStep) return 'done';
          if (idx === currentStep + 1) return 'active';
          return 'pending';
        }),
      );
      setCurrentStep((s) => s + 1);
    }, 900);

    return () => clearTimeout(timer);
  }, [currentStep, proofState]);

  const closeSheet = () => {
    setSelectedGroup(null);
    setProofState('idle');
    setStepsStatus(proofSteps.map(() => 'pending'));
    setCurrentStep(0);
  };

  const handleJoinGroup = () => {
    if (selectedGroup && proofState === 'success') {
      // Adiciona o grupo à lista de grupos do usuário
      addJoinedGroup(selectedGroup);
      
      // Fecha o modal
      closeSheet();
      
      // Navega para o chat do grupo
      router.push(`/chat/${selectedGroup.id}`);
    }
  };

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
      
      // Recarrega os grupos
      setAvailableGroups(getAvailableGroups());
    } catch (err: any) {
      setError(err.message || 'Erro ao criar grupo. Tente novamente.');
    }
  };

  return (
    <>
      <Page.Header className="p-0 bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
              Groups
            </p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              Descubra e entre
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

        {/* Groups Grid */}
        <div className="px-6 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
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
              <p className="text-slate-500 font-medium">Nenhum grupo encontrado</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <button
                key={group.name}
                onClick={() => setSelectedGroup(group)}
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
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                        {group.name}
                      </h3>
                      <span className="shrink-0 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm">
                        {group.minWld} WLD
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg
                        className="w-3.5 h-3.5"
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
                      <span className="font-medium">{group.members} membros</span>
                    </div>
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

        {/* Detail Sheet Modal */}
        {selectedGroup && (
          <div
            className="fixed inset-0 z-30 flex items-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeSheet}
          >
            <div
              className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 rounded-full bg-slate-300"></div>
              </div>

              {/* Header */}
              <div className="px-6 pt-4 pb-6 border-b border-slate-100">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={clsx(
                        'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold uppercase text-white shadow-xl ring-2 ring-slate-100',
                        selectedGroup.avatarBg,
                      )}
                    >
                      {selectedGroup.name
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        {selectedGroup.name}
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {selectedGroup.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeSheet}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
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

                {/* Info Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <svg
                      className="w-3.5 h-3.5"
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
                    {selectedGroup.members} membros
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3 py-1.5 text-xs font-bold shadow-sm">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Mínimo: {selectedGroup.minWld} WLD
                  </span>
                </div>
              </div>

              {/* Proof Section */}
              <div className="px-6 py-6">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Prova ZK de acesso
                        </h3>
                        <span
                          className={clsx(
                            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                            proofState === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : proofState === 'running'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-200 text-slate-700',
                          )}
                        >
                          {proofState === 'success'
                            ? 'Aprovado'
                            : proofState === 'running'
                              ? 'Processando'
                              : 'Pendente'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Valide seu saldo mínimo em WLD para entrar no grupo de
                        forma privada e segura.
                      </p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2.5 mb-6">
                    {proofSteps.map((step, idx) => (
                      <div
                        key={step}
                        className={clsx(
                          'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                          stepsStatus[idx] === 'active'
                            ? 'bg-sky-50 border border-sky-200 shadow-sm'
                            : stepsStatus[idx] === 'done'
                              ? 'bg-emerald-50 border border-emerald-200'
                              : 'bg-white border border-slate-200',
                        )}
                      >
                        <span
                          className={clsx(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200',
                            stepsStatus[idx] === 'done' &&
                              'bg-emerald-500 text-white shadow-sm',
                            stepsStatus[idx] === 'active' &&
                              'bg-sky-500 text-white shadow-sm animate-pulse',
                            stepsStatus[idx] === 'pending' &&
                              'bg-slate-200 text-slate-500',
                          )}
                        >
                          {stepsStatus[idx] === 'done' ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 mb-0.5">
                            {step}
                          </p>
                          <p className="text-xs text-slate-500">
                            {stepsStatus[idx] === 'active'
                              ? 'Em andamento...'
                              : stepsStatus[idx] === 'done'
                                ? 'Concluído com sucesso'
                                : 'Aguardando início'}
                          </p>
                        </div>
                        {stepsStatus[idx] === 'active' && (
                          <div className="shrink-0">
                            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={startProof}
                      disabled={proofState === 'running'}
                      className={clsx(
                        'w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200',
                        proofState === 'running'
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0',
                      )}
                    >
                      {proofState === 'running' ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Gerando prova...
                        </span>
                      ) : (
                        'Gerar prova ZK'
                      )}
                    </button>
                    <button
                      onClick={handleJoinGroup}
                      disabled={proofState !== 'success'}
                      className={clsx(
                        'w-full rounded-xl border-2 px-4 py-3.5 text-sm font-bold transition-all duration-200',
                        proofState === 'success'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                          : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed',
                      )}
                    >
                      {proofState === 'success' ? (
                        <span className="flex items-center justify-center gap-2">
                          Entrar no grupo
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      ) : (
                        'Entrar no grupo'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Page.Main>
    </>
  );
}
