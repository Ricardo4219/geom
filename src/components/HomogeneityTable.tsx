// components/HomogeneityTable.tsx
import type { PasoOptimizado } from '../types';
import { nombreFase } from '../lib/geom';

interface Props {
  pasos: PasoOptimizado[];
  violaciones: number[];
}

export function HomogeneityTable({ pasos, violaciones = [] }: Props) {
  if (pasos.length === 0) return null;
  const setViol = new Set(violaciones);
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: 6 }}>Paso</th>
            <th style={{ textAlign: 'left', padding: 6 }}>Fase</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Mezcla antes (g)</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Adición (g)</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Mezcla después (g)</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Índice (%)</th>
            <th style={{ textAlign: 'right', padding: 6 }}>Residual (%)</th>
            <th style={{ textAlign: 'right', padding: 6 }}>RSD Est. (%)</th>
          </tr>
        </thead>
        <tbody>
          {pasos.map((p, i) => {
            const n = i + 1;
            const esViol = setViol.has(n) || (p.adicion > p.mezclaAntes + 0.05 && p.ingrediente !== 'UNIFICACIÓN');
            return (
              <tr
                key={n}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: esViol ? 'rgba(255,107,107,0.08)' : undefined,
                }}
              >
                <td style={{ padding: 6 }}>{n}</td>
                <td style={{ padding: 6 }}>{nombreFase(p.fase)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{p.mezclaAntes.toFixed(2)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{p.adicion.toFixed(2)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{p.mezclaDespues.toFixed(2)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{((p.indiceHomogeneidad ?? 0) * 100).toFixed(1)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{((p.homogeneidadResidual ?? 0) * 100).toFixed(1)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{(p.rsdEstimado ?? 0).toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}