import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';


import SignUp from './pages/common/SignUp.tsx';
import Login from './pages/common/Login.tsx';




const queryClient = new QueryClient();

const router= createBrowserRouter([

  {
    path: "/",
    element: <App/>,
    children:[
      {
        path: "signup",
        element: <SignUp/>
      },
      {
        path: "login",
        element: <Login/>
      }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
       <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
