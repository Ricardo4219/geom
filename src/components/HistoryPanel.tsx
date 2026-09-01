// components/HistoryPanel.tsx
// Panel lateral/modal que muestra el historial de mezclas guardadas.
// Permite cargar, eliminar y exportar/importar.

import { useState, useRef } from 'react';
import type { MezclaHistorial } from '../types';

interface Props {
  mezclas: MezclaHistorial[];
  onCargar: (id: string) => void;
  onEliminar: (id: string) => void;
  onEliminarTodo: () => void;
  onExportar: () => string;
  onImportar: (json: string, opts?: { merge?: boolean }) => number;
  onCerrar: () => void;
  storage: { count: number; bytes: number; percentUsed: number };
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function HistoryPanel({
  mezclas, onCargar, onEliminar, onEliminarTodo, onExportar, onImportar, onCerrar, storage,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const n = onImportar(text, { merge: true });
      setImportStatus(n > 0 ? { ok: true, msg: `Importadas ${n} mezcla(s)` } : { ok: false, msg: 'No se importó ninguna mezcla nueva' });
      // Limpiar el input para permitir re-importar el mismo archivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => setImportStatus({ ok: false, msg: 'Error leyendo archivo' });
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Historial de Mezclas</h2>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar historial">×</button>
        </div>

        <div className="modal-toolbar">
          <button
            className="button secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Importar historial desde archivo JSON"
          >
            Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportarArchivo}
            style={{ display: 'none' }}
          />
          <button
            className="button secondary"
            onClick={() => {
              const json = onExportar();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nutralab-geom-historial-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={mezclas.length === 0}
            title="Descargar historial completo como JSON"
          >
            Exportar JSON
          </button>
          {mezclas.length > 0 && (
            <button
              className="button secondary"
              onClick={() => setConfirmDeleteAll(true)}
              style={{ color: 'var(--brand)' }}
              title="Borrar todo el historial"
            >
              Borrar todo
            </button>
          )}
        </div>

        {importStatus && (
          <div className={importStatus.ok ? 'info-ok' : 'info-err'}>
            {importStatus.msg}
            <button className="icon-btn" onClick={() => setImportStatus(null)} style={{ float: 'right' }}>×</button>
          </div>
        )}

        <div className="modal-storage">
          <span>{mezclas.length} mezcla{mezclas.length !== 1 ? 's' : ''} guardada{mezclas.length !== 1 ? 's' : ''}</span>
          <span> · {formatBytes(storage.bytes)} / 5 MB ({storage.percentUsed.toFixed(1)}%)</span>
        </div>

        {mezclas.length === 0 ? (
          <div className="empty-state">
            <p>No hay mezclas guardadas todavía.</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              Configura tu fórmula y pulsa <strong>"Guardar mezcla"</strong> en la app principal para empezar.
            </p>
          </div>
        ) : (
          <ul className="history-list">
            {mezclas.map((m) => (
              <li key={m.id} className="history-item">
                <div className="history-item-header">
                  <strong>{m.nombre || '(sin nombre)'}</strong>
                  <span className="history-fecha">{formatFecha(m.fechaGuardado)}</span>
                </div>
                <div className="history-item-meta">
                  <span>{m.items.length} ingredientes</span>
                  <span> · {m.total.toFixed(2)} g total</span>
                  <span> · RSD est. {(m.rsdFinalEstimado ?? 0).toFixed(1)}%</span>
                  <span> · Índice {((m.indiceHomogeneidadFinal ?? 0) * 100).toFixed(1)}%</span>
                  {m.violacionesCount > 0 && (
                    <span style={{ color: 'var(--brand)' }}>
                      {' '}· ⚠ {m.violacionesCount} violación{m.violacionesCount !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
                {m.config.lote && (
                  <div className="history-item-meta">
                    <span>Lote: {m.config.lote}</span>
                    {m.config.responsable && <span> · {m.config.responsable}</span>}
                    {m.config.fecha && <span> · {m.config.fecha}</span>}
                  </div>
                )}
                {m.notas && (
                  <div className="history-item-notas">"{m.notas}"</div>
                )}
                <div className="history-item-actions">
                  <button className="button" onClick={() => onCargar(m.id)}>Cargar</button>
                  {confirmDeleteId === m.id ? (
                    <>
                      <button className="button" style={{ background: '#dc2626' }} onClick={() => { onEliminar(m.id); setConfirmDeleteId(null); }}>
                        Confirmar
                      </button>
                      <button className="button secondary" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                    </>
                  ) : (
                    <button className="button secondary" onClick={() => setConfirmDeleteId(m.id)}>Eliminar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {confirmDeleteAll && (
          <div className="modal-confirm">
            <p>¿Borrar <strong>todas</strong> las {mezclas.length} mezclas del historial? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="button" style={{ background: '#dc2626' }} onClick={() => { onEliminarTodo(); setConfirmDeleteAll(false); }}>
                Sí, borrar todo
              </button>
              <button className="button secondary" onClick={() => setConfirmDeleteAll(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}