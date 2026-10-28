import { TASKS } from '../data/content';
import { CoinIcon } from '../components/icons';
import { formatNumber } from '../lib/format';
import type { GameStore } from '../store/gameStore';

type Props = { store: GameStore };

export function TasksScreen({ store }: Props) {
  const { state, claimTask, markInvite } = store;

  return (
    <section className="panel-screen">
      <h2 className="panel-title">Задания</h2>
      <p className="panel-sub">Выполняй и забирай монеты</p>
      <ul className="card-list">
        {TASKS.map((task) => {
          const done = state.completedTasks.includes(task.id);
          const progress = state.taskProgress[task.id] ?? 0;
          const ready = !done && progress >= task.target;
          return (
            <li key={task.id} className="game-card">
              <div className="game-card__main">
                <strong>{task.title}</strong>
                <span className="game-card__meta">
                  {Math.min(progress, task.target)}/{task.target}
                </span>
                <div className="progress-track">
                  <div
                    className="progress-track__fill"
                    style={{ width: `${Math.min(100, (progress / task.target) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="game-card__side">
                <span className="reward">
                  <CoinIcon className="reward__icon" />
                  {formatNumber(task.reward)}
                </span>
                {task.type === 'invite' && !done && (
                  <button type="button" className="btn btn--wood" onClick={markInvite}>
                    Пригласить
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--green"
                  disabled={!ready}
                  onClick={() => claimTask(task.id)}
                >
                  {done ? 'Готово' : ready ? 'Забрать' : 'В процессе'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
