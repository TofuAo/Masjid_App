import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import useCrud from '../hooks/useCrud';
import { picUsersAPI } from '../services/api';
import PicUserForm from '../components/pic/PicUserForm';
import PicUserList from '../components/pic/PicUserList';
import Card from '../components/ui/Card';

const PicUsers = () => {
  const {
    items: picUsers,
    currentItem,
    view,
    loading,
    error,
    handlers,
    fetchItems
  } = useCrud(picUsersAPI, 'PIC');

  const {
    add: handleAdd,
    edit: handleEdit,
    delete: handleDelete,
    submit: handleSubmit,
    cancel: handleCancel
  } = handlers;

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = searchTerm ? { search: searchTerm } : undefined;
      fetchItems(params);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchItems]);

  const sortedPicUsers = useMemo(() => picUsers || [], [picUsers]);

  if (error) {
    return (
      <Card>
        <Card.Content>
          <div className="py-10 text-center text-red-600">
            {error.message || 'Gagal memuatkan data PIC.'}
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Pengurusan PIC</h1>
          <p className="text-sm text-gray-500">
            Tambah, kemaskini atau padam pengguna dengan peranan PIC (Person In Charge).
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari ikut nama, IC atau emel"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {view === 'form' ? (
        <PicUserForm picUser={currentItem} onSubmit={handleSubmit} onCancel={handleCancel} />
      ) : (
        <PicUserList
          picUsers={sortedPicUsers}
          loading={loading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default PicUsers;

