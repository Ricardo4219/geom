// components/IngredientTable.tsx
import type { Row } from '../types';

interface Props {
  items: Row[];
  onNombreChange: (idx: number, v: string) => void;
  onValorChange: (idx: number, v: number) => void;
  onMallaChange: (idx: number, v: Row['malla']) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
}

export function IngredientTable({ items, onNombreChange, onValorChange, onMallaChange, onRemove, onAdd }: Props) {
  return (
    <div className="tabla">
      <div className="fila cab">
        <div>Ingrediente</div>
        <div>Valor (mg)</div>
        <div>Malla</div>
        <div></div>
      </div>
      {items.map((r, i) => (
        <div className="fila" key={r.id}>
          <input
            type="text"
            value={r.nombre}
            onChange={(e) => onNombreChange(i, e.target.value)}
            placeholder="Ingrediente"
          />
          <input
            type="number"
            value={r.valor}
            min={0}
            step={0.01}
            onChange={(e) => onValorChange(i, +e.target.value)}
          />
          <select
            className="select"
            value={r.malla}
            onChange={(e) => onMallaChange(i, e.target.value as Row['malla'])}
          >
            <option value="40">40</option>
            <option value="80">80</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
          <button className="icon-btn" onClick={() => onRemove(i)} title="Eliminar ingrediente" aria-label="Eliminar ingrediente">
            ×
          </button>
        </div>
      ))}
      <button className="button secondary" onClick={onAdd} style={{ marginTop: 8 }}>
        Añadir ingrediente
      </button>
    </div>
  );
}