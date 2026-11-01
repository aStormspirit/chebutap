import { isWalletInfoRemote } from '@tonconnect/ui-react';
import type { ITonConnect } from '@tonconnect/ui-react';

/** Build the request with TON Connect, but let Telegram open its own Mini App. */
export async function connectTelegramWallet(
  connector: ITonConnect,
  openTelegramLink: (url: string) => void,
  signal: AbortSignal,
) {
  const wallets = await connector.getWallets();
  signal.throwIfAborted();
  const wallet = wallets.find((item) => item.appName === 'telegram-wallet' && isWalletInfoRemote(item));
  if (!wallet || !isWalletInfoRemote(wallet)) {
    throw new Error('Walt is unavailable');
  }

  const link = connector.connect({ universalLink: wallet.universalLink, bridgeUrl: wallet.bridgeUrl }, undefined, { signal });
  const url = new URL(link);
  if (url.protocol !== 'https:' || url.hostname !== 't.me') {
    throw new Error('Wallet did not provide a Telegram link');
  }
  openTelegramLink(link);
}
