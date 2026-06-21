# Plan 001: Establish Verification Baseline for the Backend API

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cc59647..HEAD -- api/requirements.txt api/tests/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `cc59647`, 2026-06-21

## Why this matters

The backend API currently has absolutely no test suite or verification commands. Any change made to the Python codebase is completely unverified until it hits production or is manually clicked through on the Android app. Establishing a `pytest` verification baseline with a simple health check provides a safety net for future refactoring (like the exception handler in Plan 002) and allows continuous integration to catch immediate breaking errors.

## Current state

- The relevant files, each with one line on its role:
  - `api/requirements.txt` — Python dependencies; needs pytest.
  - `api/main.py` — The FastAPI application entrypoint containing `/api/health`.
- Excerpts of the code as it exists today:
  - `api/main.py:178-180`:
    ```python
    @app.get("/api/health")
    async def health_check():
        return {"status": "ok", "system": "Virtual Mind 2.0 Operational"}
    ```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pip install -r api/requirements.txt` | exit 0              |
| Tests     | `python -m pytest api/tests/`         | all pass, exit 0    |

## Scope

**In scope** (the only files you should modify):
- `api/requirements.txt`
- `api/tests/__init__.py` (create)
- `api/tests/test_health.py` (create)

**Out of scope** (do NOT touch, even though they look related):
- Do NOT modify `api/main.py` or any backend logic routes. We are only writing a test to verify existing behavior.
- Frontend testing is out of scope for this plan.

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commit per step or per logical unit; message style: `test: add pytest baseline and health endpoint tests`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add pytest to requirements
Add `pytest` and `httpx` to the bottom of `api/requirements.txt`.

**Verify**: `grep -E "pytest|httpx" api/requirements.txt` → returns both dependencies.

### Step 2: Install dependencies
Activate the virtual environment (if available, or run pip directly) and install the updated requirements.

**Verify**: `pip install -r api/requirements.txt` → exit 0.

### Step 3: Create tests directory and initialization
Create the directory `api/tests` and an empty `api/tests/__init__.py` file to mark it as a module.

**Verify**: `ls api/tests/__init__.py` → file exists.

### Step 4: Write health check test
Create `api/tests/test_health.py`.
Import `TestClient` from `fastapi.testclient` and the `app` from `api.main`.
Write a test function `test_health_check()` that issues a GET request to `/api/health` and asserts that `response.status_code == 200` and `response.json()["status"] == "ok"`.

**Verify**: `python -m pytest api/tests/test_health.py` → 1 passed in XXs.

## Test plan

- The test plan *is* this plan. We are adding tests for the first time.
- Verification: `python -m pytest api/tests/` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pip install -r api/requirements.txt` succeeds.
- [ ] `python -m pytest api/tests/` exits 0 with 1 passing test.
- [ ] No files outside the in-scope list are modified (`git status`).
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- The `api/requirements.txt` already has conflicting testing frameworks.
- Importing `api.main` in the test file fails due to complex un-mockable startup events (like missing Qdrant URLs throwing hard errors). If this happens, STOP and report.
- The test fails and requires modifying `api/main.py` to fix. Do not fix it.

## Maintenance notes

- Any future route added to the backend should come with an adjacent test in `api/tests/`.
- CI/CD workflows on Render or GitHub Actions can now run `python -m pytest api/tests/` as a blocking verification step before deployment.
