import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const Cookies = () => {
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCookie, setNewCookie] = useState('');
  const [bulkCookies, setBulkCookies] = useState('');

  useEffect(() => {
    fetchCookies();
  }, []);

  const fetchCookies = async () => {
    try {
      const response = await api.get('/api/cookies');
      // Ensure we have valid data
      const cookiesData = Array.isArray(response.data?.cookies) ? response.data.cookies : [];
      setCookies(cookiesData);
    } catch (error) {
      console.error('Fetch cookies error:', error);
      toast.error('فشل في تحميل الكوكيز');
      setCookies([]);
    } finally {
      setLoading(false);
    }
  };

  const addCookie = async () => {
    if (!newCookie.trim()) {
      toast.error('يرجى إدخال كوكي صحيح');
      return;
    }

    try {
      await api.post('/api/cookies', { cookie: newCookie });
      toast.success('تم إضافة الكوكي بنجاح');
      setNewCookie('');
      fetchCookies();
    } catch (error) {
      console.error('Add cookie error:', error);
      toast.error('فشل في إضافة الكوكي');
    }
  };

  const addBulkCookies = async () => {
    if (!bulkCookies.trim()) {
      toast.error('يرجى إدخال كوكيز صحيحة');
      return;
    }

    try {
      const cookieList = bulkCookies.split('\n').filter(cookie => cookie.trim());
      await api.post('/api/cookies/bulk', { cookies: cookieList });
      toast.success('تم إضافة الكوكيز بنجاح');
      setBulkCookies('');
      fetchCookies();
    } catch (error) {
      console.error('Add bulk cookies error:', error);
      toast.error('فشل في إضافة الكوكيز');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'dead': return 'bg-red-100 text-red-800';
      case 'needs_verification': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <h1 className="text-2xl font-bold mb-6">إدارة الكوكيز</h1>
      
      {/* إضافة كوكي واحد */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">إضافة كوكي واحد</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCookie}
            onChange={(e) => setNewCookie(e.target.value)}
            placeholder="أدخل كوكي Facebook"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={addCookie}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            إضافة
          </button>
        </div>
      </div>

      {/* إضافة كوكيز متعددة */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">إضافة كوكيز متعددة</h2>
        <textarea
          value={bulkCookies}
          onChange={(e) => setBulkCookies(e.target.value)}
          placeholder="أدخل كوكيز Facebook (كل كوكي في سطر منفصل)"
          className="w-full border border-gray-300 rounded px-3 py-2 h-32"
        />
        <button
          onClick={addBulkCookies}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
        >
          إضافة الكوكيز
        </button>
      </div>

      {/* جدول الكوكيز */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكوكي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عدد الاستخدامات
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                آخر فحص
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(cookies) && cookies.length > 0 ? (
              cookies.map((cookie) => (
                <tr key={cookie._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={cookie.cookie}>
                      {cookie.cookie.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cookie.status)}`}>
                      {cookie.status === 'active' && 'نشط'}
                      {cookie.status === 'dead' && 'غير صالح'}
                      {cookie.status === 'needs_verification' && 'يحتاج فحص'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cookie.usageCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cookie.lastChecked ? new Date(cookie.lastChecked).toLocaleDateString('ar-SA') : 'لم يتم الفحص'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  لا توجد كوكيز
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Cookies; 