# GitHub Pages deployment error, again

Follow-up to `20261122-012555-fix-pages-deployment-error.md`.

## Ask

It happened again today: https://github.com/songswords99/songswords99.github.io/actions/runs/45059218427

## Answer

### Same error, different cause

Run 45059218427 (commit `0e81ab9`) failed in the deploy step:

```
Deployment request failed for 0e81ab9... due to in progress deployment.
Please cancel 61c27af... first or wait for it to complete.
```

`61c27af` was pushed 7 minutes earlier, and its deploy had reported `succeed` at 19:04:45. The rejection
came at 19:11, more than 6 minutes later. Waiting 2 minutes between pushes, as suggested last time,
is therefore not enough.

### What was tried

| Step | Result |
|------|--------|
| `gh api -X POST .../pages/builds` (the command in `scripts/github/fixDeployError.sh`) | Failed again with the same "in progress 61c27af" error |
| `gh api -X POST .../pages/deployments/61c27af.../cancel` | `400: Unable to cancel ... as it's finished`. The Pages APIs contradict each other |
| `gh api .../pages/deployments/0e81ab9...` | Showed a hidden deployment for the **new** commit, stuck in `purging_cdn` |
| `gh api -X POST .../pages/deployments/0e81ab9.../cancel` | Succeeded; status became `deployment_cancelled` and the lock was gone |
| `gh api -X POST .../pages/builds` again | Deploy was accepted, but its status stayed empty for 10 minutes, then it timed out and cancelled itself |

### What was learned

- A Pages deployment's ID is the **commit SHA**. Check one with
  `gh api repos/songswords99/songswords99.github.io/pages/deployments/<full sha>`.
- The commit named in the error ("please cancel X") may not be the one actually stuck. Check the
  status of the **new** commit's deployment too.
- After a deployment for a SHA has been cancelled, deploying that **same SHA** again can hang.
  Rebuilding (`POST /pages/builds`) always uses the current HEAD SHA, so the reliable way out is a
  **new commit**.
- `gh run rerun` on `pages-build-deployment` got stuck in "queued" (last time). Avoid it.

### Fix

Push a new commit (even an empty one) so Pages deploys under a new SHA:

```bash
git commit --allow-empty -m "Trigger Pages rebuild" && git push
```

### Recovery recipe for next time

```bash
R=repos/songswords99/songswords99.github.io
SHA=$(git rev-parse HEAD)
gh api $R/pages/deployments/$SHA             # stuck "purging_cdn"/"syncing_files"/... ?
gh api -X POST $R/pages/deployments/$SHA/cancel   # clear it if so
git commit --allow-empty -m "Trigger Pages rebuild" && git push
```

A permanent alternative was also proposed: switch the Pages source to "GitHub Actions" with a custom workflow
that retries the deploy step after a delay.
