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

`api/main.py` catches an `ImportError` when `schedule` is missing and substitutes a mock class that silently does nothing. This hides missing dependencies from developers and causes the background scheduler threads to silently no-op, breaking features like automated daily reminders. Removing the mock ensures the server fails loudly if it's missing a dependency, enforcing a correct environment.

## Current state

- `api/main.py` lines 9-18:
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
- `requirements.txt` correctly includes `schedule`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Run API   | `python api/main.py &`   | Process starts normally |

## Scope

**In scope**:
- `api/main.py`

**Out of scope**:
- Changing `scheduler.py` logic.

## Git workflow

- Branch: `advisor/004-remove-mockschedule-antipattern`
- Commit per step or per logical unit.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the MockSchedule class

Remove the `try...except ImportError` block for `schedule` and replace it with a simple `import schedule` in `api/main.py`.

Replace lines 9-18 in `api/main.py`:
```python
import schedule
```

**Verify**: `grep -q "class MockSchedule:" api/main.py` exits 1.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -q "MockSchedule" api/main.py` exits 1
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.

## Maintenance notes

If `schedule` is missing in other deployment environments, the build will now correctly fail, indicating that `requirements.txt` needs to be installed.
