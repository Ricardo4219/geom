// hooks/useHomogeneityParams.ts
import { useState, useCallback } from 'react';
import type { HomogeneidadParams } from '../types';

const DEFAULTS: HomogeneidadParams = {
  alphaHomog: 0.9,
  rsdInicial: 30,
  metodoHomog: 'quadratic',
  ratioTol: 0.15,
  mergeThreshold: 0.15,
  epsMerge: 0.05,
};

export function useHomogeneityParams() {
  const [params, setParams] = useState<HomogeneidadParams>(DEFAULTS);

  const onParamChange = useCallback((campo: keyof HomogeneidadParams, valor: number | string) => {
    setParams((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  return { params, onParamChange, setParams };
}