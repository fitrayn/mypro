import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAmount, setWalletAmount] = useState(100);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      // Ensure we have valid data
      const usersData = Array.isArray(response.data?.users) ? response.data.users : [];
      setUsers(usersData);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('فشل في تحميل المستخدمين');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateWallet = async (userId, amount, action = 'add') => {
    try {
      await api.patch(`/api/admin/users/${userId}/wallet`, { 
        amount: parseFloat(amount),
        action
      });
      toast.success(`تم ${action === 'add' ? 'إضافة' : 'خصم'} ${amount} جنيه بنجاح`);
      fetchUsers();
      setShowWalletModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Update wallet error:', error);
      const message = error.response?.data?.error || 'فشل في تحديث المحفظة';
      toast.error(message);
    }
  };

  const handleWalletUpdate = (user, action) => {
    setSelectedUser({ ...user, action });
    setShowWalletModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المستخدمين</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                البريد الإلكتروني
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المحفظة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المشرف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ التسجيل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.wallet} جنيه
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'نعم' : 'لا'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleWalletUpdate(user, 'add')}
                        className="text-green-600 hover:text-green-900"
                      >
                        إضافة مال
                      </button>
                      <button
                        onClick={() => handleWalletUpdate(user, 'subtract')}
                        className="text-red-600 hover:text-red-900"
                      >
                        خصم مال
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  لا يوجد مستخدمين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Wallet Update Modal */}
      {showWalletModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser.action === 'add' ? 'إضافة مال' : 'خصم مال'} - {selectedUser.email}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المبلغ (جنيه)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="أدخل المبلغ"
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={() => updateWallet(selectedUser._id, walletAmount, selectedUser.action)}
                className={`px-4 py-2 rounded ${
                  selectedUser.action === 'add' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {selectedUser.action === 'add' ? 'إضافة' : 'خصم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 