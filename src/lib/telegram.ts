import TwaSdk from '@twa-dev/sdk';

type TelegramWebApp = typeof TwaSdk;

/**
 * `@twa-dev/sdk` is CommonJS with `exports.default`; Vite/Rolldown import it in Node
 * interop mode, so the default import is `{ default: WebApp }` instead of WebApp itself.
 */
const sdk = TwaSdk as TelegramWebApp & { default?: TelegramWebApp };
export const WebApp: TelegramWebApp = sdk.default ?? sdk;
