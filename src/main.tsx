import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import App from './App';
import { prepareCloudSave } from './lib/cloudSave';
import './index.css';

// The cloud save (if it should win) is written to localStorage before the stores read it.
void prepareCloudSave().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <TonConnectUIProvider manifestUrl={`${window.location.origin}/tonconnect-manifest.json`} language="ru">
        <App />
      </TonConnectUIProvider>
    </StrictMode>,
  );
});
