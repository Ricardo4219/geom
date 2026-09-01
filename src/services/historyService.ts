// services/historyService.ts
// CRUD del historial de mezclas con persistencia en localStorage.
//
// Esquema en localStorage:
//   nutralab-geom:historial  →  MezclaHistorial[]  (lista completa)
//
// Decisiones de diseño:
//   - NO usar Firebase (alineado con decisión de mantener NutraLab-Geom 100% client-side).
//   - Single key: una sola lista serializada. Para <500 mezclas no hay problema de performance.
//   - Si el JSON crece >4MB (límite ~5MB de localStorage), se emite warning pero no se rompe.
//   - Exportar/Importar a JSON para migrar entre dispositivos.

import type { MezclaHistorial } from '../types';

const STORAGE_KEY = 'nutralab-geom:historial';

// ──────────────────────────────────────────────────────────────────────────────
// API de bajo nivel (no debería usarse directo desde componentes)
// ──────────────────────────────────────────────────────────────────────────────

function readStorage(): MezclaHistorial[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MezclaHistorial[]) : [];
  } catch (e) {
    console.error('historyService: error leyendo localStorage', e);
    return [];
  }
}

function writeStorage(items: MezclaHistorial[]): void {
  try {
    const json = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e: unknown) {
    // QuotaExceededError o similares
    const err = e as { name?: string; message?: string };
    console.error(`historyService: error escribiendo localStorage (${err.name ?? 'unknown'}): ${err.message ?? ''}`);
    throw new Error(`No se pudo guardar: localStorage lleno o inaccesible (${err.name ?? 'error'})`);
  }
}

export function nextId(): string {
  return 'mezcla_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ──────────────────────────────────────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────────────────────────────────────

export function listarMezclas(): MezclaHistorial[] {
  return readStorage().sort((a, b) =>
    new Date(b.fechaGuardado).getTime() - new Date(a.fechaGuardado).getTime()
  );
}

export function obtenerMezcla(id: string): MezclaHistorial | null {
  return readStorage().find((m) => m.id === id) ?? null;
}

export function guardarMezcla(mezcla: Omit<MezclaHistorial, 'id' | 'fechaGuardado'>): MezclaHistorial {
  const nueva: MezclaHistorial = {
    ...mezcla,
    id: nextId(),
    fechaGuardado: new Date().toISOString(),
  };
  const lista = readStorage();
  lista.push(nueva);
  writeStorage(lista);
  return nueva;
}

export function eliminarMezcla(id: string): boolean {
  const lista = readStorage();
  const filtrada = lista.filter((m) => m.id !== id);
  if (filtrada.length === lista.length) return false;
  writeStorage(filtrada);
  return true;
}

export function eliminarTodas(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportarJSON(): string {
  return JSON.stringify(
    {
      app: 'nutralab-geom',
      version: 1,
      exportedAt: new Date().toISOString(),
      mezclas: readStorage(),
    },
    null,
    2
  );
}

export function importarJSON(json: string, opts: { merge?: boolean } = {}): number {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('JSON inválido');
  }
  const mezclas = (parsed as { mezclas?: unknown }).mezclas;
  if (!Array.isArray(mezclas)) {
    throw new Error('Formato inválido: falta array "mezclas"');
  }
  // Validación mínima de cada item
  const validas = mezclas.filter((m: unknown): m is MezclaHistorial => {
    if (typeof m !== 'object' || m === null) return false;
    const o = m as Record<string, unknown>;
    return (
      typeof o.id === 'string' &&
      typeof o.nombre === 'string' &&
      typeof o.fechaGuardado === 'string' &&
      typeof o.config === 'object' &&
      Array.isArray(o.items)
    );
  });
  if (validas.length === 0) throw new Error('No se encontraron mezclas válidas');

  const listaActual = opts.merge ? readStorage() : [];
  const idsExistentes = new Set(listaActual.map((m) => m.id));
  const nuevas = validas.filter((m) => !idsExistentes.has(m.id));
  const merged = [...listaActual, ...nuevas];
  writeStorage(merged);
  return nuevas.length;
}

// ──────────────────────────────────────────────────────────────────────────────
// Métricas de uso (para UI)
// ──────────────────────────────────────────────────────────────────────────────

export function storageInfo(): { count: number; bytes: number; percentUsed: number } {
  const raw = localStorage.getItem(STORAGE_KEY);
  const bytes = raw ? new Blob([raw]).size : 0;
  // 5MB es el límite típico de localStorage
  const limit = 5 * 1024 * 1024;
  return {
    count: readStorage().length,
    bytes,
    percentUsed: (bytes / limit) * 100,
  };
}