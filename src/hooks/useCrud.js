import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminActionsAPI } from '../services/api';

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

  const handleUndoAction = useCallback(
    async (snapshotId, closeToast) => {
      try {
        await adminActionsAPI.undo(snapshotId);
        if (typeof closeToast === 'function') {
          closeToast();
        }
        toast.success('Tindakan berjaya diundur.');
        fetchItems();
      } catch (err) {
        console.error('Failed to undo action:', err);
        toast.error('Gagal mengundur tindakan. Sila cuba lagi.');
      }
    },
    [fetchItems]
  );

  const renderUndoToastContent = useCallback(
    (message, expiryText, undoToken, closeToast) => {
      const children = [
        React.createElement('span', { key: 'msg' }, message),
        React.createElement(
          'button',
          {
            key: 'btn',
            type: 'button',
            onClick: () => handleUndoAction(undoToken, closeToast),
            style: {
              padding: '0.4rem 0.75rem',
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }
          },
          'Undo'
        )
      ];

      if (expiryText) {
        children.push(
          React.createElement(
            'span',
            {
              key: 'expiry',
              style: {
                fontSize: '0.75rem',
                color: '#d1d5db'
              }
            },
            expiryText
          )
        );
      }

      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }
        },
        children
      );
    },
    [handleUndoAction]
  );

  const showSuccessWithUndo = useCallback(
    (message, response) => {
      if (response?.undoToken) {
        const expiresAt = response.undoExpiresAt ? new Date(response.undoExpiresAt) : null;
        const expiryText = expiresAt && !Number.isNaN(expiresAt.getTime())
          ? `Boleh diundur sehingga ${expiresAt.toLocaleString('ms-MY')}`
          : null;

        toast.success(({ closeToast }) => (
          renderUndoToastContent(message, expiryText, response.undoToken, closeToast)
        ), {
          closeOnClick: false,
          autoClose: 8000
        });
      } else {
        toast.success(message);
      }
    },
    [renderUndoToastContent]
  );

  const handleDelete = async (id) => {
    if (window.confirm(`Adakah anda pasti mahu memadam ${itemName} ini?`)) {
      try {
        const response = await api.delete(id);
        if (response?.pendingApproval) {
          toast.info(
            response.message || `Permintaan padam ${itemName} dihantar untuk kelulusan admin.`
          );
        } else {
        showSuccessWithUndo(`${itemName} berjaya dipadam!`, response);
        }
        fetchItems(); // Refetch data after deletion
      } catch (err) {
        console.error(`Failed to delete ${itemName}:`, err);
        toast.error(`Gagal memadam ${itemName}.`);
      }
    }
  };

  const resolveIdentifier = (item) => {
    if (!item) return undefined;
    const candidateKeys = ['id', 'ic', 'IC', 'uuid', 'slug', 'code'];
    for (const key of candidateKeys) {
      const value = item[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return undefined;
  };

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (currentItem) {
        const identifier = resolveIdentifier(currentItem);
        if (identifier === undefined) {
          throw new Error('Identifier untuk kemaskini tidak ditemui.');
        }
        response = await api.update(identifier, formData);
        if (response?.pendingApproval) {
          toast.info(
            response.message || `Permintaan kemaskini ${itemName} dihantar untuk kelulusan admin.`
          );
        } else {
        showSuccessWithUndo(`Maklumat ${itemName} berjaya dikemaskini!`, response);
        }
      } else {
        response = await api.create(formData);
        if (response?.pendingApproval) {
          toast.info(
            response.message || `Permintaan ${itemName} dihantar untuk kelulusan admin.`
          );
        } else {
        showSuccessWithUndo(`${itemName} baru berjaya ditambah!`, response);
        }
      }
      setView('list');
      fetchItems(); // Refetch data after submission
    } catch (err) {
      console.error(`Failed to save ${itemName}:`, err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      
      // Extract detailed error messages
      let errorMessage = `Gagal menyimpan maklumat ${itemName}.`;
      
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        // Format validation errors nicely
        const errorDetails = err.errors.map(e => {
          const field = e.param || e.field || '';
          const message = e.msg || e.message || 'Invalid';
          return field ? `${field}: ${message}` : message;
        }).join('\n');
        errorMessage += `\n\nRalat validasi:\n${errorDetails}`;
      } else if (err?.message) {
        errorMessage += `\n\n${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `\n\n${err}`;
      }
      
      toast.error(errorMessage, {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
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
