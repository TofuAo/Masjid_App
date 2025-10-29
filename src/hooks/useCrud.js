import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const useCrud = (api, itemName) => {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'form', 'detail'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated. Please log in.');
      }
      
      const response = await api.getAll(params);
      console.log(`Fetched ${itemName}s:`, response);
      // Handle both array responses and object responses with data property
      const items = Array.isArray(response) ? response : (response.data || []);
      setItems(items);
    } catch (err) {
      console.error(`Failed to fetch ${itemName}s:`, err);
      setError(err);
      if (err.message.includes('not authenticated')) {
        toast.error('Sila log masuk terlebih dahulu.');
      } else {
        toast.error(`Gagal memuatkan data ${itemName}.`);
      }
    } finally {
      setLoading(false);
    }
  }, [api, itemName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = () => {
    setCurrentItem(null);
    setView('form');
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setView('form');
  };

  const handleView = (item) => {
    setCurrentItem(item);
    setView('detail');
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Adakah anda pasti mahu memadam ${itemName} ini?`)) {
      try {
        await api.delete(id);
        toast.success(`${itemName} berjaya dipadam!`);
        fetchItems(); // Refetch data after deletion
      } catch (err) {
        console.error(`Failed to delete ${itemName}:`, err);
        toast.error(`Gagal memadam ${itemName}.`);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (currentItem) {
        await api.update(currentItem.id, formData);
        toast.success(`Maklumat ${itemName} berjaya dikemaskini!`);
      } else {
        await api.create(formData);
        toast.success(`${itemName} baru berjaya ditambah!`);
      }
      setView('list');
      fetchItems(); // Refetch data after submission
    } catch (err) {
      console.error(`Failed to save ${itemName}:`, err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      const details = Array.isArray(err?.errors)
        ? err.errors.map(e => e.msg || e.message).join(', ')
        : (err?.message || err);
      toast.error(`Gagal menyimpan maklumat ${itemName}. ${details ? `Butiran: ${details}` : ''}`);
    }
  };

  const handleCancel = () => {
    setView('list');
    setCurrentItem(null);
  };

  return {
    items,
    currentItem,
    view,
    loading,
    error,
    fetchItems,
    handlers: {
      add: handleAdd,
      edit: handleEdit,
      view: handleView,
      delete: handleDelete,
      submit: handleSubmit,
      cancel: handleCancel,
    },
  };
};

export default useCrud;
