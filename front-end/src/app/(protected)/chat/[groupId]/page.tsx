'use client';

import clsx from 'clsx';
import { Page } from '@/components/PageLayout';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send } from 'iconoir-react';
import { getJoinedGroups, updateGroupLastMessage, clearUnread, type Group } from '@/lib/groups';

type Message = {
  id: string;
  sender: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
};

const sampleMessages: Message[] = [
  {
    id: '1',
    sender: 'Alex',
    text: 'Nova call amanhã sobre circuitos. Alguém pode preparar o material?',
    timestamp: new Date(Date.now() - 3600000),
    isOwn: false,
  },
  {
    id: '2',
    sender: 'Carol',
    text: 'Eu posso ajudar! Já tenho alguns exemplos prontos.',
    timestamp: new Date(Date.now() - 3300000),
    isOwn: false,
  },
  {
    id: '3',
    sender: 'Você',
    text: 'Ótimo! Vou revisar o que temos até agora.',
    timestamp: new Date(Date.now() - 3000000),
    isOwn: true,
  },
  {
    id: '4',
    sender: 'Lia',
    text: 'Atualizei o roadmap do sprint. Dêem uma olhada!',
    timestamp: new Date(Date.now() - 1800000),
    isOwn: false,
  },
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [inputText, setInputText] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Verifica se o grupo existe na lista de grupos do usuário
    const joinedGroups = getJoinedGroups();
    const foundGroup = joinedGroups.find((g) => g.id === groupId);
    
    if (!foundGroup) {
      // Se não encontrou, redireciona para home
      router.push('/home');
      return;
    }
    
    setGroup(foundGroup);
    
    // Limpa as mensagens não lidas quando entra no chat
    clearUnread(groupId);
  }, [groupId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !group) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'Você',
      text: inputText,
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages([...messages, newMessage]);
    
    // Atualiza a última mensagem no localStorage
    updateGroupLastMessage(group.id, inputText, 'Você');
    
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (!group) {
    return (
      <Page.Main className="flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando...</p>
        </div>
      </Page.Main>
    );
  }

  return (
    <>
      <Page.Header className="p-0 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold uppercase text-white shadow-md',
              group.avatarBg,
            )}
          >
            {group.name
              .split(' ')
              .slice(0, 2)
              .map((word) => word[0])
              .join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate">
              {group.name}
            </h1>
            <p className="text-xs text-slate-500">
              {group.members} membros
            </p>
          </div>
        </div>
      </Page.Header>

      <Page.Main className="flex flex-col bg-gradient-to-b from-slate-50 to-white p-0 pb-24">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                'flex gap-3',
                message.isOwn ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {!message.isOwn && (
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-700">
                    {message.sender[0]}
                  </div>
                </div>
              )}
              <div
                className={clsx(
                  'flex flex-col max-w-[75%]',
                  message.isOwn ? 'items-end' : 'items-start',
                )}
              >
                {!message.isOwn && (
                  <span className="text-xs font-semibold text-slate-600 mb-1 px-1">
                    {message.sender}
                  </span>
                )}
                <div
                  className={clsx(
                    'rounded-2xl px-4 py-2.5 shadow-sm',
                    message.isOwn
                      ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-900',
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-2 ring-transparent focus:bg-white focus:border-slate-300 focus:ring-slate-200 transition-all"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={clsx(
                'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200',
                inputText.trim()
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-100'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed',
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Page.Main>
    </>
  );
}

