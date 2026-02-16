import { useEffect } from 'react';
import { subscribeAuthChanges, unsubscribeAuthChanges } from './api/supabaseClient';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { RequireAuth } from './components/RequireAuth';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const CasosActivos = lazy(() => import('./pages/CasosActivos'));
const CasosCerrados = lazy(() => import('./pages/CasosCerrados'));
const SeguimientoPage = lazy(() => import('./pages/SeguimientoPage'));
const SeguimientoWrapper = lazy(() => import('./pages/SeguimientoWrapper'));
const CierreCasoPage = lazy(() => import('./pages/CierreCasoPage'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const AlertasPlazos = lazy(() => import('./pages/AlertasPlazos'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function PageLoader() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-slate-200 rounded-full w-16" />
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    subscribeAuthChanges((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sb-auth-token');
      }
    });
    return () => {
      unsubscribeAuthChanges();
    };
  }, []);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
              <Route
                path="/login"
                element={
                  <RequireAuth invert redirectTo="/">
                    <Login />
                  </RequireAuth>
                }
              />

              <Route
                element={
                  <RequireAuth redirectTo="/login">
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/casos-activos"
                  element={
                    <ErrorBoundary>
                      <CasosActivos />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/casos-cerrados"
                  element={
                    <ErrorBoundary>
                      <CasosCerrados />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/seguimientos"
                  element={
                    <ErrorBoundary>
                      <SeguimientoWrapper />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/seguimientos/:caseId"
                  element={
                    <ErrorBoundary>
                      <SeguimientoPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/cierre-caso/:caseId"
                  element={
                    <ErrorBoundary>
                      <CierreCasoPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/estadisticas"
                  element={
                    <ErrorBoundary>
                      <Estadisticas />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/alertas"
                  element={
                    <ErrorBoundary>
                      <AlertasPlazos />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ErrorBoundary>
                      <AdminPanel />
                    </ErrorBoundary>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
