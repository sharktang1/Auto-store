import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldOff,
  Trash2, 
  Search,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../libs/firebase-config';
import Navbar from '../../components/Navbar';
import { getInitialTheme, initializeThemeListener } from '../../utils/theme';
import { toast } from 'react-toastify';

// Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, description, confirmText, confirmColor }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{description}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${confirmColor}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const AdminStaffPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [staffMembers, setStaffMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const fetchStaffMembers = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      const q = query(
        collection(db, 'users'),
        where('businessId', '==', currentUser.uid),
        where('role', 'in', ['staff', 'staff-admin'])
      );

      const querySnapshot = await getDocs(q);
      const staff = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaffMembers(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    }
  };

  useEffect(() => {
    const cleanup = initializeThemeListener(setIsDarkMode);
    fetchStaffMembers();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      await deleteDoc(doc(db, 'users', selectedStaff.id));
      setStaffMembers(prev => prev.filter(staff => staff.id !== selectedStaff.id));
      toast.success('Staff member removed successfully');
      setShowDeleteModal(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to remove staff member');
    }
  };

  const handleToggleRole = async () => {
    if (!selectedStaff) return;

    const newRole = selectedStaff.role === 'staff' ? 'staff-admin' : 'staff';
    const actionText = newRole === 'staff-admin' ? 'promoted to admin' : 'changed to staff';

    try {
      const staffRef = doc(db, 'users', selectedStaff.id);
      await updateDoc(staffRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      setStaffMembers(prev => prev.map(staff => 
        staff.id === selectedStaff.id 
          ? { ...staff, role: newRole }
          : staff
      ));

      toast.success(`Staff member ${actionText} successfully`);
      setShowRoleModal(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Error updating staff role:', error);
      toast.error(`Failed to update staff member's role`);
    }
  };

  const filteredStaff = staffMembers.filter(staff => 
    staff.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Staff Management
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className={`flex items-center px-4 py-2 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <Search className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
            <input
              type="text"
              placeholder="Search staff by name, email, or location..."
              className={`ml-2 w-full bg-transparent border-none focus:outline-none ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Staff List */}
        <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Staff Member</th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Location</th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Role</th>
                  <th className={`px-6 py-3 text-left text-sm font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className={`border-b last:border-b-0 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                          {staff.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{staff.username}</p>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {staff.location}
                    </td>
                    <td className={`px-6 py-4`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staff.role === 'staff-admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {staff.role === 'staff-admin' ? 'Staff Admin' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-full"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowRoleModal(true);
                          }}
                        >
                          {staff.role === 'staff' ? <Shield size={20} /> : <ShieldOff size={20} />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 size={20} />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteStaff}
          title="Remove Staff Member"
          description={`Are you sure you want to remove ${selectedStaff?.username}? This action cannot be undone.`}
          confirmText="Remove"
          confirmColor="bg-red-500 hover:bg-red-600"
        />

        {/* Role Toggle Modal */}
        <ConfirmationModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          onConfirm={handleToggleRole}
          title={`${selectedStaff?.role === 'staff' ? 'Promote to Admin' : 'Change to Staff'}`}
          description={`Are you sure you want to ${
            selectedStaff?.role === 'staff' 
              ? 'promote ' + selectedStaff?.username + ' to Staff Admin? They will have additional permissions to manage inventory and view reports.'
              : 'change ' + selectedStaff?.username + ' to Staff role? They will have reduced permissions.'
          }`}
          confirmText={selectedStaff?.role === 'staff' ? 'Promote' : 'Change Role'}
          confirmColor={selectedStaff?.role === 'staff' 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-blue-500 hover:bg-blue-600'}
        />
      </div>
    </div>
  );
};

export default AdminStaffPage;