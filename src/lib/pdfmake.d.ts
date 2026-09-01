// Declaraciones de tipo para pdfmake (no tiene @types oficial estable)
declare module 'pdfmake/build/pdfmake' {
  interface ContentTableLayouts {
    [key: string]: unknown;
  }
  interface DocDefinition {
    content?: unknown[];
    styles?: Record<string, unknown>;
    defaultStyle?: Record<string, unknown>;
    pageSize?: string;
    pageMargins?: [number, number, number, number];
    [key: string]: unknown;
  }
  interface PdfMake {
    vfs: Record<string, string>;
    createPdf(docDefinition: DocDefinition): {
      getBlob(cb: (blob: Blob) => void): void;
      download(filename?: string): void;
      open(): void;
    };
  }
  const pdfMake: PdfMake;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfsFonts: { pdfMake?: { vfs?: Record<string, string> }; vfs?: Record<string, string> };
  export default vfsFonts;
}