#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import {
  findDevProcesses,
  findWorktree,
  getMainWorktreeInfo,
  run,
  terminateProcesses,
} from './lib/utils.mjs';

async function main() {
  const name = process.argv[2];
  if (!name || name.startsWith('-')) {
    console.error('Usage: npm run remove -- <worktree-name>');
    console.error('');
    console.error('Removes a linked worktree created by `npm run create`.');
    process.exit(1);
  }

  const { mainRoot, mainDir, parentDir, isMain } = getMainWorktreeInfo();
  if (!isMain) {
    console.error('Error: This command must be run from the main worktree.');
    process.exit(1);
  }

  const worktreeName = `${mainDir}-${name}`;
  const worktreePath = join(parentDir, worktreeName);

  if (worktreePath === mainRoot) {
    console.error('Error: Cannot remove the main worktree.');
    process.exit(1);
  }

  const worktree = findWorktree(mainRoot, worktreePath);
  if (!worktree) {
    console.error(`Error: Worktree "${worktreeName}" not found.`);
    process.exit(1);
  }

  const branchName = worktree.branch ? worktree.branch.replace('refs/heads/', '') : name;
  const processes = findDevProcesses(worktreePath);

  console.log(`Removing worktree "${worktreeName}" at ${worktreePath}`);
  console.log(`Branch: ${branchName}`);
  if (processes.length > 0) {
    const summary = processes.map((p) => `${p.command} (pid ${p.pid})`).join(', ');
    console.log(`Running dev processes found: ${summary}`);
  }
  if (worktree.prunable) {
    console.log('Note: worktree is already prunable (directory may be missing).');
  }
  console.log('This will terminate any running dev processes and delete the worktree directory.');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Are you sure? [y/N] ');
  rl.close();

  if (!answer.trim().toLowerCase().startsWith('y')) {
    console.log('Aborted.');
    process.exit(0);
  }

  if (processes.length > 0) {
    console.log('Terminating running dev processes...');
    await terminateProcesses(processes);
  }

  if (worktree.prunable || !existsSync(worktreePath)) {
    console.log('Pruning worktree registration...');
    run('git worktree prune', mainRoot);
  } else {
    console.log('Removing worktree directory...');
    run(`git worktree remove --force "${worktreePath}"`, mainRoot);
  }

  console.log('');
  console.log(`Worktree "${worktreeName}" removed.`);
  console.log(`Branch "${branchName}" still exists; delete it with:`);
  console.log(`  git branch -D ${branchName}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
