'use client';

import { useEffect } from 'react';
import { initializeAvailableGroups } from '@/lib/groups';

export function GroupsInitializer() {
  useEffect(() => {
    // Inicializa grupos disponíveis na primeira carga
    initializeAvailableGroups();
  }, []);

  return null;
}

