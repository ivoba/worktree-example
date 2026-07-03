#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getMainWorktreeInfo, run } from './lib/utils.mjs';

const name = process.argv[2];
if (!name || name.startsWith('-')) {
  console.error('Usage: npm run create -- <worktree-name>');
  console.error('');
  console.error('Creates a new branch and a linked worktree one directory above');
  console.error('the main repository, using the main directory name as a prefix.');
  process.exit(1);
}

const { mainRoot, mainDir, parentDir, isMain } = getMainWorktreeInfo();
if (!isMain) {
  console.error('Error: This command must be run from the main worktree.');
  process.exit(1);
}

const worktreeName = `${mainDir}-${name}`;
const worktreePath = join(parentDir, worktreeName);

try {
  run(`git show-ref --verify --quiet refs/heads/${name}`);
  console.error(`Error: Branch "${name}" already exists.`);
  process.exit(1);
} catch {
  // branch does not exist, continue
}

if (existsSync(worktreePath)) {
  console.error(`Error: Directory "${worktreePath}" already exists.`);
  process.exit(1);
}

console.log(`Creating branch "${name}"...`);
console.log(`Creating worktree at "${worktreePath}"...`);
run(`git worktree add -b ${name} "${worktreePath}"`, undefined, { stdio: 'inherit' });

console.log('');
console.log('Generating worktree-specific ports and Portless config...');
run('npm run ports', worktreePath, { stdio: 'inherit' });

console.log('');
console.log(`Worktree "${worktreeName}" is ready.`);
console.log('');
console.log('To start it:');
console.log(`  cd ${worktreePath}`);
console.log('  npm run dev');
