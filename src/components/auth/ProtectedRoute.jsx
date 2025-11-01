import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import Spinner from '../common/Spinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page
    // after they login, which is a nicer user experience.
    return <Navigate to="/login" replace />;
  }

  return children;
}