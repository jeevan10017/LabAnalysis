import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExtractPage from './pages/ExtractPage';
import UploadPage from './pages/UploadPage';
import ExperimentDetailPage from './pages/ExperimentDetailPage';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './hooks/useAuthStore';
import PageLoader from './components/common/PageLoader'; // Use PageLoader
import React from 'react';
// --- NEW ---
import SelectModulePage from './pages/SelectModulePage';

function App() {
  const { loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <PageLoader />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/extract" element={<ExtractPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/experiment/:id"
          element={
            <ProtectedRoute>
              <ExperimentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/module"
          element={
            <ProtectedRoute>
              <SelectModulePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;