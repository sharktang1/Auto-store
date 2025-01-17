// StaffStats.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../libs/firebase-config';

export const StaffStats = ({ isDarkMode }) => {
  const [staffData, setStaffData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['staff', 'staff-admin'])
        );
        const querySnapshot = await getDocs(q);
        const staff = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setStaffData(staff);
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Staff Overview
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Role</th>
              <th className="text-left py-3">Location</th>
              <th className="text-left py-3">Store</th>
            </tr>
          </thead>
          <tbody>
            {staffData.map((staff) => (
              <tr 
                key={staff.id}
                className={`border-t ${
                  isDarkMode 
                    ? 'border-gray-700 text-gray-300' 
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                <td className="py-3">{`${staff.firstName} ${staff.lastName}`}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    staff.role === 'staff-admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {staff.role}
                  </span>
                </td>
                <td className="py-3">{staff.location}</td>
                <td className="py-3">{staff.storeNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};