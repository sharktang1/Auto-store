import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './auth/Auth';
import Dashboard from './admin/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;