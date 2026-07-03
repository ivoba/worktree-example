import './style.css';

interface Worktree {
  id: string;
  branch: string;
  path: string;
  lastCommit: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchWorktrees(): Promise<Worktree[]> {
  const response = await fetch(`${API_URL}/worktrees`);
  if (!response.ok) {
    throw new Error(`Failed to fetch worktrees: ${response.statusText}`);
  }
  const data = (await response.json()) as { worktrees: Worktree[] };
  return data.worktrees;
}

async function renderApp(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Could not find #app element');
  }

  app.innerHTML = `
    <h1>Git Worktree Manager</h1>
    <div id="status">Loading worktrees...</div>
    <ul id="worktree-list"></ul>
  `;

  try {
    const worktrees = await fetchWorktrees();
    const status = document.querySelector<HTMLDivElement>('#status');
    const list = document.querySelector<HTMLUListElement>('#worktree-list');

    if (status) {
      status.textContent = `Loaded ${worktrees.length} worktree(s)`;
    }

    if (list) {
      list.innerHTML = worktrees
        .map(
          (worktree) => `
            <li>
              <strong>${worktree.branch}</strong>
              <span>${worktree.path}</span>
              <code>${worktree.lastCommit}</code>
            </li>
          `
        )
        .join('');
    }
  } catch (error) {
    const status = document.querySelector<HTMLDivElement>('#status');
    if (status) {
      status.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

renderApp();
