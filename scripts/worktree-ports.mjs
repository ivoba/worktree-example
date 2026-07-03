#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, getCurrentWorktreePath, getWorktreeUrlBase, isMainWorktree, run } from './lib/utils.mjs';

const DEFAULT_PORTS = {
  API_PORT: 8080,
  MAILPIT_UI_PORT: 8026,
  MAILPIT_SMTP_PORT: 1025,
  FRONTEND_PORT: 5173,
};

const PORT_RANGE_MIN = 10000;
const PORT_RANGE_MAX = 65000;
const PORTS_PER_WORKTREE = 10;

function hashString(str) {
  return parseInt(createHash('sha256').update(str).digest('hex').slice(0, 8), 16);
}

function parsePort(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return null;
  const port = parseInt(raw, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    console.error(`Error: ${name}="${raw}" is not a valid port.`);
    process.exit(1);
  }
  return port;
}

function computeBasePort(seed) {
  const hash = hashString(seed);
  const availableRange = PORT_RANGE_MAX - PORT_RANGE_MIN;
  const maxWorktrees = Math.floor(availableRange / PORTS_PER_WORKTREE);
  return PORT_RANGE_MIN + (hash % maxWorktrees) * PORTS_PER_WORKTREE;
}

function computePorts() {
  const envPorts = {
    API_PORT: parsePort('WORKTREE_API_PORT'),
    MAILPIT_UI_PORT: parsePort('WORKTREE_MAILPIT_UI_PORT'),
    MAILPIT_SMTP_PORT: parsePort('WORKTREE_MAILPIT_SMTP_PORT'),
    FRONTEND_PORT: parsePort('WORKTREE_FRONTEND_PORT'),
  };

  const hasAllEnvOverrides = Object.values(envPorts).every((p) => p !== null);
  if (hasAllEnvOverrides) {
    return { ...envPorts, source: 'WORKTREE_*_PORT env overrides' };
  }

  if (isMainWorktree()) {
    return { ...DEFAULT_PORTS, source: 'main worktree defaults' };
  }

  const baseOverride = parsePort('WORKTREE_BASE_PORT');
  const seed = getCurrentWorktreePath() || process.cwd();
  const base = baseOverride ?? computeBasePort(seed);

  return {
    API_PORT: base,
    MAILPIT_UI_PORT: base + 1,
    MAILPIT_SMTP_PORT: base + 2,
    FRONTEND_PORT: base + 3,
    source: `worktree "${seed}" (base ${base})`,
  };
}

function mergeEnvFile(filePath, updates, defaults = {}) {
  const updateKeys = new Set(Object.keys(updates));
  const defaultKeys = new Set(Object.keys(defaults));
  const result = [];
  const seenKeys = new Set();

  if (existsSync(filePath)) {
    const raw = readFileSync(filePath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        result.push(line);
        continue;
      }
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) {
        result.push(line);
        continue;
      }
      const key = trimmed.slice(0, eqIndex).trim();
      seenKeys.add(key);
      if (updateKeys.has(key)) {
        result.push(`${key}=${updates[key]}`);
      } else {
        result.push(line);
      }
    }
  }

  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }
  for (const [key, value] of Object.entries(updates)) {
    if (!seenKeys.has(key)) {
      result.push(`${key}=${value}`);
    }
  }
  for (const [key, value] of Object.entries(defaults)) {
    if (!seenKeys.has(key)) {
      result.push(`${key}=${value}`);
    }
  }
  writeFileSync(filePath, result.join('\n') + '\n');
}

function writeApiEnv(ports) {
  const dir = join(ROOT, 'api');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const projectName = `worktree-api-${ports.API_PORT}`;
  mergeEnvFile(
    join(dir, '.env'),
    {
      COMPOSE_PROJECT_NAME: projectName,
      API_PORT: ports.API_PORT,
      MAILPIT_UI_PORT: ports.MAILPIT_UI_PORT,
      MAILPIT_SMTP_PORT: ports.MAILPIT_SMTP_PORT,
    },
    { APP_ENV: 'development' }
  );
}

function writeFrontendEnv(ports) {
  const dir = join(ROOT, 'frontend');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const baseName = getWorktreeUrlBase();
  mergeEnvFile(
    join(dir, '.env.local'),
    {
      API_URL: `https://api.${baseName}.localhost`,
      FRONTEND_PORT: ports.FRONTEND_PORT,
    },
    { VITE_API_URL: '/api' }
  );
}

function writePortlessConfig(ports) {
  const baseName = getWorktreeUrlBase();
  const config = {
    apps: {
      frontend: {
        name: baseName,
        appPort: ports.FRONTEND_PORT,
        script: 'dev',
      },
      api: {
        name: `api.${baseName}`,
        appPort: ports.API_PORT,
        script: 'dev',
      },
      mailpit: {
        name: `mailpit.${baseName}`,
        appPort: ports.MAILPIT_UI_PORT,
        script: 'dev',
      },
    },
  };
  writeFileSync(join(ROOT, 'portless.json'), JSON.stringify(config, null, 2) + '\n');
}

function main() {
  const ports = computePorts();
  const baseName = getWorktreeUrlBase();
  writeApiEnv(ports);
  writeFrontendEnv(ports);
  writePortlessConfig(ports);

  console.log(`Worktree ports (${ports.source}):`);
  console.log(`  API_PORT          = ${ports.API_PORT}`);
  console.log(`  MAILPIT_UI_PORT   = ${ports.MAILPIT_UI_PORT}`);
  console.log(`  MAILPIT_SMTP_PORT = ${ports.MAILPIT_SMTP_PORT}`);
  console.log(`  FRONTEND_PORT     = ${ports.FRONTEND_PORT}`);
  console.log(`  Portless base     = ${baseName}`);
  console.log('');
  console.log('Generated files:');
  console.log('  api/.env');
  console.log('  frontend/.env.local');
  console.log('  portless.json');
}

main();
