export const addPriceHistory = (card, newPrice) => {
  const now = new Date().toISOString();
  // Ensure history is always an array
  const history = Array.isArray(card.priceHistory) ? card.priceHistory : [];
  
  // Only add to history if price changed
  if (!history.length || history[history.length - 1].price !== newPrice) {
    history.push({
      price: newPrice,
      date: now
    });
  }
  
  return history;
};

export const getPriceChange = (history) => {
  // Ensure history is an array and has at least 2 entries
  if (!Array.isArray(history) || history.length < 2) {
    return { change: 0, percentage: 0 };
  }
  
  const current = parseFloat(history[history.length - 1].price) || 0;
  const previous = parseFloat(history[history.length - 2].price) || 0;
  const change = current - previous;
  const percentage = previous !== 0 ? (change / previous) * 100 : 0;
  
  return { change, percentage };
};

export const getChartData = (history) => {
  // Ensure history is an array
  if (!Array.isArray(history) || !history.length) {
    return [];
  }
  
  return history
    .filter(record => record && record.date && record.price) // Filter out invalid entries
    .map(record => ({
      date: new Date(record.date).toLocaleDateString(),
      price: parseFloat(record.price) || 0
    }));
}; 