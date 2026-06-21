# Plan 003: Unify API Port Configuration

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cc59647..HEAD -- api/main.py scheduler.py`
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

The API port is hardcoded to `8001` in `scheduler.py` (`API_BASE = "http://localhost:8001"`) but the backend runs on `8000` via `api/main.py` when started directly. This leads to connection refused errors for internal API calls (e.g. fetching prayer times, dispatching push notifications) if the system isn't started perfectly via the `start_mobile.sh` script that switches it to 8001. Unifying this through an environment variable ensures consistent behavior regardless of how the project boots.

## Current state

- `api/main.py` — runs the main FastAPI server.
  ```python
  if __name__ == "__main__":
      import uvicorn
      uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
  ```
- `scheduler.py` — background scheduler relying on the API.
  ```python
  # The API runs on port 8001 when started via start_mobile.sh (uvicorn on 0.0.0.0:8001)
  # Fall back to 8000 for local dev with the simple start script
  API_BASE = "http://localhost:8001"
  ```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Run API   | `python api/main.py &`   | Server starts on correct port |

## Scope

**In scope**:
- `api/main.py`
- `scheduler.py`

**Out of scope**:
- Changing logic of any existing scheduler job or endpoint.
- Shell scripts (unless they break from this change, but we will use a fallback port of 8000).

## Git workflow

- Branch: `advisor/003-unify-api-port-config`
- Commit per step or per logical unit.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Update API_BASE in scheduler.py

Replace the hardcoded `http://localhost:8001` in `scheduler.py` with one that reads from an environment variable `API_PORT` with a fallback to `8000`.

Update `scheduler.py` line 12:
```python
import os
API_PORT = os.getenv("API_PORT", "8000")
API_BASE = f"http://localhost:{API_PORT}"
```

**Verify**: `python -c "import scheduler; print(scheduler.API_BASE)"` → `http://localhost:8000` (assuming `API_PORT` isn't set).

### Step 2: Use API_PORT in api/main.py

Update the `uvicorn.run` command in `api/main.py` to also read the same environment variable so they're always in sync.

Update `api/main.py` line 232:
```python
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
```

**Verify**: `python -c "import api.main; print('ok')"` → `ok` (just ensures syntax is valid).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -q "os.getenv(\"API_PORT\", \"8000\")" scheduler.py` exits 0
- [ ] `grep -q "os.getenv(\"API_PORT\", 8000)" api/main.py` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
- You discover the assumption "The scheduler relies solely on `API_BASE` for its requests" is false.

## Maintenance notes

If deploying on Render or another platform, ensure the `API_PORT` matches the deployment port (usually `$PORT` injected by the platform, which might require passing `API_PORT=$PORT` in the start script).
