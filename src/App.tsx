// App.tsx — orquestador (~200 líneas, patrón refactor del original)
import { useMemo, useState, useCallback } from 'react';
import {
  ConfigurationPanel,
  IngredientTable,
  MixingPlanDisplay,
} from './components';
import {
  useIngredients,
  useConfiguration,
  useHomogeneityParams,
  useGeometricCalculations,
  useOptimizedPlan,
  usePDFModule,
} from './hooks';
import { exportarTxt, exportarCSV, copy } from './utils';
import { vd } from './lib/geom';

export default function App() {
  // ── Estado principal
  const { items, onNombreChange, onValorChange, onMallaChange, onRemove, onAdd, cargarEjemplo } = useIngredients();
  const { config, onConfigChange } = useConfiguration();
  const { params, onParamChange } = useHomogeneityParams();
  const pdfModule = usePDFModule();

  // ── Cálculos (memoizados)
  const { ingredientes, mallasMap, prepesadoTandas } = useGeometricCalculations(items, config.produccionGramos);
  const { planOptimizado, pasosGeom, violaciones, advertenciaGeom } = useOptimizedPlan(
    ingredientes,
    mallasMap,
    params
  );

  const totalObjetivo = useMemo(
    () => ingredientes.reduce((s, i) => s + i.peso, 0),
    [ingredientes]
  );

  const perCapsula = useMemo(
    () => items.reduce((s, r) => s + r.valor, 0),
    [items]
  );
  const factor = useMemo(() => {
    const base = ingredientes.reduce((s, i) => s + i.peso, 0);
    return base > 0 ? totalObjetivo / base : 1;
  }, [ingredientes, totalObjetivo]);
  const numCapsulas = config.produccionGramos > 0 && factor > 0 ? Math.floor(config.produccionGramos / totalObjetivo * 1000) : 0;
  void numCapsulas;
  const desviacion = config.objetivoCapsulaMg > 0 && perCapsula > 0 ? +(perCapsula - config.objetivoCapsulaMg).toFixed(2) : 0;

  // ── Pasos textuales (Vd)
  const pasos = useMemo(() => {
    if (ingredientes.length === 0) return [];
    return vd(ingredientes.map((i) => ({ nombre: i.nombre, peso: i.peso }))).pasos;
  }, [ingredientes]);

  const reservasTotal = useMemo(() => {
    return vd(ingredientes.map((i) => ({ nombre: i.nombre, peso: i.peso }))).reservas.reduce((s, v) => s + v, 0);
  }, [ingredientes]);

  // ── Exportaciones
  const [generando, setGenerando] = useState(false);

  const onExportTXT = useCallback(() => {
    exportarTxt({
      formula: config.formulaNombre,
      lote: config.lote,
      caducidad: config.caducidad,
      responsable: config.responsable,
      fecha: config.fecha,
      total: totalObjetivo,
      ingredientes,
      pasos,
      reservasTotal,
      pasosGeom,
      planOptimizado,
      params,
      advertenciaGeom,
    });
  }, [config, totalObjetivo, ingredientes, pasos, reservasTotal, pasosGeom, planOptimizado, params, advertenciaGeom]);

  const onExportCSV = useCallback(() => exportarCSV(pasosGeom), [pasosGeom]);

  const onExportPDF = useCallback(async () => {
    try {
      setGenerando(true);
      const mod = await pdfModule.ensureLoaded();
      const ok = await mod.exportarPlanPDF({
        total: totalObjetivo,
        ingredientes,
        pasos,
        reservasTotal,
        prepesadoTandas,
        mallas: mallasMap,
        formula: config.formulaNombre || undefined,
        lote: config.lote || undefined,
        caducidad: config.caducidad || undefined,
        responsable: config.responsable || undefined,
        fecha: config.fecha || undefined,
        pasosGeom,
        alphaHomog: params.alphaHomog,
        advertenciaGeom: advertenciaGeom || undefined,
        planOptimizado,
        metodoHomog: params.metodoHomog,
        ratioTol: params.ratioTol,
        mergeThreshold: params.mergeThreshold,
        epsMerge: params.epsMerge,
        rsdInicial: params.rsdInicial,
      });
      if (!ok) {
        alert('No se pudo iniciar la descarga del PDF. Permite ventanas emergentes (popups) y descargas automáticas para este sitio y vuelve a intentar.');
      }
    } catch (e) {
      console.error(e);
      alert('No se pudo generar el PDF. Revisa si el navegador bloqueó las descargas o los popups y vuelve a intentar.');
    } finally {
      setGenerando(false);
    }
  }, [pdfModule, totalObjetivo, ingredientes, pasos, reservasTotal, prepesadoTandas, mallasMap, config, pasosGeom, params, advertenciaGeom, planOptimizado]);

  const onCopiarEnlace = useCallback(async () => {
    const ok = await copy(window.location.href);
    if (ok) alert('Enlace copiado al portapapeles.');
  }, []);

  const onCargarEjemplo = useCallback(() => {
    cargarEjemplo();
  }, [cargarEjemplo]);

  // ── Render
  return (
    <div className="container">
      <header>
        <div>
          <h1>NutraLab</h1>
          <p>Mezcla siempre dos porciones de igual peso para lograr homogeneidad.</p>
        </div>
        <div className="toolbar">
          <button className="button secondary" onClick={onCargarEjemplo}>Cargar ejemplo</button>
          <button className="button" onClick={onExportTXT}>Exportar TXT</button>
          <button
            className="button"
            onMouseEnter={pdfModule.preloadOnHover}
            onTouchStart={pdfModule.preloadOnHover}
            onClick={onExportPDF}
            disabled={generando}
          >
            {generando ? 'Generando PDF…' : 'Exportar PDF'}
          </button>
        </div>
      </header>

      <div className="grid">
        <section className="panel scroll">
          <ConfigurationPanel config={config} onConfigChange={onConfigChange} />
          <IngredientTable
            items={items}
            onNombreChange={onNombreChange}
            onValorChange={onValorChange}
            onMallaChange={onMallaChange}
            onRemove={onRemove}
            onAdd={onAdd}
          />
          <div className="toolbar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span>Contenido escalado: {perCapsula.toFixed(2)} mg ({totalObjetivo.toFixed(3)} g)</span>
                <small style={{ opacity: 0.8 }}>
                  Per cápsula (base): {perCapsula.toFixed(2)} mg · Factor: {factor.toFixed(3)}
                  {numCapsulas > 0 ? ` · ≈ ${numCapsulas} cápsulas` : ''}
                </small>
                <small style={{ opacity: 0.8 }}>
                  Cápsula vacía: {config.pesoCapsulaMg} mg · Total unidad objetivo: {config.objetivoCapsulaMg} mg
                  {config.objetivoCapsulaMg > 0 && Math.abs(desviacion) > 0
                    ? ` (desv: ${desviacion > 0 ? '+' : ''}${desviacion} mg)`
                    : ''}
                </small>
              </div>
              <input
                className="input"
                placeholder="Nombre de la fórmula"
                value={config.formulaNombre}
                onChange={(e) => onConfigChange('formulaNombre', e.target.value)}
                title="Nombre de la fórmula"
                style={{ minWidth: 220 }}
              />
            </div>
            <button className="button secondary" onClick={onCopiarEnlace}>Copiar enlace</button>
          </div>
        </section>

        <MixingPlanDisplay
          totalObjetivo={totalObjetivo}
          planOptimizado={planOptimizado}
          pasosGeom={pasosGeom}
          violaciones={violaciones}
          advertencia={pasos.length === 0 && ingredientes.length > 0 ? 'Completa los datos para ver el plan.' : undefined}
          advertenciaGeom={advertenciaGeom}
          homogeneidadParams={params}
          onHomogeneidadParamChange={onParamChange}
          onExportCSV={onExportCSV}
        />
      </div>

      <footer>
        <small>© {new Date().getFullYear()} NutraLab</small>
      </footer>
    </div>
  );
}