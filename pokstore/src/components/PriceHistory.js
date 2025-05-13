import React from 'react';
import { getPriceChange, getChartData } from '../utils/priceHistory';

export default function PriceHistory({ history }) {
  // Ensure history is an array
  if (!Array.isArray(history) || history.length < 2) return null;

  const { change, percentage } = getPriceChange(history);
  const data = getChartData(history);
  
  // If no valid data points, don't render anything
  if (data.length === 0) return null;
  
  const isPositive = change >= 0;

  return (
    <div className="mt-2">
      <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↗' : '↘'} {Math.abs(change).toFixed(2)}€ ({percentage.toFixed(1)}%)
      </div>
      
      <div className="mt-2 h-20 flex items-end gap-1">
        {data.map((point, index) => {
          const maxPrice = Math.max(...data.map(d => d.price));
          const height = maxPrice > 0 ? `${(point.price / maxPrice * 100)}%` : '0%';
          
          return (
            <div
              key={index}
              className="flex-1 bg-red-200 hover:bg-red-300 transition-all cursor-pointer relative group"
              style={{ height }}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {point.date}: {point.price.toFixed(2)}€
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 