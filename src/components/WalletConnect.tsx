import { useEffect, useRef, useState } from 'react';
import { useIsConnectionRestored, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { WebApp } from '../lib/telegram';
import { connectTelegramWallet } from '../lib/connectTelegramWallet';

export function WalletConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const restored = useIsConnectionRestored();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const pendingConnection = useRef<AbortController | null>(null);

  useEffect(() => tonConnectUI.onStatusChange((wallet) => {
    if (wallet) pendingConnection.current = null;
    setError('');
    setDetailsOpen(false);
  }, () => setError('Не удалось подключить кошелёк. Попробуйте ещё раз.')), [tonConnectUI]);

  useEffect(() => () => {
    if (!tonConnectUI.connector.connected) pendingConnection.current?.abort();
  }, [tonConnectUI]);

  const handleClick = async () => {
    setError('');
    setBusy(true);
    try {
      if (address) {
        setDetailsOpen(!detailsOpen);
      } else if (WebApp.initData || WebApp.platform !== 'unknown') {
        // TON UI's environment heuristics can choose an external browser here.
        // Use the initialized Telegram API directly; never fall back outside Telegram.
        if (!WebApp.isVersionAtLeast('6.1')) throw new Error('Telegram needs an update');
        pendingConnection.current?.abort();
        const attempt = new AbortController();
        pendingConnection.current = attempt;
        await connectTelegramWallet(tonConnectUI.connector, (link) => WebApp.openTelegramLink(link), attempt.signal);
      } else {
        await tonConnectUI.openModal();
      }
    } catch {
      if (!tonConnectUI.connector.connected) pendingConnection.current?.abort();
      setError(address ? 'Не удалось отключить кошелёк. Попробуйте ещё раз.' : 'Не удалось открыть подключение. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="gs-wallet"
        onClick={handleClick}
        disabled={!restored || busy}
        title={address || undefined}
        aria-expanded={address ? detailsOpen : undefined}
        aria-label={address ? `Кошелёк ${address} подключён. Показать подробности` : 'Подключить DeFi Wallet'}
      >
        <span className="gs-wallet__icon" aria-hidden="true">◈</span>
        <span>{!restored ? 'Восстановление…' : address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Подключить DeFi Wallet'}</span>
        <span className="gs-wallet__arrow" aria-hidden="true">{address ? '⌄' : '↗'}</span>
      </button>
      {address && detailsOpen && (
        <div className="gs-wallet-details">
          <strong>Кошелёк подключён</strong>
          <p className="gs-wallet-details__address">{address}</p>
          <button type="button" disabled={busy} onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await tonConnectUI.disconnect();
              setDetailsOpen(false);
            } catch {
              setError('Не удалось отключить кошелёк. Попробуйте ещё раз.');
            } finally {
              setBusy(false);
            }
          }}>Отключить</button>
        </div>
      )}
      {error && <div className="gs-wallet-hint" role="alert">{error}</div>}
    </>
  );
}
