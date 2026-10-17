'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}
