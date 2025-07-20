import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Proxies = () => {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProxy, setNewProxy] = useState({
    ip: '',
    port: '',
    username: '',
    password: '',
    country: ''
  });

  useEffect(() => {
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    try {
      const response = await axios.get('/api/proxies', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProxies(response.data);
    } catch (error) {
      toast.error('فشل في تحميل البروكسيات');
    } finally {
      setLoading(false);
    }
  };

  const addProxy = async () => {
    if (!newProxy.ip || !newProxy.port) {
      toast.error('يرجى إدخال IP و Port');
      return;
    }

    try {
      await axios.post('/api/proxies', 
        newProxy,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      toast.success('تم إضافة البروكسي بنجاح');
      setNewProxy({ ip: '', port: '', username: '', password: '', country: '' });
      fetchProxies();
    } catch (error) {
      toast.error('فشل في إضافة البروكسي');
    }
  };

  const testProxy = async (proxyId) => {
    try {
      await axios.post(`/api/proxies/${proxyId}/test`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('تم اختبار البروكسي بنجاح');
      fetchProxies();
    } catch (error) {
      toast.error('فشل في اختبار البروكسي');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'dead': return 'bg-red-100 text-red-800';
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
      <h1 className="text-2xl font-bold mb-6">إدارة البروكسيات</h1>
      
      {/* إضافة بروكسي جديد */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">إضافة بروكسي جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={newProxy.ip}
            onChange={(e) => setNewProxy({...newProxy, ip: e.target.value})}
            placeholder="IP Address"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            value={newProxy.port}
            onChange={(e) => setNewProxy({...newProxy, port: e.target.value})}
            placeholder="Port"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            value={newProxy.country}
            onChange={(e) => setNewProxy({...newProxy, country: e.target.value})}
            placeholder="Country (اختياري)"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            value={newProxy.username}
            onChange={(e) => setNewProxy({...newProxy, username: e.target.value})}
            placeholder="Username (اختياري)"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="password"
            value={newProxy.password}
            onChange={(e) => setNewProxy({...newProxy, password: e.target.value})}
            placeholder="Password (اختياري)"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={addProxy}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
        >
          إضافة البروكسي
        </button>
      </div>

      {/* جدول البروكسيات */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP:Port
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                البلد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                وقت الاستجابة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                آخر اختبار
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proxies.map((proxy) => (
              <tr key={proxy._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {proxy.ip}:{proxy.port}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {proxy.country || 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proxy.status)}`}>
                    {proxy.status === 'working' && 'يعمل'}
                    {proxy.status === 'dead' && 'غير صالح'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {proxy.responseTime ? `${proxy.responseTime}ms` : 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {proxy.lastTested ? new Date(proxy.lastTested).toLocaleDateString('ar-SA') : 'لم يتم الاختبار'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => testProxy(proxy._id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    اختبار
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Proxies; 