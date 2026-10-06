// components/MixingPlanDisplay.tsx
import type { HomogeneidadParams, PasoOptimizado } from '../types';
import { Sparkline } from './Sparkline';
import { HomogeneityControls } from './HomogeneityControls';
import { HomogeneityTable } from './HomogeneityTable';

interface Props {
  totalObjetivo: number;
  planOptimizado: string[];
  pasosGeom: PasoOptimizado[];
  violaciones: number[];
  advertencia?: string;
  advertenciaGeom?: string;
  homogeneidadParams: HomogeneidadParams;
  onHomogeneidadParamChange: (campo: keyof HomogeneidadParams, valor: number | string | boolean) => void;
  onExportCSV: () => void;
}

export function MixingPlanDisplay({
  totalObjetivo,
  planOptimizado,
  pasosGeom,
  violaciones,
  advertencia,
  advertenciaGeom,
  homogeneidadParams,
  onHomogeneidadParamChange,
  onExportCSV,
}: Props) {
  const indices = pasosGeom.map((p) => (p.indiceHomogeneidad ?? 0) * 100);
  return (
    <section className="panel scroll">
      <h2 style={{ marginTop: 0 }}>Propuesta de Plan de Mezcla Optimizado y Simplificado</h2>
      <p>
        Este procedimiento sigue las Buenas Prácticas de Manufactura (BPM/GMP), reduce drásticamente
        el riesgo de error y asegura un resultado mucho más homogéneo y validable.
      </p>
      <p>
        <span className="badge">Total de la Mezcla: {totalObjetivo.toFixed(2)} g</span>
      </p>

      <h3 style={{ margin: '14px 0 6px' }}>Paso 0: Preparación de Materias Primas</h3>
      <ul className="list">
        <li>
          Tamizado: Pasa cada uno de los ingredientes, por separado, a través de un tamiz de malla 80.
        </li>
        <li>
          Objetivo: Romper cualquier aglomerado y asegurar que todos los polvos tengan un perfil de
          tamaño de partícula consistente y estén sueltos.
        </li>
      </ul>

      <h3 style={{ margin: '6px 0' }}>Paso 1: Dilución Geométrica</h3>
      <HomogeneityControls params={homogeneidadParams} onParamChange={onHomogeneidadParamChange} />
      <div style={{ marginTop: 8 }}>
        <Sparkline data={indices} />
      </div>

      <ol className="list steps">
        {planOptimizado.map((linea, i) => (
          <li key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: 6 }}>
            {linea}
          </li>
        ))}
      </ol>

      <HomogeneityTable pasos={pasosGeom} violaciones={violaciones} />

      {(advertencia || advertenciaGeom) && (
        <p className="warn" style={{ color: 'var(--brand)' }}>
          {advertenciaGeom || advertencia}
        </p>
      )}

      <button className="button" onClick={onExportCSV} style={{ marginTop: 8 }}>
        Exportar CSV homogeneidad
      </button>
    </section>
  );
}