import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';

// Import Pages
import LoginPage from './pages/LoginPage';
import CustomerSelect from './pages/CustomerSelect';
import DispatchBoard from './pages/DispatchBoard';
import DispatchScreen from './pages/DispatchScreen';

// Import Auth Hooks
import { useAuth } from './hooks/useAuth';

/**
 * ProtectedRoute Component
 * This wrapper prevents unauthenticated users from accessing specific pages.
 * It now handles the "Loading" state to prevent the "Refresh -> Login" bug.
 */
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  // 1. If the system is still checking for a token in localStorage, 
  // show a loading spinner instead of redirecting.
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh" 
        backgroundColor="#F5F5F5"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // 2. Once loading is finished, if no user is found, redirect to login.
  // If a user is found, render the children (the page).
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
          {/* If user is already logged in and tries to go to /login, 
              redirect them to the home page. */}
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
                  {/* The Root route (/) shows the Customer Selection screen */}
                  <Route index element={<CustomerSelect />} />
                  
                  {/* The Dispatch Board list */}
                  <Route path="dispatches" element={<DispatchBoard />} />
                  
                  {/* The specific Dispatch Scanning screen */}
                  <Route path="dispatch/:id/*" element={<DispatchScreen />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
