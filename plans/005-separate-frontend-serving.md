# Plan 005: Separate Frontend Serving from FastAPI Backend

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cc59647..HEAD -- api/main.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `cc59647`, 2026-06-21

## Why this matters

Currently, `api/main.py` uses manual middleware to catch `GET` requests, manually parsing paths and attempting to serve static `.html` and `.txt` files from Next.js's `out` directory. This is extremely brittle, performs poorly, and couples the backend to specific frontend compilation outputs. It also introduces security risks via custom path joining if not rigorously sanitized. The proper architecture is to either serve Next.js via its own node server (or statically via a reverse proxy like Nginx/Caddy) and restrict the FastAPI app strictly to API routes.

## Current state

- `api/main.py` (lines 52-103) contains `nextjs_rsc_middleware` and a standard GET request fallback that manually serves `frontend/out/` files.
- `api/main.py` (lines 222-228) mounts the frontend `out` directory at `/` or falls back to an error string if it doesn't exist.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Run API   | `python api/main.py &`   | Process starts normally |

## Scope

**In scope**:
- `api/main.py`
- `start.sh` (or any shell script modified to run Next.js independently)

**Out of scope**:
- `frontend/*` codebase.
- Modifying FastAPI routes that start with `/api`.

## Git workflow

- Branch: `advisor/005-separate-frontend-serving`
- Commit per step or per logical unit.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove custom Next.js middleware

Delete the `nextjs_rsc_middleware` function from `api/main.py` (lines 52-103).
Delete the static mount at the bottom of the file (lines 222-228).

**Verify**: `grep -q "nextjs_rsc_middleware" api/main.py` exits 1.

### Step 2: Ensure start.sh runs the frontend properly

If `start.sh` relies on FastAPI serving the frontend, update it so it runs `cd frontend && npm start` in parallel with `python api/main.py`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -q "nextjs_rsc_middleware" api/main.py` exits 1
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- You realize `start.sh` needs a more complex proxy configuration for CORS to work between the frontend server and backend server.

## Maintenance notes

Once this is complete, the frontend will run on its own server (e.g. `localhost:3005`) and the backend on its own (`localhost:8000`). CORS is already configured permissively in `api/main.py`, so this should work cleanly.
