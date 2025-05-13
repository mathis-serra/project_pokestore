// Helper function to get total collection value over time
export const getCollectionValueHistory = (cards) => {
  // Get all unique dates from all cards' price histories
  const allDates = new Set();
  cards.forEach(card => {
    if (Array.isArray(card.priceHistory)) {
      card.priceHistory.forEach(history => {
        allDates.add(new Date(history.date).toISOString().split('T')[0]);
      });
    }
  });

  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort();

  // Calculate total value for each date
  return sortedDates.map(date => {
    let totalValue = 0;
    cards.forEach(card => {
      if (Array.isArray(card.priceHistory)) {
        // Find the most recent price before or on this date
        const relevantPrice = card.priceHistory
          .filter(h => new Date(h.date).toISOString().split('T')[0] <= date)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (relevantPrice) {
          totalValue += parseFloat(relevantPrice.price) * (card.quantity || 1);
        }
      }
    });
    return { date, value: totalValue };
  });
};

// Get value distribution by condition
export const getValueByCondition = (cards) => {
  return cards.reduce((acc, card) => {
    const condition = card.condition || 'Non spécifié';
    const value = (parseFloat(card.price) || 0) * (card.quantity || 1);
    acc[condition] = (acc[condition] || 0) + value;
    return acc;
  }, {});
};

// Get quantity distribution by condition
export const getQuantityByCondition = (cards) => {
  return cards.reduce((acc, card) => {
    const condition = card.condition || 'Non spécifié';
    acc[condition] = (acc[condition] || 0) + (card.quantity || 1);
    return acc;
  }, {});
};

// Get price ranges distribution
export const getPriceRangeDistribution = (cards) => {
  const ranges = {
    '0-5€': 0,
    '5-10€': 0,
    '10-20€': 0,
    '20-50€': 0,
    '50-100€': 0,
    '100€+': 0
  };

  cards.forEach(card => {
    const price = parseFloat(card.price) || 0;
    const quantity = card.quantity || 1;

    if (price <= 5) ranges['0-5€'] += quantity;
    else if (price <= 10) ranges['5-10€'] += quantity;
    else if (price <= 20) ranges['10-20€'] += quantity;
    else if (price <= 50) ranges['20-50€'] += quantity;
    else if (price <= 100) ranges['50-100€'] += quantity;
    else ranges['100€+'] += quantity;
  });

  return ranges;
};

// Get most valuable cards
export const getMostValuableCards = (cards, limit = 5) => {
  return [...cards]
    .sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
    .slice(0, limit);
};

// Get tags distribution
export const getTagsDistribution = (cards) => {
  const distribution = {};
  cards.forEach(card => {
    if (Array.isArray(card.tags)) {
      card.tags.forEach(tag => {
        distribution[tag] = (distribution[tag] || 0) + (card.quantity || 1);
      });
    }
  });
  return distribution;
};

// Calculate collection growth
export const getCollectionGrowth = (cards) => {
  const monthlyData = {};
  
  cards.forEach(card => {
    if (Array.isArray(card.priceHistory)) {
      card.priceHistory.forEach(history => {
        const date = new Date(history.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            totalValue: 0,
            cardCount: 0
          };
        }
        
        monthlyData[monthKey].totalValue += parseFloat(history.price) * (card.quantity || 1);
        monthlyData[monthKey].cardCount += card.quantity || 1;
      });
    }
  });

  return Object.entries(monthlyData)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      date,
      ...data
    }));
};

// Get distribution by product type
export const getProductTypeDistribution = (cards) => {
  const types = {
    'ETB': { count: 0, value: 0 },
    'Display': { count: 0, value: 0 },
    'Coffret': { count: 0, value: 0 },
    'Tripack': { count: 0, value: 0 },
    'UPC': { count: 0, value: 0 },
    'Autres': { count: 0, value: 0 }
  };

  cards.forEach(card => {
    const name = card.name.toLowerCase();
    const quantity = card.quantity || 1;
    const value = (parseFloat(card.price) || 0) * quantity;

    if (name.includes('etb')) {
      types['ETB'].count += quantity;
      types['ETB'].value += value;
    } else if (name.includes('display')) {
      types['Display'].count += quantity;
      types['Display'].value += value;
    } else if (name.includes('coffret')) {
      types['Coffret'].count += quantity;
      types['Coffret'].value += value;
    } else if (name.includes('tripack')) {
      types['Tripack'].count += quantity;
      types['Tripack'].value += value;
    } else if (name.includes('upc')) {
      types['UPC'].count += quantity;
      types['UPC'].value += value;
    } else {
      types['Autres'].count += quantity;
      types['Autres'].value += value;
    }
  });

  return types;
};

// Get distribution by edition
export const getEditionDistribution = (cards) => {
  const distribution = {};
  
  cards.forEach(card => {
    const edition = card.set || 'Non spécifié';
    const quantity = card.quantity || 1;
    const value = (parseFloat(card.price) || 0) * quantity;
    
    if (!distribution[edition]) {
      distribution[edition] = {
        count: 0,
        value: 0
      };
    }
    
    distribution[edition].count += quantity;
    distribution[edition].value += value;
  });
  
  return distribution;
};

// Get average price by product type
export const getAveragePriceByType = (cards) => {
  const types = getProductTypeDistribution(cards);
  const averages = {};
  
  Object.entries(types).forEach(([type, data]) => {
    averages[type] = data.count > 0 ? data.value / data.count : 0;
  });
  
  return averages;
};

// Get investment metrics
export const getInvestmentMetrics = (cards) => {
  const totalValue = cards.reduce((sum, card) => sum + ((parseFloat(card.price) || 0) * (card.quantity || 1)), 0);
  const totalItems = cards.reduce((sum, card) => sum + (card.quantity || 1), 0);
  const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0;
  
  const editionValues = getEditionDistribution(cards);
  const mostValuableEdition = Object.entries(editionValues)
    .sort(([, a], [, b]) => b.value - a.value)[0];
    
  return {
    totalValue,
    totalItems,
    averageItemValue,
    mostValuableEdition: {
      name: mostValuableEdition[0],
      value: mostValuableEdition[1].value,
      count: mostValuableEdition[1].count
    }
  };
}; 