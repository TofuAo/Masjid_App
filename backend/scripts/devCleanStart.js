import { spawn, execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const lockFilePath = path.join(backendRoot, '.server.lock');
const port = Number(process.env.PORT || 5000);

function getPidsListeningOnPort(targetPort) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${targetPort}`, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString();
      const pids = new Set();
      for (const rawLine of out.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        // Only target LISTENING sockets to avoid killing random clients
        if (!line.includes('LISTENING')) continue;
        const parts = line.split(/\s+/);
        const pid = Number.parseInt(parts[parts.length - 1], 10);
        if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) {
          pids.add(pid);
        }
      }
      return Array.from(pids);
    }

    const out = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString();
    return out
      .split(/\r?\n/)
      .map((v) => Number.parseInt(v.trim(), 10))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
    return true;
  } catch {
    return false;
  }
}

async function cleanup() {
  const pids = getPidsListeningOnPort(port);
  if (pids.length > 0) {
    console.log(`[dev-clean] Found process(es) on port ${port}: ${pids.join(', ')}`);
    for (const pid of pids) {
      const killed = killPid(pid);
      console.log(`[dev-clean] ${killed ? 'Stopped' : 'Failed to stop'} PID ${pid}`);
    }
  } else {
    console.log(`[dev-clean] No process is listening on port ${port}`);
  }

  try {
    const lockOwner = await fs.readFile(lockFilePath, 'utf8');
    const lockPid = Number.parseInt(lockOwner.trim(), 10);
    if (Number.isInteger(lockPid) && lockPid > 0 && lockPid !== process.pid) {
      const killed = killPid(lockPid);
      console.log(`[dev-clean] ${killed ? 'Stopped' : 'Could not stop'} lock owner PID ${lockPid}`);
    }
    await fs.unlink(lockFilePath);
    console.log('[dev-clean] Removed .server.lock');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[dev-clean] Could not remove .server.lock: ${err.message}`);
    }
  }
}

function startNodemon() {
  const child = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'dev:raw'],
    {
      cwd: backendRoot,
      stdio: 'inherit',
      shell: true
    }
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

await cleanup();
startNodemon();
