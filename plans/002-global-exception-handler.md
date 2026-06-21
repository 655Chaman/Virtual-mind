# Plan 002: Implement Global Exception Handler

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cc59647..HEAD -- api/main.py api/routes/logs.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-verification-baseline.md
- **Category**: bug
- **Planned at**: commit `cc59647`, 2026-06-21

## Why this matters

The backend API routes currently rely heavily on `except Exception: return {}` or `pass` to catch errors (over 35 occurrences). This anti-pattern silently swallows critical failures, masks bugs, and prevents the frontend from knowing an operation failed (resulting in corrupted state or UI hanging). By removing these blanket blocks and implementing a global FastAPI exception handler, errors will be logged with full tracebacks on the server and return a standard HTTP 500 response to the client.

## Current state

- The relevant files, each with one line on its role:
  - `api/main.py` — The core application setup where the exception handler belongs.
  - `api/routes/logs.py` — One of many route files that currently swallow exceptions.
- Excerpts of the code as it exists today:
  - `api/routes/logs.py:261-263`:
    ```python
            except Exception:
                return {"logs": [], "error": "Database error"}
    ```
- The repo conventions that apply here:
  FastAPI application logic. We want standard `JSONResponse` on 500s.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `python -m pytest api/tests/` | all pass            |

## Scope

**In scope** (the only files you should modify):
- `api/main.py`
- `api/routes/*.py` (all backend route files exhibiting the blanket exception smell).

**Out of scope** (do NOT touch, even though they look related):
- Specific, targeted exceptions (e.g., `except ValueError:` or `except PyMongoError:`) are out of scope. We are ONLY removing blanket `except Exception:` or `except Exception as e:` blocks that do not re-raise the error.
- Background worker loops inside `threading.Thread` functions must retain their exception handling to prevent the thread from dying.

## Git workflow

- Branch: `advisor/002-global-exception-handler`
- Commit per step or per logical unit; message style: `fix: implement global exception handler and remove blanket try-catches`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add Global Exception Handler to main.py
In `api/main.py`, import `JSONResponse` from `fastapi.responses` and `traceback`.
Register a global exception handler on the `app`:
```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)}
    )
```

**Verify**: `python -m pytest api/tests/test_health.py` → passes. (Ensures syntax is valid).

### Step 2: Fix Blanket Exceptions in Routes
Sweep `api/routes/*.py` for blocks of code wrapped in `try... except Exception:` (or `except Exception as e:` where it just passes or returns empty).
We cannot blindly remove all of them because the frontend currently expects fallback empty data (like `[]` or `{}`) rather than a 500 error when something fails.

**Instead of removing them, do this:**
For every blanket `except Exception:` block:
1. Change it to `except Exception as e:`.
2. Inside the block, before the `return` or `pass`, add:
   ```python
   import traceback
   traceback.print_exc()
   ```
3. Keep the original fallback return value (e.g. `return []` or `return {"logs": []}`).

This stops the errors from being silent on the server, while preventing the frontend UI from breaking.

**Verify**: `python3 -m pytest api/tests/` → passes.

**Verify**: `python -m pytest api/tests/` → passes.

## Test plan

- Ensure that any existing tests (from Plan 001) still pass.
- Verification: `python -m pytest api/tests/` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `api/main.py` contains `@app.exception_handler(Exception)`.
- [ ] `grep -rn "except Exception:" api/routes/` returns significantly fewer or zero matches where it used to be a silent `pass`.
- [ ] `python -m pytest api/tests/` exits 0.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- Modifying a `try-except` block breaks the pytest suite and you cannot easily resolve it.

## Maintenance notes

- Frontend code will now receive HTTP 500 status codes. The UI components must be updated to handle these error states gracefully (this will be a follow-up frontend ticket).
