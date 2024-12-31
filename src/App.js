// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Auth from './auth/Auth';
import Dashboard from './admin/Admin-Dashboard';
import SetupPopup from './components/SetupPopup';
import InventoryPage from './admin/inventory/InventoryPage';

function App() {
  const [showSetup, setShowSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const checkSetupStatus = () => {
    const hasCompletedSetup = localStorage.getItem('hasCompletedSetup');
    return !hasCompletedSetup;
  };

  const handleSetupSubmit = (formData) => {
    localStorage.setItem('hasCompletedSetup', 'true');
    localStorage.setItem('businessSetup', JSON.stringify(formData));
    
    toast.success('Setup completed successfully! Welcome to AutoStore.', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: isDarkMode ? 'dark' : 'light',
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? 'dark' : 'light'}
        />

        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <>
                <Dashboard
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  onSetupClick={() => setShowSetup(true)}
                />
                <SetupPopup
                  isOpen={showSetup || checkSetupStatus()}
                  onClose={() => setShowSetup(false)}
                  onSubmit={handleSetupSubmit}
                  isDarkMode={isDarkMode}
                />
              </>
            }
          />
          <Route
            path="/admin/inventory"
            element={<InventoryPage />}
          />
          <Route path="/" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;