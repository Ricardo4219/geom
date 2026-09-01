// utils/exporters.ts
import type { HomogeneidadParams, PasoGeom, PasoOptimizado } from '../types';
import { nombreFase } from '../lib/geom';

export interface ExportTxtParams {
  formula?: string;
  lote?: string;
  caducidad?: string;
  responsable?: string;
  fecha?: string;
  total: number;
  ingredientes: { nombre: string; peso: number }[];
  pasos: PasoGeom[];
  reservasTotal: number;
  pasosGeom: PasoOptimizado[];
  planOptimizado: string[];
  params: HomogeneidadParams;
  advertencia?: string;
  advertenciaGeom?: string;
}

export function exportarTxt(p: ExportTxtParams): void {
  const a: string[] = [];
  a.push('NutraLab-Geom');
  a.push('Mezcla siempre dos porciones de igual peso para lograr homogeneidad.');
  a.push('');
  if (p.formula) a.push(`Fórmula: ${p.formula}`);
  if (p.lote) a.push(`Lote: ${p.lote}`);
  if (p.caducidad) a.push(`Caducidad: ${p.caducidad}`);
  if (p.responsable) a.push(`Responsable: ${p.responsable}`);
  if (p.fecha) a.push(`Fecha: ${p.fecha}`);
  a.push(`Total de la Mezcla: ${p.total.toFixed(2)} g`);
  a.push('');
  a.push('Ingredientes:');
  for (const ing of p.ingredientes) {
    a.push(`  - ${ing.nombre}: ${ing.peso.toFixed(2)} g`);
  }
  a.push('');
  a.push('Paso 0: Preparación de Materias Primas');
  a.push('- Tamizado: Pasa cada uno de los ingredientes, por separado, a través de un tamiz de malla 80.');
  a.push('- Objetivo: Romper cualquier aglomerado y asegurar que todos los polvos tengan un perfil de tamaño de partícula consistente y estén sueltos.');
  a.push('');
  a.push('Paso 1: Dilución Geométrica');
  a.push('- Principio: Siempre se añade el siguiente ingrediente a la mezcla acumulada, en una cantidad aproximadamente igual al total de la mezcla ya existente.');
  a.push('');
  for (const paso of p.planOptimizado) {
    a.push(`  ${paso}`);
  }
  if (p.pasosGeom.length) {
    a.push('');
    a.push(
      `Tabla de homogeneidad  (Método=${p.params.metodoHomog}, α=${p.params.alphaHomog.toFixed(2)}, Tol=±${(p.params.ratioTol * 100).toFixed(0)}%, Merge%=${(p.params.mergeThreshold * 100).toFixed(0)}, ResiduoAbs=${p.params.epsMerge.toFixed(2)} g)`
    );
    a.push('Paso | Fase | MezclaAntes(g) | Adicion(g) | MezclaDespues(g) | Indice(%) | Residual(%)');
    a.push('-----+------+---------------+------------+------------------+----------+-----------');
    p.pasosGeom.forEach((k, i) => {
      const fase = nombreFase(k.fase).padStart(4, ' ');
      const ma = k.mezclaAntes.toFixed(2).padStart(11, ' ');
      const ad = k.adicion.toFixed(2).padStart(8, ' ');
      const md = k.mezclaDespues.toFixed(2).padStart(14, ' ');
      const ind = ((k.indiceHomogeneidad ?? 0) * 100).toFixed(1).padStart(8, ' ');
      const res = ((k.homogeneidadResidual ?? 0) * 100).toFixed(1).padStart(9, ' ');
      const flag = k.adicion > k.mezclaAntes + 0.05 && k.ingrediente !== 'UNIFICACIÓN' ? '  *' : '';
      a.push(`${String(i + 1).padStart(2, ' ')} |${fase} | ${ma} | ${ad} | ${md} | ${ind} | ${res}${flag}`);
    });
  }
  const advertenciaFinal = p.advertenciaGeom ?? p.advertencia;
  if (advertenciaFinal) {
    a.push('');
    a.push(advertenciaFinal);
  }

  const blob = new Blob([a.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nutralab-plan.txt';
  link.click();
  URL.revokeObjectURL(url);
}

export function exportarCSV(pasosGeom: PasoOptimizado[]): void {
  const header = ['Paso', 'Fase', 'MezclaAntes(g)', 'Adicion(g)', 'MezclaDespues(g)', 'Indice(%)', 'Residual(%)', 'RSD_Est(%)'];
  const rows = pasosGeom.map((u, i) => [
    String(i + 1),
    u.fase ?? '',
    u.mezclaAntes.toFixed(2),
    u.adicion.toFixed(2),
    u.mezclaDespues.toFixed(2),
    ((u.indiceHomogeneidad ?? 0) * 100).toFixed(1),
    ((u.homogeneidadResidual ?? 0) * 100).toFixed(1),
    (u.rsdEstimado ?? 0).toFixed(1),
  ]);
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'homogeneidad.csv';
  link.click();
  URL.revokeObjectURL(url);
}