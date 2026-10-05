// Tipos compartidos de NutraLab-Geom (dilución geométrica)

export type Malla = '40' | '80' | '100' | '200';

export interface Row {
  id: string;
  nombre: string;
  valor: number;   // mg
  malla: '40' | '80' | '100' | '200';
}

export interface ConfiguracionState {
  pesoCapsulaMg: number;
  objetivoCapsulaMg: number;
  produccionGramos: number;
  lote: string;
  caducidad: string;
  responsable: string;
  fecha: string;
  formulaNombre: string;
}

export type MetodoHomog = 'quadratic' | 'hybrid' | 'ratio';

export interface HomogeneidadParams {
  alphaHomog: number;        // 0.2–2.0
  rsdInicial: number;          // %
  metodoHomog: MetodoHomog;
  ratioTol: number;           // 0–1 (tolerancia ±1:1)
  epsMerge: number;           // 0–1 (g)
  objetivoRSD?: number;       // % — RSD objetivo para convergencia (default 5)
  precorteEnabled?: boolean;  // habilitar precorte para ingredientes > umbral
  precorteUmbral?: number;    // % del total para activar precorte (default 20)
}

// Tipos del algoritmo geom.ts

export interface PasoGeom {
  accion: string;
  mezcla: number;
}

export interface ComposicionFinal {
  [nombre: string]: number; // g
}

export interface PrepesadoItem {
  nombre: string;
  peso: number;
}

export interface ResultadoVd {
  pasos: PasoGeom[];
  composicion: ComposicionFinal;
  reservas: number[];
  prepesado: PrepesadoItem[];
  advertencia?: string;
}

export interface TandaGrupo {
  peso: number;
  cantidad: number;
}

export interface Tanda {
  nombre: string;
  grupos: TandaGrupo[];
  total: number;
}

// Tipos del plan optimizado (Wd)

export type Fase = 'SUB' | 'PRINCIPAL' | 'UNIFICACION';

export interface PasoOptimizado {
  descripcion: string;
  adicion: number;
  mezclaAntes: number;
  mezclaDespues: number;
  ingrediente: string;
  fase: Fase;
  violacion?: boolean;
  homogeneidadResidual?: number;  // R acumulado
  indiceHomogeneidad?: number;    // 1 - R
  rsdEstimado?: number;          // %
  energia?: { rpm?: number; tiempoSeg?: number; tipoMovimiento?: string }; // instrucciones de mezclado
}

// Tipos del historial de mezclas (persistido en localStorage)

export interface MezclaHistorial {
  id: string;
  fechaGuardado: string;          // ISO timestamp
  nombre: string;                 // ej "Fucoxina 0826"
  config: ConfiguracionState;     // snapshot completo
  items: Row[];                   // ingredientes con sus valores y mallas
  params: HomogeneidadParams;     // alphaHomog, metodoHomog, etc.
  total: number;                  // g de la fórmula completa
  rsdFinalEstimado: number;       // % de la última corrida calculada
  indiceHomogeneidadFinal: number; // 0-1
  violacionesCount: number;       // número de pasos fuera de ratio
  notas?: string;                 // comentarios libres del operador
}

// Parámetros del PDF
export interface PDFParams {
  total: number;
  ingredientes: { nombre: string; peso: number }[];
  pasos: PasoGeom[];
  reservasTotal: number;
  prepesadoTandas: Tanda[];
  mallas: Record<string, string>;
  formula?: string;
  lote?: string;
  caducidad?: string;
  responsable?: string;
  fecha?: string;
  pasosGeom: PasoOptimizado[];
  alphaHomog: number;
  advertenciaGeom?: string;
  planOptimizado: string[];
  metodoHomog: MetodoHomog;
  ratioTol: number;
  epsMerge: number;
  rsdInicial: number;
}