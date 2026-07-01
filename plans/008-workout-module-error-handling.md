# Plan 008: Fix Swallowed Workout API Exceptions with Toast Notifications

**Commit**: `HEAD`

## 1. Problem Statement
The Workout Dashboard (`frontend/src/app/workout/page.tsx`) swallows backend exceptions (e.g. from `/home-protocol/increment`, `/heatmap`) via `.catch(console.error)`. This degrades DX and UX because users are completely oblivious to network failures or server errors while tapping protocols. The state is updated optimistically, leaving the UI out-of-sync with the DB upon failure.

## 2. Goals
- Ensure all failing network requests in `page.tsx` emit a visual `Toast` or alert indicating the failure.
- Rollback optimistic UI updates if the network request fails.

## 3. Scope
- `frontend/src/app/workout/page.tsx`

## 4. Execution Steps
1. **Import/Create Toast Mechanism**:
   - If a global toast component (e.g., from `sonner` or `react-toastify`) is already in use in the repo, import it.
   - If none exists, create a simple `useToast` custom hook or local state inside `workout/page.tsx`.
2. **Update Catch Blocks**:
   - In `handleTapVariant`, save the previous `homeCounters` before updating. If `api.workout.homeProtocol.increment` fails, catch it, revert `homeCounters` to the saved state, and show a toast: "Failed to increment protocol."
   - Apply the same pattern for `handleDecrementProtocol`, `handleReorder`, and `submitRenameProtocol`.
3. **Verify**:
   - Simulate a network error (e.g., stopping the API server).
   - Tap a home protocol variant.
   - Verify that the counter does not erroneously increment permanently and a toast appears.

## 5. Layman's Explanation
Think of your UI as the dashboard of a car. Right now, when the engine (backend) misfires, the dashboard ignores it and pretends everything is fine, which tricks you into thinking you logged a workout. This fix wires up the "Check Engine" light so that if something fails, the dashboard immediately alerts you and reverts the needle to the correct spot.
