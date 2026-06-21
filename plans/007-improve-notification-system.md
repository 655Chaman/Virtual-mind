# Plan 007: Refactor Web Push Notification Architecture for Concurrency and Thread Safety

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a2d1656..HEAD -- api/routes/push.py scheduler.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt, perf
- **Planned at**: commit `a2d1656`, 2026-06-21

## Why this matters

The core web push notification system (`api/routes/push.py`) currently suffers from two major architectural flaws. First, it manages browser subscriptions by reading and writing to a JSON file (`push_subscriptions.json`) without any file locking. Concurrent API requests (e.g., a device subscribing while a scheduled notification cleans up dead endpoints) will cause data loss through race conditions. Second, the `/send` endpoint dispatches notifications synchronously in a `for` loop. `pywebpush` makes blocking network requests to Google/Mozilla push services; executing these sequentially blocks the FastAPI worker and delays the response to the `scheduler.py`, which is also blocked waiting for it.

Moving the dispatch to a background task and adding a file lock resolves both the race conditions and the blocking I/O bottleneck.

## Layman's Explanation

Right now, when the system sends a notification, it acts like a mailman who insists on waiting at every single house until the person opens the door and reads the letter before moving to the next house. Worse, the master list of addresses is a single piece of paper that multiple people can try to erase and rewrite at the exact same time, causing addresses to be lost. We are going to give the mailman a "drop and go" background task, and put a lock box around the address list so only one person can update it at a time.

## Current state

- `api/routes/push.py` — Handles subscription saving and web push dispatching.
  - Subscriptions lack locking (lines 30-42):
    ```python
    def save_subscriptions(subs: list):
        SUBSCRIPTIONS_FILE.write_text(json.dumps(subs, indent=2))
    ```
  - `/send` blocks the request (lines 164-188):
    ```python
    for sub in subs:
        try:
            webpush(
    ```
- `scheduler.py` — Calls `/send` and expects synchronous results (lines 46-47):
    ```python
            result = json.loads(response.read().decode())
            print(f"[SCHEDULER] Push dispatched: {result.get('sent', 0)} devices notified.")
    ```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pip install filelock`   | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `api/routes/push.py`
- `scheduler.py`
- `requirements.txt` (to add `filelock`)

**Out of scope** (do NOT touch):
- `api/services/notifications.py`
- `android-app/`

## Git workflow

- Branch: `advisor/007-refactor-notification-system`
- Commit per step or per logical unit; message style: `refactor(push): implement file locking and background dispatch`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add `filelock` to dependencies

Add `filelock==3.13.1` (or latest stable) to `requirements.txt`.
Then run `pip install filelock` in the environment.

**Verify**: `python -c "import filelock"` → exits 0.

### Step 2: Implement File Locking for Subscriptions

In `api/routes/push.py`, import `FileLock` from `filelock`.
Define a lock file path, e.g., `SUBSCRIPTIONS_LOCK = PROJECT_ROOT / "data" / "push_subscriptions.lock"`.
Update `subscribe` and `unsubscribe` functions to use a `with FileLock(SUBSCRIPTIONS_LOCK, timeout=5):` block whenever they call `load_subscriptions()` and `save_subscriptions(subs)`.

*Note: You must refactor `load_subscriptions` and `save_subscriptions` to either manage the lock internally, or wrap the lock around the logic inside the route handlers. It is safer to wrap it in the route handlers so the read-modify-write cycle is atomic.*

**Verify**: Start the API server locally and ensure it runs without syntax errors.

### Step 3: Move Push Dispatch to a FastAPI BackgroundTask

In `api/routes/push.py`, import `BackgroundTasks` from `fastapi`.
Modify the `/send` endpoint to accept `background_tasks: BackgroundTasks`.
Extract the `for sub in subs: ... webpush(...)` loop and the dead endpoint cleanup into a separate synchronous function, e.g., `def _background_dispatch(payload: PushPayload):`. Inside this function, ensure you acquire the `FileLock` when loading and saving the dead endpoint cleanups.
In the `/send` endpoint, add the function to the background tasks:
`background_tasks.add_task(_background_dispatch, payload)`
Return an immediate response: `{"status": "accepted", "message": "Dispatching in background"}`.

### Step 4: Update Scheduler to Expect Asynchronous Results

In `scheduler.py`, inside `dispatch_web_push`, the API will no longer return `sent` and `failed` counts. Update the expected response handling:
```python
            result = json.loads(response.read().decode())
            print(f"[SCHEDULER] Push task queued: {result.get('message', 'OK')}")
```

**Verify**: Run `python scheduler.py` briefly, or write a test script that triggers `/api/push/send`.

## Done criteria

Machine-checkable. ALL must hold:
- [ ] `filelock` is in `requirements.txt`.
- [ ] `api/routes/push.py` uses `FileLock` to protect read-modify-write cycles on `push_subscriptions.json`.
- [ ] `api/routes/push.py`'s `/send` endpoint returns an immediate JSON response without waiting for `webpush` network calls.
- [ ] `scheduler.py` logs reflect the async response.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:
- `pywebpush` requires complex monkey-patching to work in background tasks.
- You encounter issues with the `filelock` blocking forever (ensure timeouts are set).

## Maintenance notes

- Using a JSON file for the database is a stopgap. As the user base grows, `push_subscriptions` should be migrated to the main database (Qdrant or SQLite).
- Dead endpoint cleanup runs inside the background task now. If it fails, subscriptions just remain dirty until the next run.
