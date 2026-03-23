import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignUp from './pages/Manager/SignUp.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';




const queryClient = new QueryClient();

const router= createBrowserRouter([

  {
    path: "/",
    element: <App/>,
    children:[
      {
        path: "signup",
        element: <SignUp/>
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
