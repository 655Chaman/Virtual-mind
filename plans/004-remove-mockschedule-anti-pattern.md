# Plan 004: Remove MockSchedule Anti-pattern

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat cc59647..HEAD -- api/main.py requirements.txt`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `cc59647`, 2026-06-21

## Why this matters

The `api/main.py` entrypoint currently wraps the `import schedule` statement in a `try...except ImportError` block that creates a dummy `MockSchedule` class if the package is missing. This is a severe anti-pattern: if the `schedule` library isn't installed, the backend boots up seemingly successfully, but absolutely no background jobs will ever run, failing silently. We need dependencies to fail fast during deployment.

## Current state

- The relevant files, each with one line on its role:
  - `requirements.txt` — The root project dependencies.
  - `api/main.py` — The FastAPI application entrypoint.
- Excerpts of the code as it exists today:
  - `api/main.py:9-18`:
    ```python
    try:
        import schedule
    except ImportError:
        class MockSchedule:
            def run_pending(self): pass
            def every(self, *args, **kwargs): return self
            def day(self, *args, **kwargs): return self
            def at(self, *args, **kwargs): return self
            def do(self, *args, **kwargs): return self
        schedule = MockSchedule()
    ```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pip install -r requirements.txt` | exit 0     |
| Tests     | `python -m pytest api/tests/` | all pass       |

## Scope

**In scope** (the only files you should modify):
- `api/main.py`
- `requirements.txt`

**Out of scope** (do NOT touch, even though they look related):
- Do NOT modify the `run_scheduler_bg` threading logic inside `api/main.py`.

## Git workflow

- Branch: `advisor/004-remove-mockschedule-anti-pattern`
- Commit per step or per logical unit; message style: `fix: remove MockSchedule anti-pattern and add schedule dependency`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add schedule to dependencies
Append the exact string `schedule` to the bottom of the root `requirements.txt` file.

**Verify**: `grep "schedule" requirements.txt` → returns `schedule`.

### Step 2: Remove MockSchedule from main.py
In `api/main.py`, remove the entire `try...except ImportError:` block spanning roughly lines 9-18.
Replace it with a simple, standard import:
```python
import schedule
```

**Verify**: `python -m pytest api/tests/test_health.py` → passes. (If `schedule` is missing, this will correctly fail during import).

## Test plan

- Ensure the application still passes the health check.
- Verification: `python -m pytest api/tests/` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `requirements.txt` contains `schedule`.
- [ ] `grep -rn "class MockSchedule:" api/main.py` returns no matches.
- [ ] `python -m pytest api/tests/` exits 0.
- [ ] No files outside the in-scope list are modified (`git status`).
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `schedule` is already in `requirements.txt` but commented out.
- `api/main.py` no longer contains the `MockSchedule` class.

## Maintenance notes

- With `schedule` properly declared, deployments to Render will no longer silently drop scheduled alarms and logging reminders.
