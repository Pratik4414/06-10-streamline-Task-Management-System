
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- Import the custom hook

const ProtectedRoute = ({ children }) => {
  const { token, isLoading } = useAuth(); // <-- Get token from context

  // While the context is checking local storage, we can show a loading state
  if (isLoading) {
    return <div>Loading application...</div>;
  }

  // If loading is finished and there's still no token, redirect to login
  if (!token) {
    return <Navigate to="/" />;
  }
  
  // If a token exists, render the page
  return children;
};

export default ProtectedRoute;