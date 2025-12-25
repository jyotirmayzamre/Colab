import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { AuthProvider } from './Auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  
  return (
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
  )
}

export default App
