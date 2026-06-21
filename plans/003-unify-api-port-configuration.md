# Plan 003: Unify API Port Configuration

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cc59647..HEAD -- frontend/src/lib/api.ts api/main.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `cc59647`, 2026-06-21

## Why this matters

The FastAPI backend is currently hardcoded to start on port `8000` via `uvicorn.run` in `api/main.py`, but the Next.js frontend is configured to send all requests to port `8001` in `frontend/src/lib/api.ts`. This port mismatch breaks local development unless environment variables are meticulously managed. Unifying them onto port `8000` guarantees the system boots up and connects out of the box.

## Current state

- The relevant files, each with one line on its role:
  - `api/main.py` — Starts the backend server.
  - `frontend/src/lib/api.ts` — Connects the frontend to the backend.
- Excerpts of the code as it exists today:
  - `api/main.py:232`:
    ```python
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
    ```
  - `frontend/src/lib/api.ts:6-8`:
    ```typescript
      if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:8001`;
      }
      return 'http://127.0.0.1:8001';
    ```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Lint      | `cd frontend && npm run lint` | exit 0              |
| Build     | `cd frontend && npm run build` | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `frontend/src/lib/api.ts`

**Out of scope** (do NOT touch, even though they look related):
- Do NOT change `api/main.py`. The backend port `8000` is standard for FastAPI and should remain. We are changing the frontend to match it.
- Do NOT modify the Next.js dev server port (usually 3000), only the `API_BASE` port.

## Git workflow

- Branch: `advisor/003-unify-api-port-configuration`
- Commit per step or per logical unit; message style: `fix: align frontend API base port to 8000 to match backend`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Update API Base Port
Open `frontend/src/lib/api.ts`. 
Locate the `getApiBase` function. Change `8001` to `8000` in both fallback return strings.

The updated block should look like this:
```typescript
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
```

**Verify**: `grep "8001" frontend/src/lib/api.ts` → returns no matches.

### Step 2: Verify Build
Ensure the Next.js static export still builds successfully.

**Verify**: `cd frontend && npm run build` → exit 0.

## Test plan

- Verification: Start the backend, and start the frontend. The frontend should connect properly. We rely on the TypeScript/build step here.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `frontend/src/lib/api.ts` uses port `8000` instead of `8001`.
- [ ] `cd frontend && npm run build` exits 0.
- [ ] No files outside the in-scope list are modified (`git status`).
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- The port `8001` in `api.ts` has already been changed to something else.
- The `npm run build` fails for reasons unrelated to your change.

## Maintenance notes

- Local development should now just require `npm run dev` in the frontend and `python api/main.py` in the backend.
