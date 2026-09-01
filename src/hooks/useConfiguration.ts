// hooks/useConfiguration.ts
import { useState, useCallback } from 'react';
import type { ConfiguracionState } from '../types';

function hoyISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const DEFAULTS: ConfiguracionState = {
  pesoCapsulaMg: 0,
  objetivoCapsulaMg: 450,
  produccionGramos: 0,
  lote: '',
  caducidad: '',
  responsable: '',
  fecha: hoyISO(),
  formulaNombre: '',
};

export function useConfiguration() {
  const [config, setConfig] = useState<ConfiguracionState>(DEFAULTS);

  const onConfigChange = useCallback((campo: keyof ConfiguracionState, valor: string | number) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  return { config, onConfigChange, setConfig };
}