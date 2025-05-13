import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ImagePreview from './components/ImagePreview';
import Statistics from './components/Statistics';
import DarkModeToggle from './components/DarkModeToggle';
import BulkImport from './components/BulkImport';
import PriceHistory from './components/PriceHistory';
import Tags from './components/Tags';
import { addPriceHistory } from './utils/priceHistory';
import './index.css';

export default function App() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterCondition, setFilterCondition] = useState('all');
  const [editingCard, setEditingCard] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [cardsPerPage, setCardsPerPage] = useState(() => {
    // More cards per page in grid view
    return viewMode === 'table' ? 10 : 12;
  });

  const [newCard, setNewCard] = useState({
    name: '',
    set: '',
    condition: '',
    quantity: 1,
    price: '',
    notes: '',
    imageUrl: '',
    tags: [],
    priceHistory: []
  });

  const conditions = ['Neuf', 'Excellent', 'Bon', 'Abîmé'];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('handleChange:', { name, value });
    if (editingCard) {
      setEditingCard({ ...editingCard, [name]: value });
    } else {
      setNewCard({ ...newCard, [name]: value });
    }
    setError(null);
  };

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedAndFilteredCards = () => {
    let filtered = [...cards];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.set.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Condition filter
    if (filterCondition !== 'all') {
      filtered = filtered.filter(card => card.condition === filterCondition);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const paginatedCards = () => {
    const sorted = sortedAndFilteredCards();
    const totalPages = Math.ceil(sorted.length / cardsPerPage);
    // Ensure current page is valid
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
    const startIndex = (page - 1) * cardsPerPage;
    return sorted.slice(startIndex, startIndex + cardsPerPage);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('cards').select('*');
      if (error) throw error;
      // Ensure all cards have tags initialized as arrays
      const cardsWithTags = data.map(card => ({
        ...card,
        tags: card.tags || [] // Initialize tags as empty array if not present
      }));
      setCards(cardsWithTags);
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCard = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;
    
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
      setCards(cards.filter(card => card.id !== id));
      showNotification('Carte supprimée avec succès');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const startEdit = (card) => {
    setEditingCard(card);
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editingCard.name || !editingCard.set) {
      setError('Le nom et l\'édition sont requis');
      return;
    }

    try {
      // Update price history if price changed
      if (editingCard.price !== cards.find(c => c.id === editingCard.id).price) {
        editingCard.priceHistory = addPriceHistory(editingCard, parseFloat(editingCard.price));
      }

      // Ensure tags are initialized
      const cardToUpdate = {
        ...editingCard,
        tags: editingCard.tags || [] // Initialize tags as empty array if not present
      };

      const { error } = await supabase
        .from('cards')
        .update(cardToUpdate)
        .eq('id', editingCard.id);
      
      if (error) throw error;
      
      setCards(cards.map(card => 
        card.id === editingCard.id ? cardToUpdate : card
      ));
      
      setIsEditModalOpen(false);
      setEditingCard(null);
      showNotification('Carte mise à jour avec succès');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const addCard = async () => {
    console.log('addCard called', { newCard });
    if (!newCard.name || !newCard.set) {
      setError('Le nom et l\'édition sont requis');
      return;
    }

    setIsLoading(true);
    try {
      const cardToAdd = {
        ...newCard,
        priceHistory: newCard.price ? addPriceHistory(newCard, parseFloat(newCard.price)) : [],
        tags: [] // Ensure tags are initialized
      };

      console.log('Sending to Supabase:', cardToAdd);
      const { data, error } = await supabase.from('cards').insert([cardToAdd]).select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Supabase response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setCards(prevCards => [...prevCards, ...data]);
        // Reset pagination to show the last page where the new card will appear
        const newTotalPages = Math.ceil((cards.length + 1) / cardsPerPage);
        setPage(newTotalPages);
      }
      
      setNewCard({ 
        name: '', 
        set: '', 
        condition: '', 
        quantity: 1,
        price: '',
        notes: '',
        imageUrl: '',
        tags: [],
        priceHistory: []
      });
      showNotification('Carte ajoutée avec succès');
    } catch (error) {
      console.error('Error in addCard:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkImport = async (importedCards) => {
    setIsLoading(true);
    try {
      // Add price history and initialize tags for cards
      const cardsWithHistoryAndTags = importedCards.map(card => ({
        ...card,
        priceHistory: card.price ? addPriceHistory(card, parseFloat(card.price)) : [],
        tags: card.tags || [] // Initialize tags as empty array if not present
      }));

      const { data, error } = await supabase
        .from('cards')
        .insert(cardsWithHistoryAndTags);

      if (error) throw error;
      
      if (Array.isArray(data)) {
        setCards([...cards, ...data]);
      }
      
      showNotification(`${data.length} cartes importées avec succès`);
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAdd = (cardId, tag) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = {
      ...card,
      tags: [...(card.tags || []), tag]
    };

    handleEdit(updatedCard);
  };

  const handleTagRemove = (cardId, tag) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard = {
      ...card,
      tags: (card.tags || []).filter(t => t !== tag)
    };

    handleEdit(updatedCard);
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Édition', 'État', 'Quantité', 'Prix', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...cards.map(card => 
        [card.name, card.set, card.condition, card.quantity, card.price, card.notes]
          .map(field => `"${field || ''}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pokstore_export.csv';
    link.click();
  };

  // Update cards per page when view mode changes
  useEffect(() => {
    setCardsPerPage(viewMode === 'table' ? 10 : 12);
  }, [viewMode]);

  const renderPagination = () => {
    const totalCards = sortedAndFilteredCards().length;
    const totalPages = Math.ceil(totalCards / cardsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          title="Première page"
        >
          ⟪
        </button>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          ←
        </button>
        <div className="flex items-center gap-1">
          <span className={`${darkMode ? 'text-white' : 'text-gray-600'}`}>
            Page {page} sur {totalPages}
          </span>
          <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-400'}`}>
            ({totalCards} cartes)
          </span>
        </div>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          →
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          title="Dernière page"
        >
          ⟫
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-red-50 via-yellow-50 to-pink-50 text-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className={`backdrop-blur-sm rounded-2xl shadow-lg p-6 flex justify-between items-center transition-colors duration-300 ${
          darkMode ? 'bg-gray-800/80' : 'bg-white/80'
        }`}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
            🎴 PokéStore Manager
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              {showStats ? '📊 Masquer Stats' : '📊 Voir Stats'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              title={viewMode === 'table' ? 'Vue grille' : 'Vue tableau'}
            >
              {viewMode === 'table' ? '🔲 Vue Grille' : '📋 Vue Tableau'}
            </button>
            <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
        </header>

        {notification.message && (
          <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg backdrop-blur-sm animate-slide-in-right flex items-center gap-3 ${
            notification.type === 'error' 
              ? 'bg-red-500/90 text-white' 
              : 'bg-green-500/90 text-white'
          }`}>
            <span className="text-xl">
              {notification.type === 'error' ? '❌' : '✅'}
            </span>
            {notification.message}
          </div>
        )}

        {showStats && (
          <div className="mb-8 animate-fadeIn">
            <Statistics cards={cards} />
          </div>
        )}

        <div className={`backdrop-blur-sm p-8 rounded-2xl shadow-lg mb-8 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800/90' : 'bg-white/90'
        }`}>
          <div className={`mb-8 p-6 rounded-xl ${
            darkMode ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-red-50 to-orange-50'
          }`}>
            <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Ajouter une carte
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              addCard();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Nom
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCard.name}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="Nom de la carte"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Édition
                  </label>
                  <input
                    type="text"
                    name="set"
                    value={newCard.set}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="Édition"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    État
                  </label>
                  <select
                    name="condition"
                    value={newCard.condition}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                  >
                    <option value="">Sélectionner un état</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Quantité
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={newCard.quantity}
                    onChange={handleChange}
                    min="1"
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newCard.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    URL de l'image
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={newCard.imageUrl}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="https://"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={newCard.notes}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="Notes additionnelles..."
                  ></textarea>
                </div>
              </div>
              {error && (
                <div className="mt-4 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      ✨ Ajouter la carte
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Rechercher
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une carte..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className={`w-full p-3 pl-10 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                  }`}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">🔍</span>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                État
              </label>
              <select
                value={filterCondition}
                onChange={(e) => {
                  setFilterCondition(e.target.value);
                  setPage(1);
                }}
                className={`w-48 p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="all">Tous les états</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-4">
              <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                {sortedAndFilteredCards().length} cartes trouvées
              </div>
              <BulkImport onImport={handleBulkImport} />
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-red-50 to-orange-50'}`}>
                  <tr>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Image</th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'} cursor-pointer hover:text-red-600 transition-colors duration-200`} onClick={() => handleSort('name')}>
                      Nom {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'} cursor-pointer hover:text-red-600 transition-colors duration-200`} onClick={() => handleSort('set')}>
                      Édition {sortConfig.key === 'set' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>État</th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Quantité</th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'} cursor-pointer hover:text-red-600 transition-colors duration-200`} onClick={() => handleSort('price')}>
                      Prix {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Évolution</th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Tags</th>
                    <th className={`text-left py-4 px-4 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="9" className={`text-center py-8 ${darkMode ? 'text-white' : ''}`}>
                        <div className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Chargement...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCards().length === 0 ? (
                    <tr>
                      <td colSpan="9" className={`text-center py-8 ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                        Aucune carte trouvée 😢
                      </td>
                    </tr>
                  ) : (
                    paginatedCards().map((card) => (
                      <tr key={card.id} className={`hover:bg-gray-50 transition-colors duration-150 group ${darkMode ? 'hover:text-gray-900' : ''}`}>
                        <td className="py-4 px-4">
                          <ImagePreview url={card.imageUrl} alt={card.name} />
                        </td>
                        <td className={`py-4 px-4 font-medium ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-800'}`}>{card.name}</td>
                        <td className={`py-4 px-4 ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-600'}`}>{card.set}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'text-white group-hover:text-gray-900' : 'bg-gray-100'}`}>
                            {card.condition}
                          </span>
                        </td>
                        <td className={`py-4 px-4 ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-800'}`}>{card.quantity}</td>
                        <td className={`py-4 px-4 font-medium ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-800'}`}>{card.price ? `${card.price}€` : '-'}</td>
                        <td className="py-4 px-4">
                          <PriceHistory history={card.priceHistory} />
                        </td>
                        <td className="py-4 px-4">
                          <Tags
                            tags={card.tags || []}
                            onAdd={(tag) => handleTagAdd(card.id, tag)}
                            onRemove={(tag) => handleTagRemove(card.id, tag)}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(card)}
                              className={`${darkMode ? 'text-white group-hover:text-gray-900' : 'text-blue-600 hover:text-blue-800'} transition-colors duration-200`}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteCard(card.id)}
                              className={`${darkMode ? 'text-white group-hover:text-gray-900' : 'text-red-600 hover:text-red-800'} transition-colors duration-200`}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {renderPagination()}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {isLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Chargement...
                    </div>
                  </div>
                ) : paginatedCards().length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    Aucune carte trouvée 😢
                  </div>
                ) : (
                  paginatedCards().map((card) => (
                    <div key={card.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <span>No image</span>
                          </div>
                        )}
                      </div>
                      <div className={`p-6 ${darkMode ? 'group-hover:text-gray-900' : ''}`}>
                        <h3 className={`text-xl font-semibold mb-3 truncate hover:text-clip ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-800'}`}>{card.name}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={`${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-600'}`}>Edition:</span>
                            <span className={`font-medium ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-800'}`}>{card.set}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-600'}`}>État:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'text-white group-hover:text-gray-900' : 'bg-gray-100'}`}>
                              {card.condition || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-600'}`}>Quantité:</span>
                            <span className={`font-medium ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-800'}`}>{card.quantity || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`${darkMode ? 'text-white group-hover:text-gray-900' : 'text-gray-600'}`}>Prix:</span>
                            <span className={`font-medium text-lg ${darkMode ? 'text-white group-hover:text-gray-900' : 'text-red-600'}`}>
                              {card.price ? `${parseFloat(card.price).toFixed(2)}€` : '-'}
                            </span>
                          </div>
                          
                          {card.priceHistory && card.priceHistory.length > 0 && (
                            <div className="pt-2">
                              <PriceHistory history={card.priceHistory} />
                            </div>
                          )}
                          
                          <div className="pt-2">
                            <Tags
                              tags={card.tags || []}
                              onAdd={(tag) => handleTagAdd(card.id, tag)}
                              onRemove={(tag) => handleTagRemove(card.id, tag)}
                            />
                          </div>
                          
                          {card.notes && (
                            <div className="pt-2">
                              <p className="text-sm text-gray-500 line-clamp-2 hover:line-clamp-none">{card.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}