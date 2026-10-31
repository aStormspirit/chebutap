import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'

function walletManifest(appUrl?: string): Plugin {
  const manifest = (origin: string) => JSON.stringify({
    url: origin,
    name: 'ЧебуТап',
    iconUrl: `${origin}/figma/tap-coin-clean.png`,
  });
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.split('?')[0] !== '/tonconnect-manifest.json') return next();
    const origin = appUrl || `http://${req.headers.host}`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(manifest(origin));
  };
  return {
    name: 'wallet-manifest',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
    generateBundle() {
      if (appUrl) this.emitFile({ type: 'asset', fileName: 'tonconnect-manifest.json', source: manifest(appUrl) });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const configuredUrl = loadEnv(mode, process.cwd(), 'VITE_APP_URL').VITE_APP_URL;
  const appUrl = configuredUrl ? new URL(configuredUrl).origin : undefined;
  if (appUrl && !appUrl.startsWith('https://')) throw new Error('VITE_APP_URL must use HTTPS');
  return { plugins: [react(), walletManifest(appUrl)] };
})
