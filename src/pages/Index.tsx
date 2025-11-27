import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to dashboard - in production this would check auth first
  return <Navigate to="/dashboard" replace />;
};

export default Index;
