// components/HomogeneityControls.tsx
import type { HomogeneidadParams, MetodoHomog } from '../types';

interface Props {
  params: HomogeneidadParams;
  onParamChange: (campo: keyof HomogeneidadParams, valor: number | string) => void;
}

const METODOS: { value: MetodoHomog; label: string }[] = [
  { value: 'quadratic', label: 'Cuadrático' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'ratio', label: 'Ratio' },
];

export function HomogeneityControls({ params, onParamChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        α homogeneidad
        <input
          className="input"
          type="number"
          min={0.2}
          max={2}
          step={0.05}
          value={params.alphaHomog}
          onChange={(e) =>
            onParamChange('alphaHomog', Math.min(2, Math.max(0.05, +e.target.value)))
          }
          style={{ width: 90 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        Método
        <select
          className="select"
          value={params.metodoHomog}
          onChange={(e) => onParamChange('metodoHomog', e.target.value as MetodoHomog)}
          style={{ width: 130 }}
        >
          {METODOS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        RSD inicial (%)
        <input
          className="input"
          type="number"
          min={1}
          max={100}
          step={1}
          value={params.rsdInicial}
          onChange={(e) =>
            onParamChange('rsdInicial', Math.min(100, Math.max(1, +e.target.value)))
          }
          style={{ width: 100 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        Tol ± (ratio)
        <input
          className="input"
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={params.ratioTol}
          onChange={(e) => onParamChange('ratioTol', Math.max(0, Math.min(1, +e.target.value)))}
          style={{ width: 100 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        Merge %
        <input
          className="input"
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={params.ratioTol}
          onChange={(e) =>
            onParamChange('ratioTol', Math.max(0, Math.min(1, +e.target.value)))
          }
          style={{ width: 100 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        Residuo g
        <input
          className="input"
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={params.epsMerge}
          onChange={(e) => onParamChange('epsMerge', Math.max(0, Math.min(1, +e.target.value)))}
          style={{ width: 100 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
        RSD objetivo (%)
        <input
          className="input"
          type="number"
          min={0.1}
          max={20}
          step={0.1}
          value={params.objetivoRSD ?? 5}
          onChange={(e) => onParamChange('objetivoRSD', Math.max(0.1, Math.min(20, +e.target.value)))}
          style={{ width: 100 }}
        />
      </label>
    </div>
  );
}