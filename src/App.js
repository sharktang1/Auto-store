// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './libs/firebase-config';

import Auth from './auth/Auth';
import AdminDashboard from './admin/Admin-Dashboard';
import StaffDashboard from './staff/Staff-Dashboard';
import SetupPopup from './components/SetupPopup';
import StaffSetupPopup from './components/StaffSetupPopup';

// Admin imports
import AdminInventory from './admin/inventory/AdminInventory';
import AdminSales from './admin/sales/AdminSales';
import AdminStats from './admin/stats/AdminStats';
import AdminStaff from './admin/staff/AdminStaff';

// Staff imports
import StaffInventory from './staff/inventory/StaffInventory';
import StaffSales from './staff/sales/StaffSales';
import StaffStats from './staff/stats/StaffStats';
import Stafflender from './staff/KOPA/stafflender';
import Staffreturns from './staff/Returns/staffreturns';


import { getInitialTheme } from './utils/theme';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/auth');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return children;
};

function App() {
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [showStaffSetup, setShowStaffSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);

            // Check for admin setup
            if (userData.role === 'admin') {
              const businessDoc = await getDoc(doc(db, 'businesses', user.uid));
              if (!businessDoc.exists()) {
                setShowAdminSetup(true);
              }
            }
            
            // Check for staff setup
            if (userData.role === 'staff' && !userData.location) {
              setShowStaffSetup(true);
            }
          } else {
            // New user - initialize as admin and show setup
            await setDoc(doc(db, 'users', user.uid), {
              role: 'admin',
              email: user.email,
              createdAt: new Date().toISOString()
            });
            setUserRole('admin');
            setShowAdminSetup(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Error loading user data');
        }
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdminSetupSubmit = async (formData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, 'businesses', user.uid), {
        ...formData,
        createdAt: new Date().toISOString()
      });

      setShowAdminSetup(false);
      toast.success('Setup completed successfully!');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Setup failed. Please try again.');
    }
  };

  const handleStaffSetupSubmit = async (formData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, 'users', user.uid), {
        location: formData.location,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setShowStaffSetup(false);
      toast.success('Staff setup completed successfully!');
    } catch (error) {
      console.error('Staff setup error:', error);
      toast.error('Staff setup failed');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          theme={isDarkMode ? 'dark' : 'light'}
        />
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Auth />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
                <SetupPopup
                  isOpen={showAdminSetup}
                  onClose={() => setShowAdminSetup(false)}
                  onSubmit={handleAdminSetupSubmit}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
          <Route path="/admin/sales" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute><AdminStaff /></ProtectedRoute>} />

          {/* Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute>
                <StaffDashboard />
                <StaffSetupPopup
                  isOpen={showStaffSetup}
                  onClose={() => setShowStaffSetup(false)}
                  onSubmit={handleStaffSetupSubmit}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/staff/inventory" element={<ProtectedRoute><StaffInventory /></ProtectedRoute>} />
          <Route path="/staff/sales" element={<ProtectedRoute><StaffSales /></ProtectedRoute>} />
          <Route path="/staff/stats" element={<ProtectedRoute><StaffStats /></ProtectedRoute>} />
          <Route path="/staff/KOPA" element={<ProtectedRoute><Stafflender /></ProtectedRoute>} />
          <Route path="/staff/Returns" element={<ProtectedRoute><Staffreturns /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;