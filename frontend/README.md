# Virtual Mind 2.0 Frontend

This is the Next.js 14 App Router frontend for the Virtual Mind 2.0 system.
It utilizes Tailwind CSS (v4) for the strict design system, and React Three Fiber to render the immersive 3D command center visuals.

## How to Run

Because `npm install` inside terminal sandboxes failed previously due to strict filesystem restrictions on this machine, you must run it yourself **outside the AI sandbox**:

1. Open your native Mac terminal.
2. Navigate to the frontend directory: `cd /Users/krdeeksha/Virtual-mind/frontend`
3. Install all dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

- **`src/app/`**: Next.js App Router definitions.
- **`src/components/`**: React Three Fiber canvases and raw 3D logic.
- **`src/components/ui/`**: Reusable Next.js React elements mapped to the design system.
- **`src/app/globals.css`**: Tailwind v4 styling constraints including Virtual Mind specific colors (gold, obsidian, vm-red) and custom fonts (Cinzel, Share Tech Mono).

## Backend Integration
Ensure your Python FastAPI backend is running via `uvicorn api.main:app --reload --port 8000` to serve the API definitions defined in `NEXT_PUBLIC_API_URL`.
