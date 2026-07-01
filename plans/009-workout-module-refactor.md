# Plan 009: Refactor Workout Monolith Page (`page.tsx`) into Components

**Commit**: `HEAD`

## 1. Problem Statement
The main `workout/page.tsx` file has grown beyond 800 lines. It handles everything: fetching data from 5 different endpoints, maintaining complex states (`homeCounters`, `activeModal`, `graphData`), managing modals, animating Framer Motion reordering, and rendering complex sub-charts (Recharts `ScatterChart`, `BodyHeatmap`). This monolithic structure harms readability, makes localized re-renders impossible, and increases merge conflicts.

## 2. Goals
- Extract distinct UI sections into standalone functional components under a new `frontend/src/app/workout/components/` directory.
- Keep the state management centered in `page.tsx` for now, passing props down to the child components.

## 3. Scope
- `frontend/src/app/workout/page.tsx` (modifying)
- `frontend/src/app/workout/components/IntensityGraph.tsx` (new)
- `frontend/src/app/workout/components/ProtocolSection.tsx` (new)

## 4. Execution Steps
1. **Extract IntensityGraph Component**:
   - Create `IntensityGraph.tsx`.
   - Move the Recharts `ScatterChart` and `ResponsiveContainer` block into this file.
   - Accept `graphData: any[]` as a prop.
2. **Extract ProtocolSection Component**:
   - Create `ProtocolSection.tsx`.
   - Move the `Reorder.Group`, `ProtocolCard`, and `handleAddProtocol` form into this file.
   - Accept props: `protocolOrder`, `homeCounters`, `onReorder`, `onIncrement`, `onDecrement`, `onAddProtocol`, `onLongPress`.
3. **Refactor `page.tsx`**:
   - Import the newly created components.
   - Replace the large inline JSX blocks with `<IntensityGraph graphData={graphData} />` and `<ProtocolSection ... />`.
4. **Verify**:
   - Run `npm run build` in the `frontend` directory. Ensure there are no TypeScript or missing variable errors.
   - Run `npm run dev` and ensure the drag-and-drop protocols and intensity graph still render correctly.

## 5. Layman's Explanation
Right now, the entire dashboard is stuffed into one massive file, like having your kitchen, living room, and bedroom all cramped into a single room without walls. This refactoring builds walls to separate the sections—giving the graph its own room and the protocols their own room—so it's much easier to clean and manage each one separately without breaking the whole house.
