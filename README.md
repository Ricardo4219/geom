# NutraLab-Geom — Dilución Geométrica

App web para planificar mezclas perfectas mediante ** dilución geométrica** (siempre dos porciones de igual peso) en encapsulado NutraLab.

Pensada para operadores de planta + QC + cumplimiento BPM. Genera un plan de mezclado 1:1 ± tolerancia que minimiza segregación y maximiza uniformidad de contenido (RSD <5%).

## 🚀 Quick start

```bash
npm install --legacy-peer-deps
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve el bundle compilado
```

## 🏗️ Stack

- **React** 18.3.1 + **TypeScript** 5.9 (strict + noUncheckedIndexedAccess)
- **Vite** 5.4 (build con manualChunks: pdfmake como bundle lazy)
- **pdfmake** 0.2 (generación de PDF 100% client-side)
- **CSS** puro con 9 custom properties (tema oscuro)

## 📦 Estructura

```
src/
├── main.tsx                     → entry point
├── App.tsx                      → orquestador (~200 líneas)
├── styles.css                   → 9 custom props + dark glass
├── types/index.ts               → tipos compartidos
├── lib/
│   ├── geom.ts                  → algoritmos vd/bd/wd (puros, sin React)
│   └── pdf.ts                   → exportarPlanPDF (lazy, pdfmake)
├── utils/
│   ├── clipboard.ts             → copy()
│   ├── formatters.ts            → formatWeight, formatMg, formatPercentage
│   └── exporters.ts             → exportarTxt + exportarCSV
├── hooks/
│   ├── useIngredients.ts
│   ├── useConfiguration.ts
│   ├── useHomogeneityParams.ts
│   ├── useGeometricCalculations.ts
│   ├── useOptimizedPlan.ts
│   └── usePDFModule.ts          → lazy import con prefetch on hover/touch
└── components/
    ├── Sparkline.tsx            → SVG 520×40 (polyline azul)
    ├── IngredientTable.tsx
    ├── ConfigurationPanel.tsx
    ├── HomogeneityControls.tsx
    ├── HomogeneityTable.tsx
    └── MixingPlanDisplay.tsx
```

## 🔐 Seguridad — Firebase y credenciales

⚠️ **Lee esto antes de tocar configuración.**

### ¿Firebase es necesario?

**No.** NutraLab-Geom es 100% client-side:
- Los cálculos del algoritmo `vd/bd/wd` corren en el navegador (`lib/geom.ts`).
- Las exportaciones (TXT, CSV, PDF) se generan localmente sin backend.
- La persistencia entre recargas es opcional (botón "Copiar enlace" guarda estado en URL).

Firebase se usa **únicamente como hosting estático** para servir `dist/` con CDN. No requiere vars de runtime en el bundle.

### Variables de entorno

- **NO commitear** archivos `.env` ni `.env.production`. Solo `.env.example` va al repo.
- El `.gitignore` ya protege `.env*` (excepto `.env.example`).
- Para deploy con CI/CD, las credenciales van a **GitHub Secrets**, nunca al código.

### Si en el futuro agregas Firebase real (Auth, Firestore, Storage):

1. Copia `.env.example` a `.env` y llena los valores desde Firebase Console.
2. Agrega las vars `VITE_FIREBASE_*` a `vite-env.d.ts` para tipado TS.
3. Sincronízalas con GitHub Secrets para el build de prod (ver skill `newapp`).
4. **Rota el apiKey** si lo commiteaste por error (Firebase Console → Project Settings → General → regenerar).

## 🚢 Deploy

### Opción A: Firebase Hosting (recomendado para producción)

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # vincula el proyecto Firebase
npm run build              # genera dist/
firebase deploy --only hosting
```

### Opción B: Hosting estático genérico (Netlify, Vercel, GitHub Pages)

El contenido de `dist/` después de `npm run build` es estático y compatible con cualquier hosting SPA.

### Opción C: CI/CD automático con GitHub Actions

Pendiente configurar `.github/workflows/deploy.yml`. La plantilla típica dispara en `push` a `master`:
- `npm ci --legacy-peer-deps`
- `npm run build`
- `firebase deploy --only hosting --token "$FIREBASE_TOKEN"`

## 📝 Notas de desarrollo

- **No usa Tailwind** ni PostCSS. Todo el diseño es CSS puro con custom properties.
- **No persiste estado** entre recargas. Si lo necesitas, el botón "Copiar enlace" copia la URL actual (futuro: serializar estado en query string).
- **pdfmake es lazy**: solo se descarga cuando el usuario hace hover/touch en "Exportar PDF" o lo pulsa por primera vez.

## 📄 Licencia

Privado / NutraLab interno.