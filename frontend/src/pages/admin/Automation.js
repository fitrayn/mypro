import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import {
  PlayIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Automation = () => {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/api/automation/status');
      setStatus(response.data);
      setAutomationRunning(response.data.isRunning);
    } catch (error) {
      console.error('Fetch status error:', error);
      toast.error('فشل في تحميل حالة التطبيق التلقائي');
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/automation/logs');
      setLogs(response.data.orders || []);
    } catch (error) {
      console.error('Fetch logs error:', error);
      toast.error('فشل في تحميل سجلات التطبيق التلقائي');
    } finally {
      setLoading(false);
    }
  };

  const startAutomation = async () => {
    try {
      await api.post('/api/automation/start');
      toast.success('تم تشغيل التطبيق التلقائي بنجاح');
      setAutomationRunning(true);
      fetchStatus();
    } catch (error) {
      console.error('Start automation error:', error);
      toast.error('فشل في تشغيل التطبيق التلقائي');
    }
  };

  const stopAutomation = async () => {
    try {
      await api.post('/api/automation/stop');
      toast.success('تم إيقاف التطبيق التلقائي بنجاح');
      setAutomationRunning(false);
      fetchStatus();
    } catch (error) {
      console.error('Stop automation error:', error);
      toast.error('فشل في إيقاف التطبيق التلقائي');
    }
  };

  const toggleAutoStart = async () => {
    try {
      await api.post('/api/automation/autostart', { enabled: !autoStartEnabled });
      setAutoStartEnabled(!autoStartEnabled);
      toast.success(autoStartEnabled ? 'تم إلغاء التشغيل التلقائي' : 'تم تفعيل التشغيل التلقائي');
    } catch (error) {
      console.error('Toggle auto-start error:', error);
      toast.error('فشل في تغيير إعداد التشغيل التلقائي');
    }
  };

  const executeOrder = async (orderId) => {
    try {
      await api.post(`/api/automation/execute/${orderId}`);
      toast.success('تم تنفيذ الطلب بنجاح');
      fetchLogs();
    } catch (error) {
      console.error('Execute order error:', error);
      toast.error('فشل في تنفيذ الطلب');
    }
  };

  const retryOrder = async (orderId) => {
    try {
      await api.post(`/api/automation/retry/${orderId}`);
      toast.success('تم إعادة تعيين الطلب بنجاح');
      fetchLogs();
    } catch (error) {
      console.error('Retry order error:', error);
      toast.error('فشل في إعادة تعيين الطلب');
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await api.post(`/api/automation/cancel/${orderId}`);
      toast.success('تم إلغاء الطلب بنجاح');
      fetchLogs();
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('فشل في إلغاء الطلب');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'done':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'running': return 'قيد التنفيذ';
      case 'done': return 'مكتمل';
      case 'failed': return 'فشل';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">التحكم في التطبيق التلقائي</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleAutoStart}
            className={`px-4 py-2 rounded ${
              autoStartEnabled 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {autoStartEnabled ? 'إلغاء التشغيل التلقائي' : 'تفعيل التشغيل التلقائي'}
          </button>
          <button
            onClick={startAutomation}
            disabled={automationRunning}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            <PlayIcon className="h-5 w-5 inline mr-2" />
            تشغيل
          </button>
          <button
            onClick={stopAutomation}
            disabled={!automationRunning}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            <StopIcon className="h-5 w-5 inline mr-2" />
            إيقاف
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">في الانتظار</p>
                <p className="text-2xl font-bold">{status.pendingOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <PlayIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">قيد التنفيذ</p>
                <p className="text-2xl font-bold">{status.runningOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">مكتمل</p>
                <p className="text-2xl font-bold">{status.completedOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">فشل</p>
                <p className="text-2xl font-bold">{status.failedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full ${autoStartEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">التشغيل التلقائي</p>
                <p className="text-lg font-bold">{autoStartEnabled ? 'مفعل' : 'معطل'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* سجلات التطبيق التلقائي */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">سجلات التطبيق التلقائي</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الرابط
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التفاعلات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النتائج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.userId?.email || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a 
                      href={order.targetUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {order.targetUrl.substring(0, 30)}...
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>إعجابات: {order.likes}</div>
                      <div>تعليقات: {order.comments}</div>
                      <div>متابعات: {order.follows}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className="mr-2">{getStatusText(order.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.successCount ? `${order.successCount} نجح` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => executeOrder(order._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          تنفيذ
                        </button>
                      )}
                      {order.status === 'failed' && (
                        <button
                          onClick={() => retryOrder(order._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          إعادة
                        </button>
                      )}
                      {order.status === 'running' && (
                        <button
                          onClick={() => cancelOrder(order._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Automation; 