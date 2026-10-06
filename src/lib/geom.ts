// lib/geom.ts
// Algoritmo de dilución geométrica (NutraLab) — puro, sin React.
//
// Reglas:
//   - Ordenar ingredientes por peso ascendente.
//   - Cada adición ≈ masa acumulada (ratio 1:1 ± tolerancia).
//   - Si queda residuo, reservar y unificar al final.
//   - Si hay un ingrediente con malla ≠ 80, generar sub-mezcla acondicionada
//     con el ingrediente de mayor peso antes del plan principal.
//   - Calcular índice de homogeneidad acumulado por tres métodos (quadratic / hybrid / ratio).
//
// Reconstruido desde el bundle compilado de la versión original + nota
// 24-DILUCION-GEOMETRICA.md del vault Obsidian NutraLab.

import type {
  ComposicionFinal,
  Fase,
  HomogeneidadParams,
  PasoGeom,
  PasoOptimizado,
  PrepesadoItem,
  ResultadoVd,
  Row,
  Tanda,
  TandaGrupo,
} from '../types';

// ──────────────────────────────────────────────────────────────────────────────
// Vd: dilución geométrica básica (paso a paso textual)
// ──────────────────────────────────────────────────────────────────────────────

export interface InputVd {
  nombre: string;
  peso: number; // g (ya convertido de mg)
}

export function vd(input: InputVd[], eps = 0.01, maxPasos = 10000): ResultadoVd {
  const r = input
    .filter((v) => v.peso > 0)
    .map((v) => ({ nombre: v.nombre.trim() || 'Sin nombre', restante: +v.peso.toFixed(4) }));

  if (r.length === 0) {
    return { pasos: [], composicion: {}, reservas: [], prepesado: [], advertencia: 'Sin pesos positivos.' };
  }

  const ordenados = [...r].sort((a, b) => a.restante - b.restante);
  const pasos: PasoGeom[] = [];
  const reservas: number[] = [];
  const prepesado: PrepesadoItem[] = [];
  const composicion: ComposicionFinal = {};

  // Iniciar con el ingrediente de menor peso
  let primero = ordenados.find((v) => v.restante > 0);
  if (!primero) {
    return { pasos: [], composicion: {}, reservas: [], prepesado: [], advertencia: 'Sin pesos positivos.' };
  }

  let mezcla = +primero.restante.toFixed(4);
  composicion[primero.nombre] = (composicion[primero.nombre] ?? 0) + mezcla;
  prepesado.push({ nombre: primero.nombre, peso: +mezcla.toFixed(2) });
  pasos.push({ accion: `Iniciar con ${mezcla.toFixed(2)} g de ${primero.nombre}`, mezcla });
  primero.restante = 0;

  for (const ing of ordenados.filter((x) => x.restante > 0)) {
    let restante = +ing.restante.toFixed(4);
    const nombre = ing.nombre;

    while (restante > eps && pasos.length < maxPasos) {
      if (restante + 1e-9 >= mezcla) {
        const m = +mezcla.toFixed(4);
        prepesado.push({ nombre, peso: +m.toFixed(2) });
        pasos.push({
          accion: `Mezclar ${m.toFixed(2)} g de mezcla con ${m.toFixed(2)} g de ${nombre}`,
          mezcla: +(mezcla + m).toFixed(4),
        });
        composicion[nombre] = (composicion[nombre] ?? 0) + m;
        restante = +(restante - m).toFixed(4);
        mezcla = +(mezcla + m).toFixed(4);
      } else {
        const m = +restante.toFixed(4);
        const d = +(mezcla - m).toFixed(4);
        prepesado.push({ nombre, peso: +m.toFixed(2) });
        pasos.push({
          accion: `Tomar ${m.toFixed(2)} g de mezcla y mezclar con ${m.toFixed(2)} g de ${nombre} (reservar ${d.toFixed(2)} g de mezcla para unificar al final)`,
          mezcla: +(2 * m).toFixed(4),
        });
        reservas.push(d);
        composicion[nombre] = (composicion[nombre] ?? 0) + m;
        mezcla = +(2 * m).toFixed(4);
        restante = 0;
      }
    }
    ing.restante = restante;
  }

  // Normalizar composición a 2 decimales
  const composicionFinal: ComposicionFinal = Object.fromEntries(
    Object.entries(composicion).map(([k, v]) => [k, +v.toFixed(2)])
  );

  if (reservas.length) {
    const totalReservas = reservas.reduce((acc, v) => acc + v, 0);
    pasos.push({
      accion: `Unificar reservas por parejas de igual peso (total a unificar: ${totalReservas.toFixed(2)} g). Toma porciones iguales entre la mezcla y cada reserva hasta agotarlas.`,
      mezcla: +(mezcla + totalReservas).toFixed(4),
    });
  }

  const advertencia = pasos.length >= maxPasos ? 'Se alcanzó el máximo de pasos.' : undefined;

  return { pasos, composicion: composicionFinal, reservas, prepesado, advertencia };
}

// ──────────────────────────────────────────────────────────────────────────────
// Bd: escala + mapa de mallas + prepesado por tandas
// ──────────────────────────────────────────────────────────────────────────────

export function bd(input: Row[], produccionGramos: number) {
  const ingredientes = input
    .filter((r) => r.nombre && r.valor > 0)
    .map((r) => ({ nombre: r.nombre, gramos: r.valor / 1000 }));
  const total = ingredientes.reduce((s, r) => s + r.gramos, 0);
  if (total <= 0) return { ingredientes: [], mallasMap: {} as Record<string, string>, prepesadoTandas: [] as Tanda[] };

  const factor = produccionGramos > 0 ? produccionGramos / total : 1;
  const escalados = ingredientes.map((r) => ({
    nombre: r.nombre,
    peso: +(r.gramos * factor).toFixed(4),
  }));

  const mallasMap: Record<string, string> = {};
  input.forEach((r) => {
    if (r.nombre) mallasMap[r.nombre] = r.malla;
  });

  // prepesadoTandas — agrupa por ingrediente con sub-mezcla si hay malla ≠ 80
  const prepesadoTandas = calcularTandas(escalados, mallasMap);

  return { ingredientes: escalados, mallasMap, prepesadoTandas };
}

function calcularTandas(escalados: { nombre: string; peso: number }[], mallas: Record<string, string>): Tanda[] {
  const EPS = 0.05;
  if (escalados.length === 0) return [];

  const conMalla = escalados.map((e) => ({ ...e, malla: mallas[e.nombre] ?? '80' }));
  const diffMalla = conMalla.find((x) => x.malla !== '80');

  const asignaciones: Record<string, number[]> = {};
  const registra = (nombre: string, peso: number) => {
    const p = +peso.toFixed(2);
    if (!asignaciones[nombre]) asignaciones[nombre] = [];
    asignaciones[nombre].push(p);
  };

  const distribuir = (items: { nombre: string; peso: number }[]): number => {
    if (items.length === 0) return 0;
    const sorted = [...items].sort((a, b) => a.peso - b.peso);
    const nombres = sorted.map((s) => s.nombre);
    const pesos = sorted.map((s) => s.peso);
    let P = 0;
    const w0 = pesos[0];
    if (w0 === undefined) return 0;
    P += w0;
    pesos[0] = 0;
    registra(nombres[0]!, w0);
    if (sorted.length === 1) return P;
    let L = Math.min(P, pesos[1] ?? 0);
    const F = (pesos[1] ?? 0) - L;
    if (F > 0 && F <= EPS) L = pesos[1] ?? 0;
    pesos[1] = (pesos[1] ?? 0) - L;
    P += L;
    registra(nombres[1]!, L);
    for (let i = 1; i < pesos.length; i++) {
      while ((pesos[i] ?? 0) > 0) {
        let A = Math.min(P, pesos[i] ?? 0);
        const me = (pesos[i] ?? 0) - A;
        if (me > 0 && me <= EPS) A = pesos[i] ?? 0;
        registra(nombres[i]!, A);
        pesos[i] = (pesos[i] ?? 0) - A;
        P += A;
      }
    }
    return P;
  };

  if (diffMalla) {
    const f = diffMalla;
    const resto = conMalla.filter((x) => x.nombre !== f.nombre);
    if (resto.length) {
      const c = [...resto].sort((a, b) => b.peso - a.peso)[0];
      if (c) {
        const k = Math.min(f.peso, c.peso);
        registra(f.nombre, f.peso);
        registra(c.nombre, k);
        const P = +(c.peso - k).toFixed(2);
        const w = resto.filter((x) => x.nombre !== c.nombre).map((x) => ({ nombre: x.nombre, peso: x.peso })).filter((x) => x.peso > 0);
        let L = distribuir(w);
        let F = P;
        while (F > 1e-4) {
          let R = Math.min(L, F);
          const A = F - R;
          if (A > 0 && A <= EPS) R = F;
          registra(c.nombre, R);
          F -= R;
          L += R;
        }
      } else {
        registra(f.nombre, f.peso);
      }
    } else {
      registra(f.nombre, f.peso);
    }
  } else {
    distribuir(conMalla.map((x) => ({ nombre: x.nombre, peso: x.peso })));
  }

  const tandas: Tanda[] = [];
  for (const [nombre, pesos] of Object.entries(asignaciones)) {
    const gruposMap = new Map<number, { peso: number; cantidad: number; first: number }>();
    pesos.forEach((p, idx) => {
      const existing = gruposMap.get(p);
      if (existing) existing.cantidad += 1;
      else gruposMap.set(p, { peso: p, cantidad: 1, first: idx });
    });
    const grupos: TandaGrupo[] = Array.from(gruposMap.values())
      .sort((a, b) => a.first - b.first)
      .map((g) => ({ peso: g.peso, cantidad: g.cantidad }));
    const total = +pesos.reduce((s, p) => s + p, 0).toFixed(2);
    tandas.push({ nombre, grupos, total });
  }
  return tandas.sort((a, b) => b.total - a.total);
}

// ──────────────────────────────────────────────────────────────────────────────
// Wd: plan optimizado con sub-mezcla + tabla de homogeneidad
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// Energía de mezclado — base científica (ver vault 67-RPM-TIEMPOS-BASE-CIENTIFICA-GEOM)
//
// EQUIPO REAL: VEVOR VH-2 (V Series Mixer)
//   Motor 60 W · Barril 2 L · Volumen trabajo 1.2 L · Llenado óptimo 0.7 kg
//   Velocidad: 0-24 r/min (dato de fabricante VEVOR)
//   Diámetro equivalente barril ≈ 15.6 cm → velocidad crítica ≈ 475 RPM
//   A 24 RPM: Fr = 0.0025 << 1 → régimen de CASCADA (correcto, sin centrifugado)
//
// Velocidad: fija por GEOMETRÍA. Tiempo: por NÚMERO DE REVOLUCIONES (150 rev, fuente PK).
// ──────────────────────────────────────────────────────────────────────────────

const RPM_EQUIPO = 24;        // VEVOR VH-2: 0-24 r/min (dato de fabricante)
const REV_UNIFORMIDAD = 150;  // revoluciones para uniformidad (fuente PK Blenders)

function calcularEnergia(adicion: number, mezclaAntes: number, fase: string): { rpm: number; tiempoSeg: number; tipoMovimiento: string } {
  void adicion;
  void mezclaAntes;
  // Tiempo = revoluciones objetivo / velocidad (misma velocidad en todas las fases)
  const tiempoSeg = Math.round((REV_UNIFORMIDAD / RPM_EQUIPO) * 60);
  const tipoMovimiento = fase === 'UNIFICACION' ? 'cascada (uniformidad final)' : 'cascada (difusión)';
  return { rpm: RPM_EQUIPO, tiempoSeg, tipoMovimiento };
}

export interface ResultadoWd {
  planOptimizado: string[];
  pasosGeom: PasoOptimizado[];
  violaciones: number[]; // índices 1-based
  advertenciaGeom: string;
}

export function wd(
  ingredientes: { nombre: string; peso: number }[],
  mallasMap: Record<string, string>,
  params: HomogeneidadParams
): ResultadoWd {
  const { alphaHomog, rsdInicial, metodoHomog, ratioTol, epsMerge } = params;
  const totalPesos = ingredientes.reduce((s, i) => s + i.peso, 0);

  if (ingredientes.length === 0) {
    return { planOptimizado: [], pasosGeom: [], violaciones: [], advertenciaGeom: '' };
  }

  const conMalla = ingredientes.map((i) => ({ ...i, malla: mallasMap[i.nombre] ?? '80' }));

  // 1) Detectar malla modal (la más frecuente) y la "diferente"
  const counts: Record<string, number> = {};
  conMalla.forEach((i) => {
    counts[i.malla] = (counts[i.malla] ?? 0) + 1;
  });
  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const mallaModal = sortedEntries[0]?.[0] ?? '80';
  const sub = conMalla.find((i) => i.malla !== mallaModal);
  const principal = [...conMalla].sort((a, b) => b.peso - a.peso)[0];

  const plan: PasoOptimizado[] = [];
  let mezclaPrincipal = 0;
  let subTotal = 0;
  let precorteTotal = 0;

  const tol = epsMerge;
  const pushPaso = (desc: string, ad: number, antes: number, ing: string, viol: boolean, energia?: { rpm?: number; tiempoSeg?: number; tipoMovimiento?: string }): void => {
    plan.push({
      descripcion: desc,
      adicion: ad,
      mezclaAntes: antes,
      mezclaDespues: antes + ad,
      ingrediente: ing,
      fase: 'PRINCIPAL',
      violacion: viol,
      energia,
    });
  };

  // 1.5) METODOLOGÍA DEFINITIVA: orden ASCENDENTE + dilución geométrica 1:1
  //    (ver vault: 52-METODOLOGIA-MEZCLADO-GEOM)
  //    - Menor masa (piperina, traza) inicia el mortero → evita segregación.
  //    - Cada paso añade masa ≤ masa presente (ratio 0.85–1.15).
  //    - MCT (vehículo, mayor masa) entra al final.
  //    - Jengibre trabaja solo (TRPV1 periférico), sin precorte.
  //    Resultado: RSD <2% en V1/V4/V5, cierra exacto en total fórmula.
  const principales = [...ingredientes].sort((a, b) => a.peso - b.peso);

  // MCT usado en precorte (ya no aplica: sin precorte especial)
  const mctUsadoPrecorte = 0;

  {
    const agregar = (nombre: string, peso: number): void => {
      let restante = peso;
      if (mezclaPrincipal === 0) {
        pushPaso(
          `Inicio: Coloca ${restante.toFixed(2)} g de ${nombre}. Mezcla.`,
          restante,
          0,
          nombre,
          false,
          calcularEnergia(restante, 0, 'PRINCIPAL')
        );
        mezclaPrincipal += restante;
        return;
      }
      while (restante > 1e-6) {
        let z = Math.min(restante, mezclaPrincipal);
        const j = restante - z;
        if (j > 0 && j <= tol) z = restante;
        if (z - mezclaPrincipal > 1e-9) z = mezclaPrincipal;
        const ratio = mezclaPrincipal > 0 ? z / mezclaPrincipal : 1;
        const viol = mezclaPrincipal > 0 && (ratio < 1 - ratioTol || ratio > 1 + ratioTol);
        pushPaso(
          `Añade ${z.toFixed(2)} g de ${nombre}${viol ? ' (ajuste fuera 1:1)' : ''}. Mezcla.\nMezcla Acumulada (principal): ${(mezclaPrincipal + z).toFixed(2)} g`,
          z,
          mezclaPrincipal,
          nombre,
          viol,
          calcularEnergia(z, mezclaPrincipal, 'PRINCIPAL')
        );
        mezclaPrincipal += z;
        restante = +(restante - z).toFixed(4);
      }
    };

    principales.forEach((p) => agregar(p.nombre, p.peso));
  }

  // 2) Sub-mezcla por malla (si hay ingredientes de malla distinta): se integra en el
  //    flujo ascendente 1:1 ya ejecutado. Sin bloque separado.
  //    (metodología unificada: ver 52-METODOLOGIA-MEZCLADO-GEOM)

  // 3) Ingredientes principales del lote base — YA PROCESADOS en 1.5 (orden ascendente).
  //    No se requiere sub-mezcla ni precorte especial: la metodología 1:1 los cubre.

  // Verificación de cierre: mezcla principal = total fórmula
  const totalPlan = mezclaPrincipal + subTotal + precorteTotal;
  if (Math.abs(totalPlan - totalPesos) > 0.5) {
    console.warn(`[wd] Plan no cierra: ${totalPlan.toFixed(2)} g vs fórmula ${totalPesos.toFixed(2)} g`);
  }

  // 5) Unificación final
  const unificarTotal = subTotal + precorteTotal;
  if (unificarTotal > 0) {
    const partes: string[] = [];
    if (subTotal > 0) partes.push(`sub‑mezcla acondicionada (${subTotal.toFixed(2)} g)`);
    if (precorteTotal > 0) partes.push(`precorte (${precorteTotal.toFixed(2)} g)`);
    plan.push({
      descripcion: `Unificación final: Combina mezcla principal (${mezclaPrincipal.toFixed(2)} g) con ${partes.join(' + ')}. Mezcla hasta homogeneizar.\nMezcla Total: ${(mezclaPrincipal + unificarTotal).toFixed(2)} g`,
      adicion: unificarTotal,
      mezclaAntes: mezclaPrincipal,
      mezclaDespues: mezclaPrincipal + unificarTotal,
      ingrediente: 'UNIFICACIÓN',
      fase: 'UNIFICACION',
      energia: { rpm: 300, tiempoSeg: 120, tipoMovimiento: 'circular suave' },
    });
  }

  // 6) Calcular homogeneidad por paso
  let R = 1;
  const violaciones: number[] = [];
  const pasosGeom: PasoOptimizado[] = plan.map((p, idx) => {
    let lt = 1;
    if (p.mezclaAntes > 0 && p.ingrediente !== 'UNIFICACIÓN') {
      const H = p.mezclaAntes;
      const Ae = p.adicion;
      const xe = p.mezclaDespues;
      if (metodoHomog === 'quadratic') {
        lt = Math.pow((H * H + Ae * Ae) / (xe * xe), alphaHomog);
      } else if (metodoHomog === 'hybrid') {
        const Ge = H / xe;
        const At = Ae / xe;
        lt = Math.pow(Ge, alphaHomog * At);
      } else {
        lt = Math.pow(H / xe, alphaHomog);
      }
      R *= lt;
    }
    const indice = 1 - R;
    const violCalc = !!p.violacion;
    if (violCalc) violaciones.push(idx + 1);
    const rsdEst = Math.max(0, Math.sqrt(Math.max(R, 0)) * rsdInicial);
    return {
      ...p,
      homogeneidadResidual: R,
      indiceHomogeneidad: indice,
      rsdEstimado: rsdEst,
      violacion: violCalc,
      energia: p.energia ?? { rpm: 200, tiempoSeg: 60, tipoMovimiento: 'circular moderado' },
    };
  });

  const advertenciaGeom = pasosGeom.length && violaciones.length
    ? `Advertencia: ${violaciones.length} paso(s) fuera de tolerancia geométrica (~1:1): ${violaciones.join(', ')}`
    : '';

  const planOptimizado = pasosGeom.map((p) => {
    const txt = `${p.descripcion} (Índice homogeneidad: ${((p.indiceHomogeneidad ?? 0) * 100).toFixed(1)}% · RSD≈${(p.rsdEstimado ?? 0).toFixed(1)}%)`;
    return txt;
  });

  return { planOptimizado, pasosGeom, violaciones, advertenciaGeom };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de exportación
// ──────────────────────────────────────────────────────────────────────────────

export function nombreFase(f: Fase | undefined): string {
  if (f === 'SUB') return 'Sub';
  if (f === 'UNIFICACION') return 'Unif';
  return 'Pri';
}