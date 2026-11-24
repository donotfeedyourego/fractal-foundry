import { Component, lazy, ReactNode, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/Auth';
import { Layout } from './components/Layout';
import { Spinner, Button } from './components/ui';
import { usePrefs } from './lib/prefs';
import AuthPage from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';

const Hypnosis = lazy(() => import('./pages/Hypnosis'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const Generator = lazy(() => import('./pages/Generator'));
const Mind = lazy(() => import('./pages/Mind'));
const Academy = lazy(() => import('./pages/Academy'));
const Wealth = lazy(() => import('./pages/Wealth'));
const Journal = lazy(() => import('./pages/Journal'));
const Goals = lazy(() => import('./pages/Goals'));
const Mentor = lazy(() => import('./pages/Mentor'));
const Progress = lazy(() => import('./pages/Progress'));
const Routine = lazy(() => import('./pages/Routine'));
const Settings = lazy(() => import('./pages/Settings'));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div className="card p-6 max-w-lg mx-auto mt-10 text-center">
        <h2 className="text-2xl mb-2">Something went wrong</h2>
        <p className="text-muted text-sm mb-4">{this.state.error.message}</p>
        <Button onClick={() => { this.setState({ error: null }); location.hash = '#/'; }}>Return home</Button>
      </div>
    );
    return this.props.children;
  }
}

function ScrollTop() { const { pathname } = useLocation(); useEffect(() => { window.scrollTo(0, 0); }, [pathname]); return null; }

export default function App() {
  const { ready, mode } = useAuth();
  const { prefs, loading } = usePrefs();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme !== 'light');
    try { localStorage.setItem('lm.theme', prefs.theme); } catch { /* */ }
  }, [prefs.theme]);

  if (!ready) return <Spinner label="Starting" />;
  if (mode === 'none') return <AuthPage />;
  if (loading) return <Spinner label="Loading your workspace" />;
  if (!prefs.onboarded) return <Onboarding />;

  return (
    <Layout>
      <ScrollTop />
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hypnosis" element={<Hypnosis />} />
            <Route path="/hypnosis/session/:id" element={<SessionPage />} />
            <Route path="/hypnosis/generate" element={<Generator />} />
            <Route path="/mind/*" element={<Mind />} />
            <Route path="/academy/*" element={<Academy />} />
            <Route path="/wealth" element={<Wealth />} />
            <Route path="/journal/*" element={<Journal />} />
            <Route path="/goals/*" element={<Goals />} />
            <Route path="/mentor" element={<Mentor />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/routine" element={<Routine />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
