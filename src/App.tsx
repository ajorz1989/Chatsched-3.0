import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { useAuthStore } from './stores/auth-store';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { AppLayout } from './components/layout/AppLayout'; // Your sidebar/header wrapper

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Campaigns from './pages/Campaigns';
// ... import other pages

function AppContent() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize the auth listener once on mount
    const listener = initialize();
    // Cleanup listener on unmount
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, [initialize]);

  return (
    <Routes>
      {/* Public Routes (No Auth Required) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes (Auth Required) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Campaigns />} />
          <Route path="/campaigns" element={<Campaigns />} />
          {/* Add all other private pages here */}
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryProvider>
  );
}
