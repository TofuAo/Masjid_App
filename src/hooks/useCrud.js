import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';

const CACHE_TTL_MS = 60 * 1000;
const listCache = new Map();

function getCacheKey(itemName, params) {
  return `${itemName}:${JSON.stringify(params || {})}`;
}

function getCached(itemName, params) {
  const key = getCacheKey(itemName, params);
  const entry = listCache.get(key);
  if (!entry || Date.now() > entry.expiry) {
    if (entry) listCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(itemName, params, data) {
  listCache.set(getCacheKey(itemName, params), {
    data,
    expiry: Date.now() + CACHE_TTL_MS,
  });
}

function invalidateCache(itemName) {
  for (const key of listCache.keys()) {
    if (key.startsWith(`${itemName}:`)) listCache.delete(key);
  }
}

const useCrud = (api, itemName, itemType = null) => {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'form', 'detail'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: '',
    itemIdentifier: '',
    isLoading: false
  });

  const fetchItems = useCallback(async (params = {}) => {
    setError(null);
    const cached = getCached(itemName, params);
    if (cached != null) {
      setItems(Array.isArray(cached) ? cached : (cached.data || []));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User not authenticated. Please log in.');
      }
      const response = await api.getAll(params);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${itemName}s:`, response);
      }
      const itemsData = Array.isArray(response) ? response : (response.data || []);
      setItems(itemsData);
      setCached(itemName, params, itemsData);
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

  // Removed auto-fetch useEffect to prevent infinite loops
  // Components should manually call fetchItems when needed

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

  const showSuccessWithUndo = useCallback((message) => {
    toast.success(message);
  }, []);

  const handleDelete = (id, item = null) => {
    // Find the item to get its name/identifier for display
    let displayName = '';
    let displayIdentifier = '';
    
    if (item) {
      displayName = item.nama || item.nama_kelas || item.title || item.subject || item.name || `ID ${id}`;
      displayIdentifier = item.telefon || item.IC || item.id || id;
    } else {
      // Try to find item in items array
      const foundItem = items.find(i => {
        const identifier = resolveIdentifier(i);
        return identifier === id || String(identifier) === String(id);
      });
      if (foundItem) {
        displayName = foundItem.nama || foundItem.nama_kelas || foundItem.title || foundItem.subject || foundItem.name || `ID ${id}`;
        displayIdentifier = foundItem.telefon || foundItem.IC || foundItem.id || id;
      } else {
        displayName = `ID ${id}`;
        displayIdentifier = id;
      }
    }
    
    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemName: displayName,
      itemIdentifier: displayIdentifier,
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    const { itemId } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await api.delete(itemId);
      if (response?.pendingApproval) {
        toast.info(
          response.message || `Permintaan padam ${itemName} dihantar untuk kelulusan admin.`
        );
      } else {
        showSuccessWithUndo(`${itemName} berjaya dipadam!`, response);
      }
      setDeleteModal({ isOpen: false, itemId: null, itemName: '', itemIdentifier: '', isLoading: false });
      invalidateCache(itemName);
      fetchItems();
    } catch (err) {
      console.error(`Failed to delete ${itemName}:`, err);
      toast.error(`Gagal memadam ${itemName}.`);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, itemId: null, itemName: '', itemIdentifier: '', isLoading: false });
  };

  const resolveIdentifier = (item) => {
    if (!item) {
      console.warn('[useCrud] resolveIdentifier called with null/undefined item.');
      return undefined;
    }
    
    console.log('[useCrud] Resolving identifier for item:', item);
    console.log('[useCrud] Available keys:', Object.keys(item));
    
    // For Teachers, PIC, and Admin, prioritize IC field and ensure it's valid
    const candidateKeys = ['id', 'ic', 'IC', 'uuid', 'slug', 'code'];
    
    // First, try to find a valid IC (must be 12 digits)
    // Check both 'ic' and 'IC' fields, and also check if ic_formatted exists
    const icFields = ['ic', 'IC', 'ic_formatted'];
    
    for (const key of icFields) {
      const value = item[key];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string') {
          const normalized = value.replace(/\D/g, '');
          // Only return if it's a valid 12-digit IC
          if (normalized.length === 12) {
            console.log(`[useCrud] Resolved identifier '${key}': ${value}`);
            // Return the original value (with or without hyphens) as the API can handle both
            // The API uses encodeURIComponent and normalizeICMiddleware, so it will handle any format
            return value;
          } else {
            console.log(`[useCrud] IC field '${key}' found but not 12 digits: ${value} (normalized: ${normalized})`);
          }
        } else if (typeof value === 'number') {
          // Handle numeric IC (shouldn't happen, but just in case)
          const normalized = String(value).replace(/\D/g, '');
          if (normalized.length === 12) {
            console.log(`[useCrud] Resolved identifier '${key}': ${value}`);
            return String(value);
          }
        }
      }
    }
    
    // If we have an ic field but it wasn't 12 digits, still use it for special student IDs
    // This handles special IDs like SSITIHAWA001, SPUTERIZULAIQHA001, etc.
    if (item.telefon !== undefined && item.telefon !== null && item.telefon !== '') {
      const normalized = String(item.telefon).replace(/\D/g, '');
      if (normalized.length === 12) {
        console.log(`[useCrud] Resolved identifier from ic field: ${item.telefon}`);
        return item.telefon; // Return original format
      } else {
        // For special student IDs (not 12 digits), still use the IC field
        // The backend can handle these special formats
        console.log(`[useCrud] Using special student ID format: ${item.telefon}`);
        return item.telefon; // Return original format even if not 12 digits
      }
    }
    
    // Also check IC field (uppercase)
    if (item.IC !== undefined && item.IC !== null && item.IC !== '') {
      const normalized = String(item.IC).replace(/\D/g, '');
      if (normalized.length === 12) {
        console.log(`[useCrud] Resolved identifier from IC field: ${item.IC}`);
        return item.IC; // Return original format
      } else {
        // For special student IDs (not 12 digits), still use the IC field
        console.log(`[useCrud] Using special student ID format: ${item.IC}`);
        return item.IC; // Return original format even if not 12 digits
      }
    }
    
    // If no valid IC found, try other identifier fields
    for (const key of candidateKeys) {
      // Skip IC fields (already checked above)
      if (key === 'ic' || key === 'IC' || key === 'ic_formatted') continue;
      
      const value = item[key];
      if (value !== undefined && value !== null && value !== '') {
        // Reject values that look like phone numbers (start with 'T' or '0' followed by digits)
        if (typeof value === 'string') {
          const trimmed = value.trim();
          // Reject if it starts with 'T' followed by digits (likely phone number)
          if (/^T\d+$/.test(trimmed)) {
            console.log(`[useCrud] Rejecting phone number format: ${trimmed}`);
            continue;
          }
          // Reject if it's a phone number pattern (starts with 01 and has 9-10 digits)
          if (/^01\d{7,9}$/.test(trimmed.replace(/\D/g, ''))) {
            console.log(`[useCrud] Rejecting phone number pattern: ${trimmed}`);
            continue;
          }
        }
        console.log(`[useCrud] Resolved identifier '${key}': ${value}`);
        return value;
      }
    }
    
    console.error('[useCrud] Failed to resolve identifier for item:', item);
    console.error('[useCrud] Available keys:', Object.keys(item));
    return undefined;
  };

  const handleSubmit = async (formData) => {
    let identifier;
    let previousItems = null;

    if (currentItem) {
      identifier = resolveIdentifier(currentItem);
      if (identifier === undefined && formData.telefon) {
        const normalizedIC = String(formData.telefon).replace(/\D/g, '');
        if (normalizedIC.length === 12) identifier = formData.telefon;
      }
      if (identifier === undefined) {
        const itemIC = currentItem.telefon || currentItem.IC;
        if (itemIC && String(itemIC).replace(/\D/g, '').length === 12) identifier = itemIC;
      }
      if (identifier === undefined) {
        toast.error('Identifier untuk kemaskini tidak ditemui. Sila pastikan item mempunyai IC atau ID yang sah.');
        return;
      }
      // Optimistic update: show new data in list immediately
      previousItems = [...items];
      setItems((prev) =>
        prev.map((i) => {
          const id = resolveIdentifier(i);
          if (id === identifier || String(id) === String(identifier)) {
            return { ...i, ...formData, _optimistic: true };
          }
          return i;
        })
      );
      setView('list');
    } else {
      // Optimistic create: add placeholder to list so UI updates instantly
      const optimisticItem = { ...formData, _optimistic: true, _tempId: Date.now() };
      previousItems = [...items];
      setItems((prev) => [...prev, optimisticItem]);
      setView('list');
    }

    try {
      let response;
      if (currentItem) {
        response = await api.update(identifier, formData);
        if (response?.pendingApproval) {
          toast.info(response.message || `Permintaan kemaskini ${itemName} dihantar untuk kelulusan admin.`);
        } else {
          showSuccessWithUndo(`Maklumat ${itemName} berjaya dikemaskini!`, response);
        }
      } else {
        response = await api.create(formData);
        if (response?.pendingApproval) {
          toast.info(response.message || `Permintaan ${itemName} dihantar untuk kelulusan admin.`);
        } else {
          showSuccessWithUndo(`${itemName} baru berjaya ditambah!`, response);
        }
      }
      invalidateCache(itemName);
      fetchItems();
    } catch (err) {
      console.error(`Failed to save ${itemName}:`, err);
      // Revert optimistic update
      if (previousItems != null) setItems(previousItems);
      let errorMessage = `Gagal menyimpan maklumat ${itemName}.`;
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorDetails = err.errors
          .map((e) => ((e.param || e.field) ? `${e.param || e.field}: ${e.msg || e.message}` : e.msg || e.message))
          .join('\n');
        errorMessage += `\n\nRalat validasi:\n${errorDetails}`;
      } else if (err?.message) {
        errorMessage += `\n\n${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `\n\n${err}`;
      }
      toast.error(errorMessage, { autoClose: 5000, style: { whiteSpace: 'pre-line' } });
    }
  };

  const handleCancel = () => {
    setView('list');
    setCurrentItem(null);
  };

  const DeleteModal = () => {
    return React.createElement(DeleteConfirmationModal, {
      isOpen: deleteModal.isOpen,
      onClose: handleDeleteCancel,
      onConfirm: handleDeleteConfirm,
      itemName: deleteModal.itemName,
      itemIdentifier: deleteModal.itemIdentifier,
      itemType: itemType || itemName,
      isLoading: deleteModal.isLoading
    });
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
    DeleteModal,
  };
};

export default useCrud;
