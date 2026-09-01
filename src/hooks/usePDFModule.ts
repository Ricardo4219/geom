// hooks/usePDFModule.ts
import { useRef, useEffect } from 'react';

interface PDFModule {
  exportarPlanPDF: (params: unknown) => Promise<boolean>;
}

export function usePDFModule() {
  const ref = useRef<PDFModule | null>(null);

  useEffect(() => {
    const cargar = () => {
      if (ref.current) return;
      import('../lib/pdf')
        .then((m) => {
          ref.current = m as unknown as PDFModule;
        })
        .catch(() => {
          /* silencio: fallo se reporta al usuario al exportar */
        });
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (typeof ric === 'function') ric(cargar);
    else setTimeout(cargar, 300);
  }, []);

  return {
    ensureLoaded: async (): Promise<PDFModule> => {
      if (!ref.current) {
        const m = await import('../lib/pdf');
        ref.current = m as unknown as PDFModule;
      }
      return ref.current;
    },
    preloadOnHover: () => {
      if (!ref.current) import('../lib/pdf').then((m) => (ref.current = m as unknown as PDFModule));
    },
  };
}