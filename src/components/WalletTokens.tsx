import { useCallback, useEffect, useState } from 'react';
import { useIsConnectionRestored, useTonWallet } from '@tonconnect/ui-react';
import { WalletConnect } from './WalletConnect';
import { fetchWalletTokens, isFoodFi, TESTNET_CHAIN, type WalletToken } from '../lib/walletTokens';

type LoadResult = { key: string; ok: boolean; tokens: WalletToken[] };

function TokenIcon({ token, large }: { token: WalletToken; large?: boolean }) {
  const [broken, setBroken] = useState(false);
  const className = `wallet-token__icon${large ? ' wallet-token__icon--large' : ''}`;
  if (token.image && !broken) {
    return <img className={className} src={token.image} alt="" onError={() => setBroken(true)} />;
  }
  return (
    <span className={className} aria-hidden>
      {token.isNative ? '◈' : token.symbol.slice(0, 1)}
    </span>
  );
}

export function WalletTokens() {
  const wallet = useTonWallet();
  const restored = useIsConnectionRestored();
  const address = wallet?.account.address;
  const chain = wallet?.account.chain ?? '';
  const [result, setResult] = useState<LoadResult>({ key: '', ok: true, tokens: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const requestKey = address ? `${chain}:${address}:${reloadKey}` : '';

  useEffect(() => {
    if (!address) return;
    const controller = new AbortController();
    fetchWalletTokens(address, chain, controller.signal)
      .then((tokens) => setResult({ key: requestKey, ok: true, tokens }))
      .catch(() => {
        if (!controller.signal.aborted) setResult((prev) => ({ key: requestKey, ok: false, tokens: prev.tokens }));
      });
    return () => controller.abort();
  }, [address, chain, requestKey]);

  const status = result.key !== requestKey ? 'loading' : result.ok ? 'ready' : 'error';
  const sameWallet = Boolean(address) && result.key.startsWith(`${chain}:${address}:`);
  const load = { status, tokens: sameWallet ? result.tokens : [] };

  if (!restored) return <p className="panel-sub">Восстановление кошелька…</p>;

  if (!address) {
    return (
      <div className="wallet-empty">
        <p className="panel-sub">Подключите кошелёк, чтобы увидеть токены.</p>
        <div className="wallet-empty__connect">
          <WalletConnect />
        </div>
      </div>
    );
  }

  const foodFi = load.tokens.find(isFoodFi);
  const others = load.tokens.filter((token) => token !== foodFi);
  const loading = load.status === 'loading' && load.tokens.length === 0;

  return (
    <div className="wallet-tab">
      <div className="wallet-hero">
        <span className="wallet-hero__label">FoodFI</span>
        {foodFi && <TokenIcon token={foodFi} large />}
        <strong className="wallet-hero__amount">{loading ? '…' : foodFi?.balance ?? '0'}</strong>
        <span className="wallet-hero__symbol">{foodFi?.symbol ?? 'FoodFI'}</span>
        {load.status === 'ready' && !foodFi && <p className="wallet-hero__hint">Токена FoodFI на кошельке пока нет</p>}
      </div>

      <div className="wallet-tab__head">
        <span className="panel-sub">
          {chain === TESTNET_CHAIN ? 'Testnet' : 'Mainnet'} · {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button type="button" className="wallet-refresh" onClick={reload} disabled={load.status === 'loading'}>
          {load.status === 'loading' ? 'Загрузка…' : 'Обновить'}
        </button>
      </div>

      {load.status === 'error' && (
        <p className="wallet-error" role="alert">Не удалось загрузить токены. Попробуйте обновить.</p>
      )}

      {loading ? (
        <p className="panel-sub">Загружаем токены…</p>
      ) : (
        <ul className="stats-list wallet-list">
          {others.map((token) => (
            <li key={token.id} className="wallet-token">
              <TokenIcon token={token} />
              <span className="wallet-token__name">{token.name}</span>
              <strong className="wallet-token__amount">
                {token.balance} <small>{token.symbol}</small>
              </strong>
            </li>
          ))}
          {load.status === 'ready' && others.length === 0 && <li>Других токенов нет</li>}
        </ul>
      )}
    </div>
  );
}
