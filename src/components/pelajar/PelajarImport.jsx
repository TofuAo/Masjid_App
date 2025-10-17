import React, { useState } from 'react';
import { studentsAPI } from '../../services/api';

const PelajarImport = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event) => {
    setCsvFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!csvFile) {
      setError('Sila pilih fail CSV.');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      await studentsAPI.importFromCSV(formData);
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Gagal mengimport pelajar.');
      setSuccess(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Import Pelajar dari CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} className="mb-2" />
      <button onClick={handleImport} className="bg-emerald-500 text-white py-2 px-4 rounded hover:bg-emerald-700">
        Import
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">Pelajar berjaya diimport!</p>}
    </div>
  );
};

export default PelajarImport;
