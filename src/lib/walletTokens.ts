// Reads TON and jetton balances of the connected wallet via the public TonAPI.
// Testnet wallets (TON Connect chain "-3") are read from testnet.tonapi.io.

export const TESTNET_CHAIN = '-3';

export type WalletToken = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  balance: string; // human-readable amount
  isNative?: boolean;
};

type JettonBalance = {
  balance: string;
  jetton: { address: string; name?: string; symbol?: string; decimals?: number; image?: string };
};

const FOODFI_MASTER = (import.meta.env.VITE_FOODFI_JETTON_MASTER as string | undefined)?.trim();

function apiBase(chain: string) {
  return chain === TESTNET_CHAIN ? 'https://testnet.tonapi.io/v2' : 'https://tonapi.io/v2';
}

export function formatUnits(raw: string, decimals: number): string {
  let value: bigint;
  try {
    value = BigInt(raw);
  } catch {
    return '0';
  }
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '');
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction ? `${wholeText},${fraction}` : wholeText;
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`TonAPI ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchWalletTokens(address: string, chain: string, signal: AbortSignal): Promise<WalletToken[]> {
  const base = apiBase(chain);
  const id = encodeURIComponent(address);
  const [account, jettons] = await Promise.all([
    getJson<{ balance: number | string }>(`${base}/accounts/${id}`, signal),
    getJson<{ balances: JettonBalance[] }>(`${base}/accounts/${id}/jettons`, signal),
  ]);

  const ton: WalletToken = {
    id: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    balance: formatUnits(String(account.balance ?? 0), 9),
    isNative: true,
  };

  return [
    ton,
    ...(jettons.balances ?? []).map(({ balance, jetton }) => ({
      id: jetton.address,
      name: jetton.name || jetton.symbol || 'Токен',
      symbol: jetton.symbol || '?',
      image: jetton.image,
      balance: formatUnits(balance, jetton.decimals ?? 9),
    })),
  ];
}

export function isFoodFi(token: WalletToken): boolean {
  if (FOODFI_MASTER) return token.id.toLowerCase() === FOODFI_MASTER.toLowerCase();
  return /food\s*-?\s*fi/i.test(token.symbol) || /food\s*-?\s*fi/i.test(token.name);
}
