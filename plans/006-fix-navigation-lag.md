# Plan 006: Fix Next.js App Router Navigation Lag on Home Dashboard

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a2d1656..HEAD -- frontend/src/app/home/page.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf, dx
- **Planned at**: commit `a2d1656`, 2026-06-21

## Why this matters

Currently, when the user clicks the "ENTER <PILLAR>" buttons on the Home dashboard cards, there is a significant perceived lag before the target internal page loads. This happens because Next.js App Router fetches the RSC (React Server Component) payload and blocks the client-side navigation transition until the target page is fully ready. Without any instant visual feedback (like a loading spinner or "Entering..." state) on the button, it feels to the user like their click didn't register or the app froze. Fixing this improves the UI responsiveness immensely.

## Layman's Explanation

Think of Next.js navigation like waiting for an elevator. When you press the "call elevator" button, if the button's light doesn't instantly turn on, you assume it's broken and keep pressing it, even though the elevator is already on its way down. By adding an immediate visual "LOADING" state, we turn the light on instantly, giving the user confidence that the system heard their request and is actively processing it. 

## Current state

- The relevant file:
  - `frontend/src/app/home/page.tsx` — This file renders the horizontal swipe cards (the "Pillars") and the navigation buttons.

Current button rendering inside the map loop (around line 140):
```javascript
                <Link
                  href={p.route}
                  prefetch={true}
                  className="w-full rounded-2xl flex items-center justify-center px-6 py-5 active:scale-[0.98] transition-all duration-200 border bg-white/5"
                  style={{ borderColor: p.color }}
                >
                  <span className="text-[12px] font-bold tracking-[0.2em] text-white uppercase">
                    ENTER {p.label}
                  </span>
                </Link>
```

The repo uses React and TailwindCSS.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install` (in `frontend/`) | exit 0              |
| Lint      | `npm run lint` (in `frontend/`) | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `frontend/src/app/home/page.tsx`

**Out of scope** (do NOT touch):
- `frontend/src/app/page.tsx` (the root welcome screen)
- The target inner pages (e.g. `/folder/deen/page.tsx`)

## Git workflow

- Branch: `advisor/006-fix-navigation-lag`
- Commit per step or per logical unit; message style: `fix(home): add instant visual feedback to navigation buttons`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a local state for the navigating route

In `frontend/src/app/home/page.tsx`, within the `DashboardSwipeInner` component, add a new state `isNavigatingTo` to track which route is currently loading.

```javascript
  const [isNavigatingTo, setIsNavigatingTo] = useState<string | null>(null);
```

**Verify**: `cd frontend && npm run lint` → passes

### Step 2: Update the `Link` button to use an `onClick` handler

Modify the `<Link>` element for the "ENTER {p.label}" button inside the `sortedPillars.map`.
When clicked, set `isNavigatingTo` to `p.route`. Since `<Link>` still handles the actual push asynchronously, the state will persist while Next.js does its background loading, allowing us to show a spinner or loading text.

```javascript
                <Link
                  href={p.route}
                  prefetch={true}
                  onClick={() => setIsNavigatingTo(p.route)}
                  className="w-full rounded-2xl flex items-center justify-center px-6 py-5 active:scale-[0.98] transition-all duration-200 border bg-white/5"
                  style={{ borderColor: p.color }}
                >
                  <span className="text-[12px] font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2">
                    {isNavigatingTo === p.route ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ENTERING...
                      </>
                    ) : (
                      `ENTER ${p.label}`
                    )}
                  </span>
                </Link>
```

*Note: Ensure to import the SVGs or just use the inline SVG above.*

**Verify**: `cd frontend && npm run lint` → exits 0.

## Test plan

- Manual Verification: Open the app on the `/home` page and click any of the "ENTER" buttons. The button should immediately change to show a spinner and "ENTERING..." while waiting for the next page to finish loading.

## Done criteria

Machine-checkable. ALL must hold:
- [ ] The `frontend/src/app/home/page.tsx` file tracks the clicked route in state.
- [ ] The button UI updates immediately on click to show a loading state.
- [ ] `cd frontend && npm run lint` exits 0
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The code at the locations in "Current state" doesn't match the excerpts.
- You encounter lint errors that aren't easily fixable.
- Adding the `onClick` to `<Link>` causes unexpected React errors in Next.js version 15 (which is being used).

## Maintenance notes

- Since Next.js `<Link>` handles navigation, setting local state via `onClick` is the simplest way to add immediate visual feedback. However, if the user navigates away and then uses the "Back" button to return to this screen, the state might remain "ENTERING...". If that becomes an issue, we can implement an effect that clears `isNavigatingTo` when the component re-mounts or is focused.
