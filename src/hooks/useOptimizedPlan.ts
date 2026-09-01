// hooks/useOptimizedPlan.ts
import { useMemo } from 'react';
import { wd } from '../lib/geom';
import type { HomogeneidadParams } from '../types';

export interface PlanResult {
  planOptimizado: string[];
  pasosGeom: import('../types').PasoOptimizado[];
  violaciones: number[];
  advertenciaGeom: string;
}

export function useOptimizedPlan(
  ingredientes: { nombre: string; peso: number }[],
  mallasMap: Record<string, string>,
  params: HomogeneidadParams
): PlanResult {
  return useMemo(() => wd(ingredientes, mallasMap, params), [ingredientes, mallasMap, params]);
}