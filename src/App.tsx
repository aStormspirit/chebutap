import { useEffect, useState } from 'react';
import { WebApp } from './lib/telegram';
import { trackVisit } from './lib/trackVisit';
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
  useEnergyReminder(store.state);

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
