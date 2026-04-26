import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';

// Import Pages
import LoginPage from './pages/LoginPage';
import CustomerSelect from './pages/CustomerSelect';
import DispatchBoard from './pages/DispatchBoard';
import DispatchScreen from './pages/DispatchScreen';
import AdminPage from './pages/AdminPage'; // NEW

// Import Auth Hooks
import { useAuth } from './hooks/useAuth';

/**
 * ProtectedRoute Component
 * Handles the "Loading" state to prevent the "Refresh -> Login" bug.
 */
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh" 
        backgroundColor="#1B1B4B" // Changed to match dark theme
      >
        <CircularProgress sx={{ color: '#78BE20' }} />
      </Box>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* --- Public Route --- */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <LoginPage />} 
          />

          {/* --- Protected Routes --- */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  {/* Home: Customer Selection */}
                  <Route index element={<CustomerSelect />} />
                  
                  {/* Dispatch Board list */}
                  <Route path="dispatches" element={<DispatchBoard />} />
                  
                  {/* Specific Dispatch Scanning (Singular path) */}
                  <Route path="dispatch/:id/*" element={<DispatchScreen />} />
                  
                  {/* Admin Panel - Only accessible if role is admin */}
                  <Route 
                    path="admin" 
                    element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />} 
                  />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
