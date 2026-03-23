import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App, { GuestRoute, ProtectedRoute } from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store.ts';

import Temp from './pages/common/Temp.tsx';
import SignUp from './pages/common/SignUp.tsx';
import Login from './pages/common/Login.tsx';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path:'/',
        element: (
          <ProtectedRoute>
            <Temp/>
          </ProtectedRoute>
        )
      },
      {
        path: 'signup',
        element: (
          <GuestRoute>
            <SignUp />
          </GuestRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
