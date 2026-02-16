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
