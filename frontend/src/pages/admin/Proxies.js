import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const Proxies = () => {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkFormat, setBulkFormat] = useState('csv'); // csv, txt, json
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
      const response = await api.get('/api/proxies');
      // Ensure we have valid data
      const proxiesData = Array.isArray(response.data?.proxies) ? response.data.proxies : [];
      setProxies(proxiesData);
    } catch (error) {
      console.error('Fetch proxies error:', error);
      toast.error('فشل في تحميل البروكسيات');
      setProxies([]);
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
      await api.post('/api/proxies', newProxy);
      toast.success('تم إضافة البروكسي بنجاح');
      setNewProxy({ ip: '', port: '', username: '', password: '', country: '' });
      fetchProxies();
    } catch (error) {
      console.error('Add proxy error:', error);
      toast.error('فشل في إضافة البروكسي');
    }
  };

  const testProxy = async (proxyId) => {
    try {
      await api.post(`/api/proxies/${proxyId}/test`, {});
      toast.success('تم اختبار البروكسي بنجاح');
      fetchProxies();
    } catch (error) {
      console.error('Test proxy error:', error);
      toast.error('فشل في اختبار البروكسي');
    }
  };

  const parseBulkText = (text, format) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const proxies = [];

    for (const line of lines) {
      try {
        let proxy = {};

        if (format === 'csv') {
          // Format: ip,port,username,password,country
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            proxy = {
              ip: parts[0],
              port: parts[1],
              username: parts[2] || '',
              password: parts[3] || '',
              country: parts[4] || ''
            };
          }
        } else if (format === 'txt') {
          // Format: ip:port:username:password:country
          const parts = line.split(':').map(p => p.trim());
          if (parts.length >= 2) {
            proxy = {
              ip: parts[0],
              port: parts[1],
              username: parts[2] || '',
              password: parts[3] || '',
              country: parts[4] || ''
            };
          }
        } else if (format === 'json') {
          // Format: {"ip":"1.2.3.4","port":"8080","username":"user","password":"pass","country":"US"}
          try {
            proxy = JSON.parse(line);
          } catch (e) {
            continue;
          }
        }

        if (proxy.ip && proxy.port) {
          proxies.push(proxy);
        }
      } catch (error) {
        console.error('Error parsing line:', line, error);
      }
    }

    return proxies;
  };

  const uploadBulkProxies = async () => {
    if (!bulkText.trim()) {
      toast.error('يرجى إدخال البروكسيات');
      return;
    }

    const proxies = parseBulkText(bulkText, bulkFormat);
    
    if (proxies.length === 0) {
      toast.error('لم يتم العثور على بروكسيات صحيحة في النص');
      return;
    }

    if (proxies.length > 10000) {
      toast.error('الحد الأقصى هو 10,000 بروكسي في المرة الواحدة');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Split into chunks of 1000 for better performance
      const chunkSize = 1000;
      const chunks = [];
      
      for (let i = 0; i < proxies.length; i += chunkSize) {
        chunks.push(proxies.slice(i, i + chunkSize));
      }

      let totalAdded = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const response = await api.post('/api/proxies/bulk', {
            proxies: chunk
          });

          totalAdded += response.data.results.added;
          totalSkipped += response.data.results.skipped;
          totalErrors += response.data.results.errors.length;

          // Update progress
          const progress = ((i + 1) / chunks.length) * 100;
          setUploadProgress(progress);
        } catch (error) {
          console.error('Chunk upload error:', error);
          totalErrors += chunk.length;
        }
      }

      toast.success(`تم رفع ${totalAdded} بروكسي بنجاح! تم تخطي ${totalSkipped}، أخطاء: ${totalErrors}`);
      
      setBulkText('');
      setShowBulkUpload(false);
      fetchProxies();
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('فشل في رفع البروكسيات');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setBulkText(e.target.result);
      setShowBulkUpload(true);
    };
    reader.readAsText(file);
  };

  const downloadSampleFile = (format) => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      content = 'ip,port,username,password,country\n1.2.3.4,8080,user1,pass1,US\n5.6.7.8,3128,user2,pass2,UK\n9.10.11.12,1080,user3,pass3,DE';
      filename = 'sample_proxies.csv';
      mimeType = 'text/csv';
    } else if (format === 'txt') {
      content = '1.2.3.4:8080:user1:pass1:US\n5.6.7.8:3128:user2:pass2:UK\n9.10.11.12:1080:user3:pass3:DE';
      filename = 'sample_proxies.txt';
      mimeType = 'text/plain';
    } else if (format === 'json') {
      content = '{"ip":"1.2.3.4","port":"8080","username":"user1","password":"pass1","country":"US"}\n{"ip":"5.6.7.8","port":"3128","username":"user2","password":"pass2","country":"UK"}\n{"ip":"9.10.11.12","port":"1080","username":"user3","password":"pass3","country":"DE"}';
      filename = 'sample_proxies.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'dead': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlaceholderText = (format) => {
    switch (format) {
      case 'csv':
        return '1.2.3.4,8080,user,pass,US\n5.6.7.8,3128,user2,pass2,UK';
      case 'txt':
        return '1.2.3.4:8080:user:pass:US\n5.6.7.8:3128:user2:pass2:UK';
      case 'json':
        return '{"ip":"1.2.3.4","port":"8080","username":"user","password":"pass","country":"US"}\n{"ip":"5.6.7.8","port":"3128","username":"user2","password":"pass2","country":"UK"}';
      default:
        return '';
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

      {/* رفع بروكسيات متعددة */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">رفع بروكسيات متعددة (حتى 10,000)</h2>
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showBulkUpload ? 'إخفاء' : 'إظهار'}
          </button>
        </div>

        {showBulkUpload && (
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رفع ملف (CSV, TXT, JSON)
              </label>
              <input
                type="file"
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تنسيق الملف
              </label>
              <select
                value={bulkFormat}
                onChange={(e) => setBulkFormat(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              >
                <option value="csv">CSV (ip,port,username,password,country)</option>
                <option value="txt">TXT (ip:port:username:password:country)</option>
                <option value="json">JSON ({"ip":"1.2.3.4","port":"8080"})</option>
              </select>
            </div>

            {/* Download Sample Button */}
            <div>
              <button
                onClick={() => downloadSampleFile(bulkFormat)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                تحميل ملف نموذجي ({bulkFormat.toUpperCase()})
              </button>
            </div>

            {/* Text Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أو أدخل البروكسيات يدوياً
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`مثال للصيغة ${bulkFormat.toUpperCase()}:\n${getPlaceholderText(bulkFormat)}`}
                className="border border-gray-300 rounded px-3 py-2 w-full h-32 resize-none"
                disabled={uploading}
              />
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={uploadBulkProxies}
              disabled={uploading || !bulkText.trim()}
              className={`px-4 py-2 rounded text-white ${
                uploading || !bulkText.trim() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading ? 'جاري الرفع...' : 'رفع البروكسيات'}
            </button>

            {/* Format Help */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">أمثلة على التنسيقات:</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>CSV:</strong> ip,port,username,password,country</div>
                <div><strong>TXT:</strong> ip:port:username:password:country</div>
                <div><strong>JSON:</strong> {"ip":"1.2.3.4","port":"8080","username":"user","password":"pass","country":"US"}</div>
              </div>
            </div>
          </div>
        )}
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
            {Array.isArray(proxies) && proxies.length > 0 ? (
              proxies.map((proxy) => (
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
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  لا توجد بروكسيات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Proxies; 