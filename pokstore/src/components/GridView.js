import React from 'react';
import ImagePreview from './ImagePreview';
import Tags from './Tags';
import PriceHistory from './PriceHistory';

export default function GridView({ cards, onEdit, onDelete, handleTagAdd, handleTagRemove }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 animate-fadeIn">
        Aucune carte trouvée.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div 
          key={card.id} 
          className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fadeIn"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="relative h-48 bg-gray-100">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span>No image</span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
              <button
                onClick={() => onEdit(card)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors transform hover:scale-110"
                title="Modifier"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(card.id)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate hover:text-clip">{card.name}</h3>
            <div className="space-y-2">
              <p className="text-gray-600">Edition: {card.set}</p>
              <p className="text-gray-600">État: {card.condition || '-'}</p>
              <p className="text-gray-600">Quantité: {card.quantity || 0}</p>
              <p className="text-gray-600">Prix: {card.price ? `${parseFloat(card.price).toFixed(2)}€` : '-'}</p>
              
              {card.priceHistory && card.priceHistory.length > 0 && (
                <div className="mt-2">
                  <PriceHistory history={card.priceHistory} />
                </div>
              )}
              
              <div className="mt-3">
                <Tags
                  tags={card.tags || []}
                  onAdd={(tag) => handleTagAdd(card.id, tag)}
                  onRemove={(tag) => handleTagRemove(card.id, tag)}
                />
              </div>
              
              {card.notes && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 line-clamp-2 hover:line-clamp-none">{card.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 