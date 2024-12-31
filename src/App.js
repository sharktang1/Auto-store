import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Auth from './auth/Auth';
import Dashboard from './admin/Dashboard';
import SetupPopup from './components/SetupPopup';

function App() {
  const [showSetup, setShowSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if it's the user's first visit
  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem('hasCompletedSetup');
    if (!hasCompletedSetup) {
      setShowSetup(true);
    }
  }, []);

  const handleSetupSubmit = (formData) => {
    // Handle the setup data
    localStorage.setItem('hasCompletedSetup', 'true');
    localStorage.setItem('businessSetup', JSON.stringify(formData));
    
    // Show success message
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

        <SetupPopup
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
          onSubmit={handleSetupSubmit}
          isDarkMode={isDarkMode}
        />

        <Routes>
          <Route 
            path="/auth" 
            element={<Auth />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme}
                onSetupClick={() => setShowSetup(true)}
              />
            } 
          />
          <Route 
            path="/" 
            element={<Auth />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;