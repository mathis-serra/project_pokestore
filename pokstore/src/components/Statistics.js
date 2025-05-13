import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  getCollectionValueHistory,
  getValueByCondition,
  getQuantityByCondition,
  getPriceRangeDistribution,
  getMostValuableCards,
  getTagsDistribution,
  getCollectionGrowth,
  getProductTypeDistribution,
  getEditionDistribution,
  getAveragePriceByType,
  getInvestmentMetrics
} from '../utils/analytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

export default function Statistics({ cards }) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = useMemo(() => {
    const valueHistory = getCollectionValueHistory(cards);
    const valueByCondition = getValueByCondition(cards);
    const quantityByCondition = getQuantityByCondition(cards);
    const priceRanges = getPriceRangeDistribution(cards);
    const mostValuable = getMostValuableCards(cards);
    const tagsDistribution = getTagsDistribution(cards);
    const growth = getCollectionGrowth(cards);
    const productTypes = getProductTypeDistribution(cards);
    const editionStats = getEditionDistribution(cards);
    const avgPriceByType = getAveragePriceByType(cards);
    const investmentMetrics = getInvestmentMetrics(cards);

    return {
      valueHistory,
      valueByCondition,
      quantityByCondition,
      priceRanges,
      mostValuable,
      tagsDistribution,
      growth,
      productTypes,
      editionStats,
      avgPriceByType,
      investmentMetrics,
      totalCards: cards.reduce((sum, card) => sum + (card.quantity || 0), 0),
      totalValue: cards.reduce((sum, card) => sum + ((card.price || 0) * (card.quantity || 0)), 0),
      uniqueCards: cards.length,
    };
  }, [cards]);

  const tabs = [
    { id: 'overview', label: '📊 Vue d\'ensemble' },
    { id: 'products', label: '📦 Produits' },
    { id: 'editions', label: '🎴 Éditions' },
    { id: 'investment', label: '💰 Investissement' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Total des produits</h3>
              <p className="text-3xl font-bold">{stats.totalCards}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Valeur totale</h3>
              <p className="text-3xl font-bold">{stats.totalValue.toFixed(2)}€</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Produits uniques</h3>
              <p className="text-3xl font-bold">{stats.uniqueCards}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <h3 className="text-lg font-semibold mb-4">Évolution de la valeur</h3>
              <Line
                options={chartOptions}
                data={{
                  labels: stats.valueHistory.map(h => h.date),
                  datasets: [{
                    label: 'Valeur totale (€)',
                    data: stats.valueHistory.map(h => h.value),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                  }]
                }}
              />
            </div>
            <div className="h-[300px]">
              <h3 className="text-lg font-semibold mb-4">Distribution par type</h3>
              <Pie
                options={chartOptions}
                data={{
                  labels: Object.keys(stats.productTypes),
                  datasets: [{
                    data: Object.values(stats.productTypes).map(t => t.count),
                    backgroundColor: [
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(34, 197, 94, 0.8)',
                      'rgba(168, 85, 247, 0.8)',
                      'rgba(249, 115, 22, 0.8)',
                      'rgba(107, 114, 128, 0.8)',
                    ],
                  }]
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Distribution des produits</h3>
              <Bar
                options={chartOptions}
                data={{
                  labels: Object.keys(stats.productTypes),
                  datasets: [{
                    label: 'Quantité',
                    data: Object.values(stats.productTypes).map(t => t.count),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  }]
                }}
              />
            </div>
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Valeur par type de produit</h3>
              <Bar
                options={chartOptions}
                data={{
                  labels: Object.keys(stats.productTypes),
                  datasets: [{
                    label: 'Valeur (€)',
                    data: Object.values(stats.productTypes).map(t => t.value),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  }]
                }}
              />
            </div>
          </div>
          <div className="h-[400px]">
            <h3 className="text-lg font-semibold mb-4">Prix moyen par type</h3>
            <Bar
              options={chartOptions}
              data={{
                labels: Object.keys(stats.avgPriceByType),
                datasets: [{
                  label: 'Prix moyen (€)',
                  data: Object.values(stats.avgPriceByType),
                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                }]
              }}
            />
          </div>
        </div>
      )}

      {/* Editions Tab */}
      {activeTab === 'editions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Produits par édition</h3>
              <Bar
                options={chartOptions}
                data={{
                  labels: Object.keys(stats.editionStats),
                  datasets: [{
                    label: 'Quantité',
                    data: Object.values(stats.editionStats).map(e => e.count),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  }]
                }}
              />
            </div>
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Valeur par édition</h3>
              <Bar
                options={chartOptions}
                data={{
                  labels: Object.keys(stats.editionStats),
                  datasets: [{
                    label: 'Valeur (€)',
                    data: Object.values(stats.editionStats).map(e => e.value),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  }]
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Investment Tab */}
      {activeTab === 'investment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Valeur moyenne/produit</h3>
              <p className="text-3xl font-bold">{stats.investmentMetrics.averageItemValue.toFixed(2)}€</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Édition la plus précieuse</h3>
              <p className="text-xl font-bold">{stats.investmentMetrics.mostValuableEdition.name}</p>
              <p className="text-lg">{stats.investmentMetrics.mostValuableEdition.value.toFixed(2)}€</p>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Nombre de produits</h3>
              <p className="text-3xl font-bold">{stats.investmentMetrics.totalItems}</p>
            </div>
          </div>

          <div className="h-[400px]">
            <h3 className="text-lg font-semibold mb-4">Distribution par gamme de prix</h3>
            <Bar
              options={chartOptions}
              data={{
                labels: Object.keys(stats.priceRanges),
                datasets: [{
                  label: 'Nombre de produits',
                  data: Object.values(stats.priceRanges),
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                }]
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 