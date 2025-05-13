import React from 'react';

export default function DarkModeToggle({ darkMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="bg-gradient-to-r from-gray-700 to-gray-800 dark:from-yellow-400 dark:to-orange-400 text-white dark:text-gray-800 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
      title={darkMode ? "Mode clair" : "Mode sombre"}
    >
      {darkMode ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
    </button>
  );
} 