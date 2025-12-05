import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Coverage from './pages/Coverage';
import Generation from './pages/Generation';
import ContentHub from './pages/ContentHub';

function App() {
  const isAuthenticated = localStorage.getItem('admin_token');

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<Login />} />
          
          <Route
            path="/admin/*"
            element={
              isAuthenticated ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/coverage" element={<Coverage />} />
                    <Route path="/generation" element={<Generation />} />
                    <Route path="/content" element={<ContentHub />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;