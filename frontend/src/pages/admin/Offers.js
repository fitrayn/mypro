import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    likes: 0,
    comments: 0,
    follows: 0,
    price: 0
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await api.get('/api/offers');
      setOffers(response.data.offers || []);
    } catch (error) {
      console.error('Fetch offers error:', error);
      toast.error('فشل في تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingOffer) {
        await api.put(`/api/offers/${editingOffer._id}`, formData);
        toast.success('تم تحديث العرض بنجاح');
      } else {
        await api.post('/api/offers', formData);
        toast.success('تم إنشاء العرض بنجاح');
      }
      
      setShowModal(false);
      setEditingOffer(null);
      setFormData({ name: '', description: '', likes: 0, comments: 0, follows: 0, price: 0 });
      fetchOffers();
    } catch (error) {
      const message = error.response?.data?.error || 'فشل في حفظ العرض';
      toast.error(message);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name,
      description: offer.description,
      likes: offer.likes,
      comments: offer.comments,
      follows: offer.follows,
      price: offer.price
    });
    setShowModal(true);
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    
    try {
      await api.delete(`/api/offers/${offerId}`);
      toast.success('تم حذف العرض بنجاح');
      fetchOffers();
    } catch (error) {
      toast.error('فشل في حذف العرض');
    }
  };

  const handleToggleStatus = async (offerId) => {
    try {
      await api.patch(`/api/offers/${offerId}/toggle`);
      toast.success('تم تغيير حالة العرض بنجاح');
      fetchOffers();
    } catch (error) {
      toast.error('فشل في تغيير حالة العرض');
    }
  };

  const initializeOffers = async () => {
    try {
      await api.post('/api/offers/initialize');
      toast.success('تم تهيئة العروض الافتراضية بنجاح');
      fetchOffers();
    } catch (error) {
      toast.error('فشل في تهيئة العروض');
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
        <h1 className="text-2xl font-bold">إدارة العروض</h1>
        <div className="flex gap-2">
          <button
            onClick={initializeOffers}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            تهيئة العروض الافتراضية
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            إضافة عرض جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم العرض
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التفاعلات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{offer.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>إعجابات: {offer.likes}</div>
                      <div>تعليقات: {offer.comments}</div>
                      <div>متابعات: {offer.follows}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">{offer.price} جنيه</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      offer.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {offer.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(offer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(offer._id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        {offer.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(offer._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal إضافة/تعديل العرض */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOffer(null);
                  setFormData({ name: '', description: '', likes: 0, comments: 0, follows: 0, price: 0 });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العرض
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وصف العرض
                </label>
                <textarea
                  required
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عدد الإعجابات
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                    value={formData.likes}
                    onChange={(e) => setFormData({...formData, likes: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عدد التعليقات
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                    value={formData.comments}
                    onChange={(e) => setFormData({...formData, comments: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عدد المتابعات
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                    value={formData.follows}
                    onChange={(e) => setFormData({...formData, follows: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعر (جنيه)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOffer(null);
                    setFormData({ name: '', description: '', likes: 0, comments: 0, follows: 0, price: 0 });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  {editingOffer ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers; 