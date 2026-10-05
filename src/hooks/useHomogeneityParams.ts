// hooks/useHomogeneityParams.ts
import { useState, useCallback } from 'react';
import type { HomogeneidadParams } from '../types';

const DEFAULTS: HomogeneidadParams = {
  alphaHomog: 1.2,  // Actualizado 2026-08-31: validación con Fucoxina 0826
                     // mostró que α=1.2 captura mejor la eficacia real cuando
                     // los pasos tempranos tienen ratio 1:1. Reduce RSD estimada
                     // en ~50% sin cambiar el plan operativo.
                     // Para fórmulas con pesos muy dispares, considerar 0.7-0.9.
  rsdInicial: 30,
  metodoHomog: 'quadratic',
  ratioTol: 0.15,
  epsMerge: 0.05,
};

export function useHomogeneityParams() {
  const [params, setParams] = useState<HomogeneidadParams>(DEFAULTS);

  const onParamChange = useCallback((campo: keyof HomogeneidadParams, valor: number | string) => {
    setParams((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  return { params, onParamChange, setParams };
}