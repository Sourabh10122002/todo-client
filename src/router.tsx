import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from './store/auth';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import Forgot from './pages/Forgot.tsx';
import Reset from './pages/Reset.tsx';
import Todos from './pages/Todos.tsx';

function Protected({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/todos" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot', element: <Forgot /> },
  { path: '/reset', element: <Reset /> },
  { path: '/todos', element: (
      <Protected>
        <Todos />
      </Protected>
    )
  },
]);