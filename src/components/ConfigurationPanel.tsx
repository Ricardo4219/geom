// components/ConfigurationPanel.tsx
import type { ConfiguracionState } from '../types';

interface Props {
  config: ConfiguracionState;
  onConfigChange: (campo: keyof ConfiguracionState, valor: string | number) => void;
}

export function ConfigurationPanel({ config, onConfigChange }: Props) {
  return (
    <div>
      <label>
        Peso cápsula (mg)
        <input
          className="input"
          type="number"
          min={0}
          value={config.pesoCapsulaMg}
          onChange={(e) => onConfigChange('pesoCapsulaMg', Math.max(0, +e.target.value))}
        />
      </label>
      <label>
        Objetivo total cápsula (mg)
        <input
          className="input"
          type="number"
          min={0}
          value={config.objetivoCapsulaMg}
          onChange={(e) => onConfigChange('objetivoCapsulaMg', Math.max(0, +e.target.value))}
        />
      </label>
      <label>
        Producción (g contenido)
        <input
          className="input"
          type="number"
          min={0}
          value={config.produccionGramos}
          onChange={(e) => onConfigChange('produccionGramos', Math.max(0, +e.target.value))}
        />
      </label>
      <label>
        Lote
        <input
          className="input"
          type="text"
          value={config.lote}
          onChange={(e) => onConfigChange('lote', e.target.value)}
        />
      </label>
      <label>
        Caducidad
        <input
          className="input"
          type="date"
          value={config.caducidad}
          onChange={(e) => onConfigChange('caducidad', e.target.value)}
        />
      </label>
      <label>
        Responsable
        <input
          className="input"
          type="text"
          value={config.responsable}
          onChange={(e) => onConfigChange('responsable', e.target.value)}
        />
      </label>
      <label>
        Fecha
        <input
          className="input"
          type="date"
          value={config.fecha}
          onChange={(e) => onConfigChange('fecha', e.target.value)}
        />
      </label>
    </div>
  );
}