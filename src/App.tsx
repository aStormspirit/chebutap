import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { BottomNav } from './components/BottomNav';
import { Modals } from './components/Modals';
import { AccountScreen } from './screens/AccountScreen';
import { GameScreen } from './screens/GameScreen';
import { TasksScreen } from './screens/TasksScreen';
import { TownScreen } from './screens/TownScreen';
import { UpgradesScreen } from './screens/UpgradesScreen';
import { useGameStore } from './store/gameStore';
import type { ModalId, TabId } from './types/game';

export default function App() {
  const store = useGameStore();
  const [tab, setTab] = useState<TabId>('earn');
  const [modal, setModal] = useState<ModalId>(null);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#a8c47a');
      WebApp.setBackgroundColor('#a8c47a');
    } catch {
      // browser preview without Telegram
    }
  }, []);

  if (tab === 'earn') {
    return (
      <div className="app-shell app-shell--game">
        <GameScreen
          store={store}
          activeTab={tab}
          onTabChange={setTab}
          onBoost={() => setModal('boost')}
          onShop={() => setModal('shop')}
        />
        <Modals modal={modal} store={store} onClose={() => setModal(null)} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div
        className="bg-doodles"
        aria-hidden
        style={{ backgroundImage: 'url(/figma/bg.png)' }}
      />
      <main className="app-main app-main--panel">
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
      <BottomNav active={tab} onChange={setTab} />
      <Modals modal={modal} store={store} onClose={() => setModal(null)} />
    </div>
  );
}
