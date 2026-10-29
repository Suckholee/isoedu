'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import {GrowthIntakeProvider} from '../context/GrowthIntakeContext';
import ErrorBoundary from './ErrorBoundary';

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GrowthIntakeProvider>{children}</GrowthIntakeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
