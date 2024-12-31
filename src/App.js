// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Auth from './auth/Auth';
import AdminDashboard from './admin/Admin-Dashboard';
import StaffDashboard from './staff/Staff-Dashboard';
import SetupPopup from './components/SetupPopup';
import StaffSetupPopup from './components/StaffSetupPopup';
import InventoryPage from './admin/inventory/InventoryPage';
import { getInitialTheme } from './utils/theme';

function App() {
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showStaffSetup, setShowStaffSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());

  const checkSetupStatus = (type) => {
    const key = type === 'admin' ? 'adminSetupCompleted' : 'staffSetupCompleted';
    return !localStorage.getItem(key);
  };

  const handleAdminSetupSubmit = (formData) => {
    localStorage.setItem('adminSetupCompleted', 'true');
    localStorage.setItem('businessSetup', JSON.stringify(formData));
    toast.success('Admin setup completed successfully!', {
      theme: isDarkMode ? 'dark' : 'light',
    });
  };

  const handleStaffSetupSubmit = (formData) => {
    localStorage.setItem('staffSetupCompleted', 'true');
    localStorage.setItem('staffSetup', JSON.stringify(formData));
    toast.success('Staff setup completed successfully!', {
      theme: isDarkMode ? 'dark' : 'light',
    });
  };

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          theme={isDarkMode ? 'dark' : 'light'}
        />

        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/admin/dashboard"
            element={
              <>
                <AdminDashboard
                  onSetupClick={() => setShowAdminSetup(true)}
                />
                <SetupPopup
                  isOpen={showAdminSetup || checkSetupStatus('admin')}
                  onClose={() => setShowAdminSetup(false)}
                  onSubmit={handleAdminSetupSubmit}
                />
              </>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <>
                <StaffDashboard
                  onSetupClick={() => setShowStaffSetup(true)}
                />
                <StaffSetupPopup
                  isOpen={showStaffSetup || checkSetupStatus('staff')}
                  onClose={() => setShowStaffSetup(false)}
                  onSubmit={handleStaffSetupSubmit}
                />
              </>
            }
          />
          <Route path="/admin/inventory" element={<InventoryPage />} />
          <Route path="/staff/inventory" element={<InventoryPage isStaff />} />
          <Route path="/" element={<Auth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;