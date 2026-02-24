import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './lib/i18n'; // Importar configuración i18n
import App from './App';
import { ConductCatalogProvider } from './context/ConductCatalogContext';
import { TenantProvider } from './context/TenantContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProviderWrapper from './components/ToastProviderWrapper';
import queryClient from './lib/queryClient';

// Keep a stable viewport unit for mobile browsers with dynamic UI bars.
const setAppViewportHeight = () => {
  if (typeof document === 'undefined') return;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty(
    '--app-vh',
    `${viewportHeight * 0.01}px`,
  );
};

if (typeof window !== 'undefined') {
  setAppViewportHeight();
  window.addEventListener('resize', setAppViewportHeight);
  window.visualViewport?.addEventListener('resize', setAppViewportHeight);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProviderWrapper>
        <ErrorBoundary>
          <TenantProvider>
            <ConductCatalogProvider>
              <App />
            </ConductCatalogProvider>
          </TenantProvider>
        </ErrorBoundary>
      </ToastProviderWrapper>
    </QueryClientProvider>
  </StrictMode>,
);
