# Claude Workflow Rules

## Core Principle

All work must be isolated, reproducible, and branch-based.

- Do not commit directly to `main`.
- Do all changes in dedicated branches/worktrees.
- Keep changes scoped to one task.

---

## 1. Worktrees

- Always use Git worktrees for any task
- Create one worktree per feature/fix/task
- Never reuse a worktree for unrelated work
- Delete unused worktrees after the task is done
- Rebase new code on top of `origin/main`
- At the end, create an MR to `main`

### Create worktree

```bash
git fetch origin
git worktree add ../<task-name> -b <branch-name> origin/main
```

### Finish task

```bash
git add -A
git commit -m "<message>"
git push -u origin <branch-name>
```

Then open an MR from `<branch-name>` to `main`.

## Efficiency rules

- Do NOT scan the entire repository.
- Only read files directly relevant to the task.
- Avoid repeated file reads.
- Ask before broad architectural exploration.
- Prefer targeted grep/search over repo summarization.