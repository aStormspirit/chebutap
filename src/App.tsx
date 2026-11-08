import { useEffect, useState } from 'react';
import { WebApp } from './lib/telegram';
import { trackVisit } from './lib/trackVisit';
import { startCloudSync } from './lib/cloudSave';
import { useEnergyReminder } from './lib/energyReminder';
import { GameNav } from './components/GameNav';
import { Modals } from './components/Modals';
import { AccountScreen } from './screens/AccountScreen';
import { GameScreen } from './screens/GameScreen';
import { TasksScreen } from './screens/TasksScreen';
import { TownScreen } from './screens/TownScreen';
import { UpgradesScreen } from './screens/UpgradesScreen';
import { useGameStore } from './store/gameStore';
import { useKitchen } from './store/kitchenStore';
import type { ModalId, TabId } from './types/game';

export default function App() {
  const store = useGameStore();
  const kitchen = useKitchen();
  const [tab, setTab] = useState<TabId>('earn');
  const [modal, setModal] = useState<ModalId>(null);
  const [foodOpen, setFoodOpen] = useState(false);
  const [seenResetId, setSeenResetId] = useState(store.resetId);
  // Progress reset: start over like a new player — empty kitchen, café screen, fresh scene and tutorial.
  if (seenResetId !== store.resetId) {
    setSeenResetId(store.resetId);
    kitchen.reset();
    setTab('earn');
    setFoodOpen(false);
  }
  useEnergyReminder(store.state);
  // After the stores' effects, so on hide the stores write localStorage before the upload reads it.
  useEffect(() => startCloudSync(), []);

  /** The «Еда» nav button opens the food menu over the restaurant; a second press closes it. */
  const handleTab = (next: TabId) => {
    if (next === 'earn') {
      setFoodOpen((open) => (tab === 'earn' ? !open : true));
    } else {
      setFoodOpen(false);
    }
    setTab(next);
  };

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#a8c47a');
      WebApp.setBackgroundColor('#a8c47a');
    } catch {
      // browser preview without Telegram
    }
    trackVisit();
  }, []);

  if (tab === 'earn') {
    return (
      <div className="app-shell app-shell--game">
        <GameScreen
          key={store.resetId}
          store={store}
          kitchen={kitchen}
          activeTab={tab}
          onTabChange={handleTab}
          foodOpen={foodOpen}
          onFoodClose={() => setFoodOpen(false)}
          onBoost={() => setModal('boost')}
          onShop={() => setModal('shop')}
          onSettings={() => setModal('settings')}
        />
        <Modals modal={modal} store={store} onClose={() => setModal(null)} />
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--game">
      <div className="game-screen game-screen--panel">
        <div className="game-screen__bg" aria-hidden />
        <main className="gs-panel">
          <button
            type="button"
            className="gs-square gs-panel__close"
            onClick={() => {
              setFoodOpen(false);
              setTab('earn');
            }}
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M3 3L15 15M15 3L3 15" stroke="#4a2208" strokeWidth="5" strokeLinecap="round" />
              <path d="M3 3L15 15M15 3L3 15" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </button>
          {tab === 'tasks' && <TasksScreen store={store} />}
          {tab === 'town' && <TownScreen store={store} />}
          {tab === 'upgrades' && <UpgradesScreen store={store} />}
          {tab === 'account' && (
            <AccountScreen
              store={store}
              onShop={() => setModal('shop')}
              onSettings={() => setModal('settings')}
            />
          )}
        </main>
        <GameNav active={tab} onChange={handleTab} />
      </div>
      <Modals modal={modal} store={store} onClose={() => setModal(null)} />
    </div>
  );
}
