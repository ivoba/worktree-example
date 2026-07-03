import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(SCRIPTS_DIR, '..', '..');

const DEV_COMMANDS = new Set(['node', 'docker-compose', 'docker']);

export function run(cmd, cwd = ROOT, { allowFailure = false, ...options } = {}) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', cwd, stdio: 'pipe', ...options });
    return result ? result.trim() : '';
  } catch (err) {
    if (allowFailure) return '';
    throw err;
  }
}

export function getMainRoot() {
  const mainRoot = run('git rev-parse --show-toplevel');
  if (!mainRoot) {
    throw new Error('Not inside a git repository.');
  }
  return mainRoot;
}

export function getMainWorktreeInfo(cwd = ROOT) {
  const mainRoot = getMainRoot();
  const mainDir = basename(mainRoot);
  const parentDir = dirname(mainRoot);
  const isMain = isMainWorktree(cwd);
  return { mainRoot, mainDir, parentDir, isMain };
}

export function isMainWorktree(cwd = ROOT) {
  const gitDir = run('git rev-parse --git-dir', cwd, { allowFailure: true });
  const commonDir = run('git rev-parse --git-common-dir', cwd, { allowFailure: true });
  return gitDir !== '' && commonDir !== '' && gitDir === commonDir;
}

export function getCurrentWorktreePath(cwd = ROOT) {
  return run('git rev-parse --show-toplevel', cwd, { allowFailure: true });
}

export function listWorktrees(cwd = ROOT) {
  const output = run('git worktree list --porcelain', cwd, { allowFailure: true });
  const worktrees = [];
  let current = null;
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('worktree ')) {
      current = { path: trimmed.slice(9).trim(), branch: null, prunable: false };
      worktrees.push(current);
    } else if (trimmed.startsWith('branch ')) {
      if (current) current.branch = trimmed.slice(7).trim();
    } else if (trimmed.startsWith('prunable')) {
      if (current) current.prunable = true;
    }
  }
  return worktrees;
}

export function findWorktree(cwd, targetPath) {
  return listWorktrees(cwd).find((w) => w.path === targetPath);
}

export function sanitizeForHostname(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
}

export function getWorktreeUrlBase(cwd = ROOT) {
  const envBase = process.env.WORKTREE_URL_BASE;
  if (envBase !== undefined && envBase.trim() !== '') {
    return sanitizeForHostname(envBase);
  }
  if (isMainWorktree(cwd)) {
    return 'worktree';
  }
  const path = getCurrentWorktreePath(cwd);
  if (!path) return 'worktree';
  const slug = path.split('/').pop();
  return sanitizeForHostname(slug) || 'worktree';
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function findDevProcesses(worktreePath) {
  if (!existsSync(worktreePath)) return [];
  let output = '';
  try {
    output = run(`lsof +D "${worktreePath}" -F pcn 2>/dev/null`, undefined, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
  } catch (err) {
    output = err.stdout?.toString() ?? '';
  }
  if (!output) return [];

  const processes = new Map();
  let currentPid = null;
  for (const line of output.split('\n')) {
    if (!line) continue;
    const type = line[0];
    const value = line.slice(1);
    if (type === 'p') {
      currentPid = parseInt(value, 10);
    } else if (type === 'c' && currentPid !== null) {
      processes.set(currentPid, value);
    }
  }
  return Array.from(processes.entries())
    .filter(([_, command]) => DEV_COMMANDS.has(command))
    .map(([pid, command]) => ({ pid, command }));
}

export async function terminateProcesses(processes) {
  const pids = processes.map((p) => p.pid);
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (err) {
      if (err.code !== 'ESRCH') throw err;
    }
  }

  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const alive = pids.filter((pid) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    });
    if (alive.length === 0) return;
    await sleep(100);
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (err) {
      if (err.code !== 'ESRCH') throw err;
    }
  }
}
