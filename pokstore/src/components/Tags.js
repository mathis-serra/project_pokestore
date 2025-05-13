import React, { useState } from 'react';

export default function Tags({ tags = [], onAdd, onRemove }) {
  const [newTag, setNewTag] = useState('');
  
  const handleAdd = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onAdd(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {Array.isArray(tags) && tags.map(tag => (
          <span
            key={tag}
            className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => onRemove(tag)}
              className="hover:text-red-600 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ajouter un tag"
          className="flex-1 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <button
          onClick={handleAdd}
          disabled={!newTag.trim()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
} 