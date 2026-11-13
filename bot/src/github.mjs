// Проверка деплоя через GitHub Actions API.
import { config } from './config.mjs';

async function gh(pathname) {
  const res = await fetch(`https://api.github.com/repos/${config.githubRepo}${pathname}`, {
    headers: {
      authorization: `Bearer ${config.githubToken}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'chebutap-bot',
    },
  });
  if (!res.ok) throw new Error(`GitHub ${pathname}: HTTP ${res.status}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ждёт запуск деплой-workflow для коммита sha. Возвращает { conclusion, url } или { conclusion: 'timeout' }. */
export async function waitDeploy(sha, onProgress) {
  const deadline = Date.now() + config.deployTimeoutMin * 60_000;
  let reported = false;
  while (Date.now() < deadline) {
    await sleep(20_000);
    let run;
    try {
      const data = await gh(`/actions/workflows/${config.deployWorkflow}/runs?head_sha=${sha}&per_page=5`);
      run = data.workflow_runs?.[0];
    } catch (e) {
      console.warn(e.message);
      continue;
    }
    if (!run) continue;
    if (!reported) {
      reported = true;
      onProgress?.(run.html_url);
    }
    if (run.status === 'completed') return { conclusion: run.conclusion, url: run.html_url };
  }
  return { conclusion: 'timeout' };
}

/** Простой smoke: страница игры отвечает 200. */
export async function smoke() {
  if (!config.appUrl) return { ok: true, skipped: true };
  try {
    const res = await fetch(config.appUrl, { redirect: 'follow' });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, status: String(e.message) };
  }
}
