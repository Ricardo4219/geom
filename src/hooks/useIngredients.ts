// hooks/useIngredients.ts
import { useState, useCallback } from 'react';
import type { Row } from '../types';

const EJEMPLO: Omit<Row, 'id'>[] = [
  { nombre: 'Ingrediente A', valor: 41.11, malla: '80' },
  { nombre: 'Ingrediente B', valor: 33.33, malla: '80' },
  { nombre: 'Ingrediente C', valor: 21.11, malla: '40' },
  { nombre: 'Ingrediente D', valor: 2.22, malla: '80' },
  { nombre: 'Ingrediente E', valor: 2.22, malla: '80' },
];

function nextId(): string {
  return 'ing_' + Math.random().toString(36).slice(2, 10);
}

export function useIngredients(initial?: Row[]) {
  const [items, setItems] = useState<Row[]>(
    initial && initial.length
      ? initial
      : EJEMPLO.map((e) => ({ ...e, id: nextId() }))
  );

  const onNombreChange = useCallback((idx: number, v: string) => {
    setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, nombre: v } : r)));
  }, []);

  const onValorChange = useCallback((idx: number, v: number) => {
    setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, valor: Math.max(0, v) } : r)));
  }, []);

  const onMallaChange = useCallback((idx: number, v: Row['malla']) => {
    setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, malla: v } : r)));
  }, []);

  const onRemove = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const onAdd = useCallback(() => {
    setItems((prev) => [...prev, { id: nextId(), nombre: ` nuevo ' ${String.fromCharCode(65 + prev.length)}`, valor: 0, malla: '80' }]);
  }, []);

  const cargarEjemplo = useCallback(() => {
    setItems(EJEMPLO.map((e) => ({ ...e, id: nextId() })));
  }, []);

  return {
    items,
    setItems,
    onNombreChange,
    onValorChange,
    onMallaChange,
    onRemove,
    onAdd,
    cargarEjemplo,
  };
}