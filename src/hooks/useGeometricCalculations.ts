// hooks/useGeometricCalculations.ts
import { useMemo } from 'react';
import { bd } from '../lib/geom';
import type { Row, Tanda } from '../types';

export interface GeoCalcResult {
  ingredientes: { nombre: string; peso: number }[];
  mallasMap: Record<string, string>;
  prepesadoTandas: Tanda[];
}

export function useGeometricCalculations(rows: Row[], produccionGramos: number): GeoCalcResult {
  return useMemo(() => {
    const out = bd(rows, produccionGramos);
    return {
      ingredientes: out.ingredientes,
      mallasMap: out.mallasMap,
      prepesadoTandas: out.prepesadoTandas,
    };
  }, [rows, produccionGramos]);
}