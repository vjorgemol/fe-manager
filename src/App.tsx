
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Companies } from './pages/Companies';
import { Placements } from './pages/Placements';
import { Communications } from './pages/Communications';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Tools } from './pages/Tools';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <DataProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="companies" element={<Companies />} />
              <Route path="placements" element={<Placements />} />
              <Route path="communications" element={<Communications />} />
              <Route path="tools" element={<Tools />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
