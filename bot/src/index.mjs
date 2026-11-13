// ЧебуТап-бот: принимает задачи по упоминанию в Telegram и выполняет их через Claude Code.
// Цикл: план → кнопка «Делать» → ветка bot/<id> → lint/build → main → проверка деплоя → отчёт.
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.mjs';
import { tg, send, edit, dropButtons, poll } from './telegram.mjs';
import { git, run, repoDir, prepareBranch, claude, cancelCurrent } from './shell.mjs';
import { waitDeploy, smoke } from './github.mjs';

mkdirSync(config.workDir, { recursive: true });

const me = await tg('getMe');
const username = me.username.toLowerCase();
console.log(`Бот @${me.username} запущен, репозиторий ${config.githubRepo}`);

/** @type {Map<string, any>} */
const tasks = new Map();
const planMessages = new Map(); // id сообщения с планом → id задачи
const queue = [];
let busy = null;

const repoUrl = `https://github.com/${config.githubRepo}`;
const HELP = [
  'Я нейросотрудник ЧебуТапа. Упомяните меня с задачей, например:',
  `@${me.username} сделай кнопку «Магазин» зелёной`,
  '',
  'Сначала пришлю план — нажмите «Делать» или ответьте на план с правками.',
  'Потом: ветка → проверки → main → деплой → отчёт.',
  '#без_деплоя в тексте — только ветка, без выката.',
  '',
  '/status — что сейчас делаю, /cancel — остановить текущую задачу.',
].join('\n');

// ---------- входящие ----------

await poll(async (u) => {
  if (u.callback_query) return onButton(u.callback_query);
  const msg = u.message;
  if (!msg?.from) return;
  const text = msg.text || msg.caption || '';
  const entities = msg.entities || msg.caption_entities || [];
  const isPrivate = msg.chat.type === 'private';
  const mentioned = entities.some(
    (e) =>
      (e.type === 'mention' && text.slice(e.offset, e.offset + e.length).toLowerCase() === `@${username}`) ||
      (e.type === 'text_mention' && e.user?.id === me.id) ||
      (e.type === 'bot_command' && text.slice(e.offset, e.offset + e.length).toLowerCase().endsWith(`@${username}`)),
  );
  const replyToBot = msg.reply_to_message?.from?.id === me.id;
  if (!isPrivate && !mentioned && !replyToBot) return;

  if (!isPrivate && config.allowedChatIds.length && !config.allowedChatIds.includes(msg.chat.id)) return;
  if (!config.allowedUserIds.includes(msg.from.id)) {
    if (mentioned || isPrivate) await send(msg.chat.id, 'Принимаю задачи только от владельца.', { replyTo: msg.message_id });
    return;
  }

  const clean = text.replace(new RegExp(`@${username}`, 'gi'), '').trim();
  const cmd = clean.split(/\s+/)[0].toLowerCase();
  if (cmd === '/start' || cmd === '/help' || !clean) return send(msg.chat.id, HELP, { replyTo: msg.message_id });
  if (cmd === '/status') return send(msg.chat.id, statusText(), { replyTo: msg.message_id });
  if (cmd === '/id') return send(msg.chat.id, `chat_id: ${msg.chat.id}\nuser_id: ${msg.from.id}`);
  if (cmd === '/cancel') return cancel(msg);

  // Ответ на сообщение с планом — правка плана.
  const planTaskId = replyToBot && planMessages.get(msg.reply_to_message.message_id);
  const planTask = planTaskId && tasks.get(planTaskId);
  if (planTask && planTask.state === 'awaiting') {
    planTask.state = 'queued';
    planTask.feedback = clean;
    return enqueue(planTask, 'plan', msg.message_id);
  }

  const id = Date.now().toString(36).slice(-6);
  const task = {
    id,
    chatId: msg.chat.id,
    msgId: msg.message_id,
    text: clean.replace(/#без_деплоя/gi, '').trim(),
    noDeploy: /#без_деплоя/i.test(clean),
    branch: `bot/${id}`,
    state: 'queued',
    sessionId: null,
    feedback: null,
    cost: 0,
  };
  tasks.set(id, task);
  enqueue(task, 'plan', msg.message_id);
});

async function onButton(q) {
  const [action, id] = String(q.data || '').split(':');
  const task = tasks.get(id);
  if (!config.allowedUserIds.includes(q.from.id)) {
    return tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Только владелец может утверждать задачи.' });
  }
  await tg('answerCallbackQuery', { callback_query_id: q.id }).catch(() => {});
  if (!task || task.state !== 'awaiting') return dropButtons(q.message.chat.id, q.message.message_id);
  await dropButtons(q.message.chat.id, q.message.message_id);
  if (action === 'ok') {
    task.state = 'queued';
    enqueue(task, 'work', q.message.message_id);
  } else {
    task.state = 'cancelled';
    await send(task.chatId, `Задача #${id} отменена.`, { replyTo: q.message.message_id });
  }
}

async function cancel(msg) {
  for (const job of queue.splice(0)) {
    job.task.state = 'cancelled';
  }
  const stopped = busy ? cancelCurrent() : false;
  if (busy) busy.task.state = 'cancelled';
  await send(msg.chat.id, stopped || busy ? 'Останавливаю текущую задачу, очередь очищена.' : 'Сейчас ничего не выполняю.', {
    replyTo: msg.message_id,
  });
}

function statusText() {
  const lines = [];
  if (busy) lines.push(`Сейчас: #${busy.task.id} (${busy.kind === 'plan' ? 'план' : 'работа'}) — ${busy.task.text.slice(0, 80)}`);
  else lines.push('Сейчас свободен.');
  if (queue.length) lines.push(`В очереди: ${queue.map((j) => '#' + j.task.id).join(', ')}`);
  const waiting = [...tasks.values()].filter((t) => t.state === 'awaiting');
  if (waiting.length) lines.push(`Ждут утверждения: ${waiting.map((t) => '#' + t.id).join(', ')}`);
  return lines.join('\n');
}

// ---------- очередь ----------

async function enqueue(task, kind, replyTo) {
  const ahead = queue.length + (busy ? 1 : 0);
  const status = await send(
    task.chatId,
    kind === 'plan'
      ? `📝 #${task.id}: ${task.feedback ? 'переделываю план' : 'принял, составляю план'}${ahead ? ` (в очереди: ${ahead})` : ''}…`
      : `🛠 #${task.id}: план утверждён, приступаю${ahead ? ` (в очереди: ${ahead})` : ''}…`,
    { replyTo },
  );
  queue.push({ task, kind, statusId: status.message_id });
  drain();
}

async function drain() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = job;
  const started = Date.now();
  const ticker = setInterval(() => {
    const min = Math.round((Date.now() - started) / 60_000);
    edit(job.task.chatId, job.statusId, `${job.kind === 'plan' ? '📝 Составляю план' : '🛠 Работаю'} #${job.task.id}… ${min} мин`);
  }, 60_000);
  try {
    if (job.task.state !== 'cancelled') {
      job.task.state = job.kind === 'plan' ? 'planning' : 'working';
      await (job.kind === 'plan' ? doPlan(job) : doWork(job));
    }
  } catch (e) {
    console.error(e);
    job.task.state = 'failed';
    await send(job.task.chatId, `❌ #${job.task.id}: ошибка — ${e.message}`).catch(() => {});
  } finally {
    clearInterval(ticker);
    busy = null;
    drain();
  }
}

// ---------- этапы ----------

async function doPlan({ task, statusId }) {
  await prepareBranch(task.branch);
  const prompt = task.feedback
    ? `Владелец прислал правки к плану:\n${task.feedback}\n\nПерепиши план с учётом правок. Формат тот же, ничего не меняй в файлах.`
    : [
        `Задача от владельца: ${task.text}`,
        '',
        'Сейчас ЭТАП ПЛАНА: файлы не меняй. Найди нужный код и ответь для Telegram (до 2500 символов):',
        '1. Что изменится и как это будет работать для игрока — простыми словами.',
        '2. Какие файлы затронешь.',
        '3. Риски и вопросы. Если задача неясна — последней строкой задай вопрос, начав с «ВОПРОС:».',
      ].join('\n');
  const r = await claude(prompt, { mode: 'plan', sessionId: task.sessionId });
  task.sessionId = r.sessionId;
  task.cost += r.cost || 0;
  task.feedback = null;
  if (task.state === 'cancelled') return;
  await edit(task.chatId, statusId, `📝 #${task.id}: план готов.`);
  if (!r.ok) {
    task.state = 'failed';
    await send(task.chatId, `❌ #${task.id}: не удалось составить план.\n\n${r.text}`, { replyTo: statusId });
    return;
  }
  task.state = 'awaiting';
  const m = await send(task.chatId, `План #${task.id}\n\n${r.text}\n\nОтветьте на это сообщение, чтобы поправить план.`, {
    replyTo: task.msgId,
    buttons: [
      ['✅ Делать', `ok:${task.id}`],
      ['❌ Отмена', `no:${task.id}`],
    ],
  });
  planMessages.set(m.message_id, task.id);
}

async function doWork({ task, statusId }) {
  await prepareBranch(task.branch);
  const base = await git(['rev-parse', 'HEAD']);
  const r = await claude(
    [
      'Владелец утвердил план. Реализуй его в текущей ветке.',
      '- Следуй AGENTS.md; кратко обнови .ai/STATE.md и .ai/CHANGELOG.md.',
      '- Запусти npm ci (если нет node_modules), npm run lint и npm run build; исправь ошибки.',
      '- Сделай коммит(ы) с понятным сообщением. НЕ делай push.',
      '- В конце — отчёт для Telegram (до 2000 символов): что сделано, результаты проверок, известные проблемы.',
    ].join('\n'),
    { mode: 'work', sessionId: task.sessionId },
  );
  task.sessionId = r.sessionId;
  task.cost += r.cost || 0;
  if (task.state === 'cancelled') return;
  const report = r.text;
  const fail = async (why) => {
    task.state = 'failed';
    await edit(task.chatId, statusId, `❌ #${task.id}: остановлено.`);
    await send(task.chatId, `❌ #${task.id}: ${why}\n\nОтчёт Claude:\n${report}${costLine(task)}`, { replyTo: task.msgId });
  };
  if (!r.ok) return fail('Claude завершился с ошибкой.');

  // Незакоммиченное — докоммитим, чтобы ничего не потерять.
  if (await git(['status', '--porcelain'])) {
    await git(['add', '-A']);
    await git(['commit', '-m', `bot #${task.id}: ${task.text.slice(0, 60)}`]);
  }
  const commits = Number(await git(['rev-list', '--count', `${base}..HEAD`]));
  if (!commits) {
    task.state = 'done';
    await edit(task.chatId, statusId, `ℹ️ #${task.id}: изменений нет.`);
    return send(task.chatId, `ℹ️ #${task.id}: изменений в коде нет.\n\n${report}${costLine(task)}`, { replyTo: task.msgId });
  }

  // Собственная проверка бота: сборка должна проходить.
  await edit(task.chatId, statusId, `🔎 #${task.id}: проверяю сборку…`);
  if (!existsSync(path.join(repoDir, 'node_modules'))) await run('npm', ['ci', '--no-audit', '--no-fund']);
  const build = await run('npm', ['run', 'build']);
  await git(['push', 'origin', `HEAD:refs/heads/${task.branch}`], { auth: true });
  const branchUrl = `${repoUrl}/compare/${config.baseBranch}...${task.branch}`;
  if (build.code !== 0) {
    return fail(`сборка не прошла, изменения только в ветке ${task.branch}: ${branchUrl}\n\n${build.stdout.slice(-800)}`);
  }

  if (task.noDeploy) {
    task.state = 'done';
    await edit(task.chatId, statusId, `✅ #${task.id}: готово, в ветке.`);
    return send(task.chatId, `✅ #${task.id}: готово (без деплоя).\nВетка: ${branchUrl}\n\n${report}${costLine(task)}`, {
      replyTo: task.msgId,
    });
  }

  // В main: перебазируемся на свежий main и пушим без force.
  await edit(task.chatId, statusId, `🚀 #${task.id}: выкатываю…`);
  await git(['fetch', 'origin', config.baseBranch], { auth: true });
  const rebase = await run('git', ['rebase', `origin/${config.baseBranch}`]);
  if (rebase.code !== 0) {
    await run('git', ['rebase', '--abort']);
    return fail(`конфликт с ${config.baseBranch}, изменения в ветке: ${branchUrl}`);
  }
  const before = await git(['rev-parse', `origin/${config.baseBranch}`]);
  await git(['push', 'origin', `HEAD:refs/heads/${config.baseBranch}`], { auth: true });
  const sha = await git(['rev-parse', 'HEAD']);

  // Изменения только в боте — деплой игры не запускается (paths-ignore в deploy.yml).
  const files = (await git(['diff', '--name-only', `${before}..${sha}`])).split('\n').filter(Boolean);
  if (files.every((f) => f.startsWith('bot/') || f === '.github/workflows/bot.yml')) {
    task.state = 'done';
    await edit(task.chatId, statusId, `✅ #${task.id}: в main.`);
    return send(
      task.chatId,
      `✅ #${task.id}: изменения бота в main (${repoUrl}/commit/${sha.slice(0, 7)}), деплой игры не нужен — бот перезапустится сам.\n\n${report}${costLine(task)}`,
      { replyTo: task.msgId },
    );
  }

  const deploy = await waitDeploy(sha, (url) => edit(task.chatId, statusId, `🚀 #${task.id}: идёт деплой…\n${url}`));
  const check = deploy.conclusion === 'success' ? await smoke() : { ok: false };
  if (deploy.conclusion === 'success' && check.ok) {
    task.state = 'done';
    await edit(task.chatId, statusId, `✅ #${task.id}: выкачено.`);
    return send(
      task.chatId,
      `✅ #${task.id}: выкачено.\nДеплой: ${deploy.url}\nКоммит: ${repoUrl}/commit/${sha.slice(0, 7)}${
        check.skipped ? '' : `\nПроверка ${config.appUrl}: OK`
      }\n\n${report}${costLine(task)}`,
      { replyTo: task.msgId },
    );
  }

  // Откат: revert своих коммитов в main.
  let rollback = 'откат не выполнен';
  try {
    await git(['fetch', 'origin', config.baseBranch], { auth: true });
    await git(['checkout', '-B', `${task.branch}-revert`, `origin/${config.baseBranch}`]);
    await git(['revert', '--no-edit', `${before}..${sha}`]);
    await git(['push', 'origin', `HEAD:refs/heads/${config.baseBranch}`], { auth: true });
    rollback = 'изменения откатены (revert в main, запущен новый деплой)';
  } catch (e) {
    rollback += `: ${e.message}`;
  }
  const why =
    deploy.conclusion === 'timeout'
      ? 'деплой не завершился вовремя'
      : deploy.conclusion !== 'success'
        ? `деплой завершился: ${deploy.conclusion}`
        : `smoke-проверка ${config.appUrl} не прошла (${check.status})`;
  return fail(`${why}${deploy.url ? `\n${deploy.url}` : ''}\n${rollback}.\nВетка с изменениями: ${branchUrl}`);
}

function costLine(task) {
  return task.cost ? `\n\n💰 ~$${task.cost.toFixed(2)}` : '';
}
