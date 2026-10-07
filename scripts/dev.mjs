import { spawn } from 'node:child_process';

function runWorkspace(workspace) {
  if (process.platform === 'win32') {
    const commandShell = process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe';
    return spawn(commandShell, ['/d', '/s', '/c', `npm run dev -w ${workspace}`], {
      stdio: 'inherit',
      windowsHide: true,
    });
  }

  return spawn('npm', ['run', 'dev', '-w', workspace], { stdio: 'inherit' });
}

const children = [runWorkspace('server'), runWorkspace('client')];

function stop(signal = 'SIGTERM') {
  for (const child of children) if (!child.killed) child.kill(signal);
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
for (const child of children) child.on('exit', (code) => { if (code && code !== 0) { stop(); process.exitCode = code; } });
