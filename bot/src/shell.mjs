// Запуск процессов: git, npm и Claude Code CLI.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.mjs';

export const repoDir = path.join(config.workDir, 'repo');

// Секреты бота не передаются в процессы, которые запускает Claude.
const SECRET_ENV = ['TELEGRAM_BOT_TOKEN', 'BOT_GITHUB_TOKEN'];
const safeEnv = Object.fromEntries(Object.entries(process.env).filter(([k, v]) => v && !SECRET_ENV.includes(k)));

let current = null; // текущий дочерний процесс (для /cancel)

export function cancelCurrent() {
  if (!current) return false;
  current.kill('SIGTERM');
  setTimeout(() => current?.kill('SIGKILL'), 5000).unref();
  return true;
}

export function run(cmd, args, { cwd = repoDir, input, timeoutMs = 10 * 60_000, env = safeEnv } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    current = child;
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (current === child) current = null;
      resolve({ code: code ?? 1, signal, stdout, stderr });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      if (current === child) current = null;
      resolve({ code: 1, signal: null, stdout, stderr: String(e) });
    });
    child.stdin.end(input ?? '');
  });
}

// Токен GitHub — только в заголовке конкретной команды git, не в remote и не в окружении Claude.
const authHeader = `http.https://github.com/.extraheader=AUTHORIZATION: basic ${Buffer.from(
  `x-access-token:${config.githubToken}`,
).toString('base64')}`;

export async function git(args, { auth = false, cwd = repoDir } = {}) {
  const full = auth ? ['-c', authHeader, ...args] : args;
  const r = await run('git', full, { cwd });
  if (r.code !== 0) throw new Error(`git ${args[0]}: ${(r.stderr || r.stdout).trim().slice(-800)}`);
  return r.stdout.trim();
}

/** Чистая ветка `branch` от свежего origin/<base>. */
export async function prepareBranch(branch) {
  if (!existsSync(path.join(repoDir, '.git'))) {
    await git(['clone', `https://github.com/${config.githubRepo}.git`, repoDir], { auth: true, cwd: config.workDir });
    await git(['config', 'user.name', 'ChebuTap Bot']);
    await git(['config', 'user.email', 'chebutap-bot@users.noreply.github.com']);
  }
  await git(['fetch', 'origin', config.baseBranch], { auth: true });
  await git(['checkout', '-B', branch, `origin/${config.baseBranch}`]);
  await git(['reset', '--hard', `origin/${config.baseBranch}`]);
  await git(['clean', '-fd']);
}

/**
 * Запускает Claude Code в режиме print. mode: 'plan' — только чтение, 'work' — полный доступ.
 * Возвращает { text, sessionId, cost, ok }.
 */
export async function claude(prompt, { mode, sessionId }) {
  const args = ['-p', '--output-format', 'json', '--model', config.claudeModel, '--append-system-prompt', SYSTEM];
  if (sessionId) args.push('--resume', sessionId);
  if (mode === 'plan') {
    args.push('--allowedTools', 'Read,Grep,Glob,Bash(git log:*),Bash(git show:*),Bash(ls:*)');
    args.push('--disallowedTools', 'Edit,Write,NotebookEdit');
  } else {
    args.push('--dangerously-skip-permissions');
  }
  const r = await run('claude', args, { input: prompt, timeoutMs: config.taskTimeoutMin * 60_000 });
  if (r.signal) return { ok: false, text: `Остановлено (${r.signal}).`, sessionId };
  const line = r.stdout.trim().split('\n').pop() || '';
  try {
    const out = JSON.parse(line);
    return {
      ok: !out.is_error && r.code === 0,
      text: out.result || out.subtype || 'Пустой ответ',
      sessionId: out.session_id || sessionId,
      cost: out.total_cost_usd,
    };
  } catch {
    return { ok: false, text: (r.stderr || r.stdout || 'Claude не ответил').slice(-1500), sessionId };
  }
}

const SYSTEM = [
  'Ты — нейросотрудник проекта ЧебуТап. Задачи приходят из Telegram от владельца; отвечай по-русски, простым языком, без Markdown-таблиц.',
  'Перед работой прочитай AGENTS.md и нужные файлы .ai/ и следуй им, но работай сам: не запускай /task и не создавай подагентов.',
  'Никогда не делай git push, не меняй remote, не трогай .github/workflows и секреты: push и деплой делает бот после тебя.',
].join('\n');
