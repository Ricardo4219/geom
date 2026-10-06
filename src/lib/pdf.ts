// lib/pdf.ts
// Generador de PDF con pdfmake (lazy import desde usePDFModule).
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { PDFParams, PasoOptimizado, Tanda } from '../types';

// Inicializar fuentes (Roboto por defecto en pdfmake)
type PdfFontsModule = { pdfMake?: { vfs?: Record<string, string> }; vfs?: Record<string, string> };
const fontsAny = pdfFonts as unknown as PdfFontsModule;
const vfs = fontsAny.pdfMake?.vfs ?? fontsAny.vfs;
if (vfs) {
  (pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs;
}

export async function exportarPlanPDF(params: PDFParams): Promise<boolean> {
  const { total, ingredientes, pasos, reservasTotal, prepesadoTandas, mallas } = params;

  const docDefinition = buildDocDefinition(params, total, ingredientes, pasos, reservasTotal, prepesadoTandas, mallas);
  const pdf = pdfMake.createPdf(docDefinition);

  // Estrategia de descarga: getBlob → object URL → click → revoke
  // (más robusto que pdfMake.download en navegadores modernos)
  return new Promise<boolean>((resolve) => {
    try {
      pdf.getBlob((blob: Blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'nutralab-plan.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve(true);
        } catch {
          resolve(false);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

function buildDocDefinition(
  p: PDFParams,
  total: number,
  ingredientes: { nombre: string; peso: number }[],
  _pasos: PDFParams['pasos'],
  reservasTotal: number,
  prepesadoTandas: Tanda[],
  mallas: Record<string, string>
): Record<string, unknown> {
  const ke: unknown[] = [];

  const titulo = { text: 'NutraLab-Geom', style: 'h1' };

  const par = (texto: string) => ({
    text: texto,
    alignment: 'justify' as const,
    margin: [0, 0, 0, 6] as [number, number, number, number],
  });

  const campo = (etiqueta: string, valor: string, bold = false) => ({
    text: `${etiqueta}: ${valor}`.trim(),
    bold,
    alignment: 'center' as const,
    margin: [6, 3, 6, 3] as [number, number, number, number],
  });

  // Encabezado con metadatos
  const metaRow = [
    campo('Lote', p.lote ?? ''),
    campo('Caducidad', p.caducidad ?? ''),
    campo('Responsable', p.responsable ?? ''),
    campo('Total', `${total.toFixed(2)} g`, true),
  ];

  const tablaMeta = {
    table: {
      widths: ['*', '*', '*', '*'] as const,
      body: [metaRow],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#cfd8dc',
      vLineColor: () => '#cfd8dc',
    },
    margin: [0, 0, 0, 8] as [number, number, number, number],
  };

  ke.push(titulo);
  ke.push(tablaMeta);

  ke.push({
    columns: [
      { text: 'Objetivo por ingrediente', style: 'h2', margin: [0, 12, 0, 6] },
      p.formula
        ? { text: `Fórmula: ${p.formula}`, alignment: 'right' as const, margin: [0, 12, 0, 6] }
        : { text: '' },
    ],
  });

  const tablaIng = (() => {
    const rows: unknown[][] = [['Ingrediente', 'Peso (g)'], ...ingredientes.map((i) => [i.nombre, `${i.peso.toFixed(2)} g`])];
    return {
      table: {
        widths: ['auto', '*'] as const,
        body: rows.map((r) =>
          r.map((c, idx) =>
            idx === 0
              ? { text: String(c), style: 'tableHeader' as const }
              : { text: String(c), alignment: 'justify' as const }
          )
        ),
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 8],
    };
  })();
  ke.push(tablaIng);

  const e: PasoOptimizado[] = p.pasosGeom ?? [];

  // Prepesado derivado del plan real (pesos exactos por tanda).
  // (Se eliminó el bloque "tandas sugeridas" obsoleto del algoritmo con sub-mezcla por malla.)
  if (e.length) {
    ke.push({ text: 'Prepesado según plan (pesos exactos)', style: 'h2', margin: [0, 12, 0, 6] });
    const filasPlan: unknown[][] = [[{ text: 'Ingrediente', style: 'tableHeader' }, { text: 'Tandas', style: 'tableHeader' }, { text: 'Peso total (g)', style: 'tableHeader' }]];

    // Agrupar adiciones por ingrediente (excluyendo UNIFICACIÓN)
    const porIngrediente: Record<string, { tandas: number[]; total: number }> = {};
    for (const paso of e) {
      if (paso.ingrediente === 'UNIFICACIÓN') continue;
      const ing = paso.ingrediente;
      if (!porIngrediente[ing]) porIngrediente[ing] = { tandas: [], total: 0 };
      porIngrediente[ing].tandas.push(paso.adicion);
      porIngrediente[ing].total += paso.adicion;
    }

    for (const [ing, data] of Object.entries(porIngrediente)) {
      const tandasStr = data.tandas.map((t) => `${t.toFixed(2)} g`).join(', ');
      filasPlan.push([
        { text: ing, alignment: 'left' as const },
        { text: tandasStr, alignment: 'left' as const },
        { text: data.total.toFixed(2), alignment: 'right' as const },
      ]);
    }

    ke.push({
      table: {
        widths: ['*', '*', 'auto'] as const,
        body: filasPlan,
      },
      layout: 'lightHorizontalLines',
      fontSize: 8,
      margin: [0, 0, 0, 8],
    });
  }

  ke.push({ text: 'Plan de Mezcla Optimizado', style: 'h2', margin: [0, 12, 0, 6] });
  ke.push({ text: 'Paso 0: Preparación de Materias Primas', style: 'h2' });
  ke.push({
    ul: [
      {
        text: 'Tamizado: Pasa cada uno de los ingredientes, por separado, a través de un tamiz de malla 80.',
        alignment: 'justify',
      },
      {
        text:
          'Objetivo: Romper cualquier aglomerado y asegurar que todos los polvos tengan un perfil de tamaño de partícula consistente y estén sueltos.',
        alignment: 'justify',
      },
    ],
    margin: [0, 0, 0, 6],
  });

  ke.push({ text: 'Paso 1: Dilución Geométrica', style: 'h2' });
  ke.push({
    ul: [
      {
        text:
          'Principio: Siempre se añade el siguiente ingrediente a la mezcla acumulada, en una cantidad aproximadamente igual al total de la mezcla ya existente.',
        alignment: 'justify',
      },
    ],
    margin: [0, 0, 0, 6],
  });

  // Tabla del plan
  const filasPlan: string[][] = [['Paso', 'Procedimiento', 'Mezcla accum. (g)', 'Energía (RPM / s)']];
  const r: string[] = p.planOptimizado ?? [];
  const n: { n: number; texto: string; mezcla: string; tiempo: string }[] = [];
  if (r.length && e.length === r.length) {
    for (let i = 0; i < r.length; i++) {
      const c = e[i];
      const tiempo = c?.energia ? `${c.energia.rpm ?? '—'} RPM / ${c.energia.tiempoSeg ?? '—'}s` : '—';
      n.push({ n: i + 1, texto: r[i] ?? '', mezcla: ((c?.mezclaDespues ?? 0) as unknown as number).toFixed(2), tiempo });
    }
  } else if (e.length) {
    e.forEach((c, i) => {
      const tiempo = c.energia ? `${c.energia.rpm ?? '—'} RPM / ${c.energia.tiempoSeg ?? '—'}s` : '—';
      n.push({ n: i + 1, texto: c.descripcion, mezcla: c.mezclaDespues.toFixed(2), tiempo });
    });
  } else {
    n.push({ n: 1, texto: 'No hay ingredientes para mezclar.', mezcla: '-', tiempo: '—' });
  }
  for (const x of n) filasPlan.push([String(x.n), x.texto, x.mezcla, x.tiempo]);
  ke.push({
    table: {
      widths: ['auto', '*', 'auto', 'auto'] as const,
      body: filasPlan.map((r2) =>
        r2.map((c, idx) =>
          idx === 0
            ? { text: String(c), style: 'tableHeader' as const }
            : { text: String(c), alignment: 'justify' as const }
        )
      ),
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 8],
  });

  // Tabla de homogeneidad
  if (e.length) {
    const A = p.metodoHomog ?? 'quadratic';
    const c = (p.alphaHomog ?? 0).toFixed(2);
    const l = p.ratioTol !== undefined ? (p.ratioTol * 100).toFixed(0) : '—';
    const y2 = p.epsMerge !== undefined ? p.epsMerge.toFixed(2) : '—';
    const h2 = p.rsdInicial !== undefined ? `${p.rsdInicial.toFixed(1)}%` : '—';

    ke.push({ text: `Homogeneidad (α = ${c}, método=${A})`, style: 'h2', margin: [0, 12, 0, 6] });
    ke.push({
      text: `Parámetros: RSD0=${h2} · Tol±=${l}%  ·  ResiduoAbs=${y2} g`,
      margin: [0, 0, 0, 4],
      fontSize: 8,
      color: '#555',
    });
    ke.push({
      text: 'Fórmula base (quadratic): Índice = 1 - ∏ ((M_prev² + Add²)/M_n²)^α',
      margin: [0, 0, 0, 6],
      italics: true,
      fontSize: 8,
    });

    const encab: { text: string; style: 'tableHeader' }[] = [
      'Paso',
      'Fase',
      'Mezcla antes (g)',
      'Adición (g)',
      'Mezcla después (g)',
      'Índice (%)',
      'Residual (%)',
      'RSD Est. (%)',
    ].map((t) => ({ text: t, style: 'tableHeader' as const }));

    const filasTabla: unknown[][] = [encab];
    e.forEach((C, M) => {
      const z = C.violacion ?? (C.adicion > C.mezclaAntes + 0.05 && C.ingrediente !== 'UNIFICACIÓN');
      const F = C.fase ? (C.fase === 'SUB' ? 'Sub' : C.fase === 'UNIFICACION' ? 'Unif' : 'Principal') : '';
      const valores = [
        M + 1,
        F,
        C.mezclaAntes.toFixed(2),
        C.adicion.toFixed(2),
        C.mezclaDespues.toFixed(2),
        ((C.indiceHomogeneidad ?? 0) * 100).toFixed(1),
        ((C.homogeneidadResidual ?? 0) * 100).toFixed(1),
        (C.rsdEstimado ?? 0).toFixed(1),
      ];
      const celdas = valores.map((O, idx) => ({
        text: String(O),
        alignment: idx <= 1 ? ('left' as const) : ('center' as const),
        fillColor: z ? '#ffe7e7' : undefined,
      }));
      filasTabla.push(celdas);
    });

    ke.push({
      table: {
        widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'] as const,
        body: filasTabla,
      },
      layout: 'lightHorizontalLines',
      fontSize: 9,
      margin: [0, 0, 0, 8],
    });

    if (p.advertenciaGeom) {
      ke.push({ text: p.advertenciaGeom, color: '#b00020', fontSize: 9, margin: [0, 0, 0, 8] });
    }
  }

  return {
    pageSize: 'A4',
    pageMargins: [32, 36, 32, 36],
    content: ke,
    styles: {
      h1: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
      h2: { fontSize: 12, bold: true },
      strong: { bold: true },
      tableHeader: { bold: true, fillColor: '#f2f2f2' },
    },
    defaultStyle: { fontSize: 10 },
  };
}