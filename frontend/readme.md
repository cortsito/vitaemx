# frontend/

React + TypeScript (Vite). Deliberately plain: global styles only (`src/index.css`), no component library, no routing library (hash navigation in `App.tsx`), one inline SVG chart.

```bash
npm install
npm run dev            # http://127.0.0.1:5173, proxies /api to the backend on :8000
npm run lint
npm run format
npm run build          # tsc + vite → dist/
```

`src/api/client.ts` is the only module that calls `fetch`; `src/api/types.ts` mirrors `backend/app/schemas.py`. One component per view in `src/components/`.
