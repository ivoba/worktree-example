# Problems with worktree setup

1. Copy gitignored files like .env
2. IDE settings like phpunit config, php docker config, open terminals, debug settings, run configs
3. Multiple docker setups running in parallel: port conflicts, container name conflicts, volume conflicts
4. Domain setup (localhost, etc.) /etc/hosts
5. Directory structure and naming conventions

## todo

- [x] add create worktree script, should execute worktree-ports.mjs
- [x] add delete worktree script
- [ ] add list worktrees script
- [ ] add switch worktree script
- [x] npm run dev should not run worktree, just expect that everything is setup correctly


## Tools & Resources
- https://crates.io/crates/worktree
- https://github.com/AgenticSec/sprout
- https://github.com/iheanyi/grove
- https://github.com/dazz/git-wt
- https://coasts.dev/
- https://fabiorehm.com/blog/2025/11/27/working-on-multiple-branches-without-losing-my-mind/
- https://github.com/wraps-team/wraps/blob/3f875647f7cf047d2b1106341b6368d7452e947c/scripts/setup-worktree.sh