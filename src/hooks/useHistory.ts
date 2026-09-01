// hooks/useHistory.ts
// Wrapper React sobre historyService con recarga automática.

import { useState, useCallback, useEffect } from 'react';
import {
  listarMezclas,
  guardarMezcla,
  eliminarMezcla,
  eliminarTodas,
  exportarJSON,
  importarJSON,
  obtenerMezcla,
  storageInfo,
} from '../services/historyService';
import type { MezclaHistorial } from '../types';

export function useHistory() {
  const [mezclas, setMezclas] = useState<MezclaHistorial[]>(() => listarMezclas());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setMezclas(listarMezclas());
  }, []);

  const guardar = useCallback(
    (mezcla: Omit<MezclaHistorial, 'id' | 'fechaGuardado'>): MezclaHistorial | null => {
      try {
        const nueva = guardarMezcla(mezcla);
        refresh();
        setError(null);
        return nueva;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido';
        setError(msg);
        return null;
      }
    },
    [refresh]
  );

  const eliminar = useCallback(
    (id: string): boolean => {
      const ok = eliminarMezcla(id);
      if (ok) refresh();
      return ok;
    },
    [refresh]
  );

  const eliminarTodo = useCallback(() => {
    eliminarTodas();
    refresh();
  }, [refresh]);

  const cargar = useCallback((id: string): MezclaHistorial | null => {
    return obtenerMezcla(id);
  }, []);

  const exportar = useCallback(() => exportarJSON(), []);

  const importar = useCallback(
    (json: string, opts: { merge?: boolean } = {}): number => {
      try {
        const n = importarJSON(json, opts);
        refresh();
        setError(null);
        return n;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error importando';
        setError(msg);
        return 0;
      }
    },
    [refresh]
  );

  const limpiarError = useCallback(() => setError(null), []);

  // Sincronizar entre pestañas/ventanas
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'nutralab-geom:historial') refresh();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

  return {
    mezclas,
    error,
    guardar,
    eliminar,
    eliminarTodo,
    cargar,
    exportar,
    importar,
    limpiarError,
    refresh,
    storage: storageInfo(),
  };
}