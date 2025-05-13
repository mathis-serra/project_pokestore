import React, { useState } from 'react';

export default function BulkImport({ onImport }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setFile(file);
    } else {
      alert('Veuillez sélectionner un fichier CSV valide');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const cards = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const card = {};
          headers.forEach((header, index) => {
            if (header === 'quantity' || header === 'price') {
              card[header] = parseFloat(values[index]) || 0;
            } else {
              card[header] = values[index];
            }
          });
          return card;
        });

      onImport(cards);
      setIsOpen(false);
      setFile(null);
    } catch (error) {
      alert('Erreur lors de l\'importation: ' + error.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
      >
        📥 Importer CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Importer des cartes</h2>
            
            <div className="mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>Format attendu:</p>
              <p>nom,edition,etat,quantite,prix,notes,imageUrl</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={!file}
                className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white ${
                  !file ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 