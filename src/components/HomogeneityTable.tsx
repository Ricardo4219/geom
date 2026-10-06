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
  const cell: React.CSSProperties = { padding: '8px 9px' };
  const num: React.CSSProperties = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  return (
    <div style={{ overflowX: 'auto', marginTop: 14 }}>
      <table>
        <thead>
          <tr>
            <th style={{ ...cell, textAlign: 'left' }}>Paso</th>
            <th style={{ ...cell, textAlign: 'left' }}>Fase</th>
            <th style={{ ...cell, textAlign: 'right' }}>Mezcla antes (g)</th>
            <th style={{ ...cell, textAlign: 'right' }}>Adición (g)</th>
            <th style={{ ...cell, textAlign: 'right' }}>Mezcla después (g)</th>
            <th style={{ ...cell, textAlign: 'right' }}>Índice (%)</th>
            <th style={{ ...cell, textAlign: 'right' }}>Residual (%)</th>
            <th style={{ ...cell, textAlign: 'right' }}>RSD Est. (%)</th>
            <th style={{ ...cell, textAlign: 'right' }}>Energía (RPM/s)</th>
          </tr>
        </thead>
        <tbody>
          {pasos.map((p, i) => {
            const n = i + 1;
            const esViol = setViol.has(n) || (p.adicion > p.mezclaAntes + 0.05 && p.ingrediente !== 'UNIFICACIÓN');
            const rsd = p.rsdEstimado ?? 0;
            const rsdClass = rsd < 5 ? 'ok' : rsd < 10 ? 'warn' : 'danger';
            return (
              <tr
                key={n}
                style={{
                  background: esViol ? 'rgba(255,107,107,0.09)' : undefined,
                }}
              >
                <td style={cell}>{n}</td>
                <td style={cell}>
                  <span className={`badge ${esViol ? 'danger' : 'ok'}`}>{nombreFase(p.fase)}</span>
                </td>
                <td style={num}>{p.mezclaAntes.toFixed(2)}</td>
                <td style={num}>{p.adicion.toFixed(2)}</td>
                <td style={num}>{p.mezclaDespues.toFixed(2)}</td>
                <td style={num}>{((p.indiceHomogeneidad ?? 0) * 100).toFixed(1)}</td>
                <td style={num}>{((p.homogeneidadResidual ?? 0) * 100).toFixed(1)}</td>
                <td style={num}>
                  <span className={`badge ${rsdClass}`}>{rsd.toFixed(1)}</span>
                </td>
                <td style={num}>
                  {p.energia ? `${p.energia.rpm ?? '—'} RPM / ${p.energia.tiempoSeg ?? '—'}s` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
