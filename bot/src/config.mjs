// Настройки бота читаются из переменных окружения (см. bot/.env.example).
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean).map(Number);

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Не задана переменная окружения ${name}`);
    process.exit(1);
  }
  return v;
}

export const config = {
  telegramToken: required('TELEGRAM_BOT_TOKEN'),
  allowedUserIds: list(required('BOT_ALLOWED_USER_IDS')),
  allowedChatIds: list(process.env.BOT_ALLOWED_CHAT_IDS),
  githubToken: required('BOT_GITHUB_TOKEN'),
  githubRepo: process.env.GITHUB_REPO || 'aStormspirit/chebutap',
  baseBranch: process.env.BASE_BRANCH || 'main',
  deployWorkflow: process.env.DEPLOY_WORKFLOW || 'deploy.yml',
  appUrl: process.env.APP_URL || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-opus-5-5',
  workDir: process.env.WORK_DIR || '/home/node/work',
  taskTimeoutMin: Number(process.env.TASK_TIMEOUT_MIN || 60),
  deployTimeoutMin: Number(process.env.DEPLOY_TIMEOUT_MIN || 25),
};

if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
  console.error('Нужен ANTHROPIC_API_KEY или CLAUDE_CODE_OAUTH_TOKEN');
  process.exit(1);
}
