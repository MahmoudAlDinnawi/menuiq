import React from 'react';

const ItemTypeSelector = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Choose Item Type</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-white/80">Select the type of menu item you want to create</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Item Option */}
            <button
              onClick={() => onSelect('single')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Single Item</h3>
                <p className="text-gray-600 text-sm">
                  A regular menu item with its own price, nutrition info, and complete details
                </p>
                <div className="mt-4 space-y-1 text-left">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-green-500">✓</span> Full nutrition information
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-green-500">✓</span> Individual pricing
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-green-500">✓</span> Culinary details & pairings
                  </p>
                </div>
              </div>
            </button>

            {/* Multi Item Option */}
            <button
              onClick={() => onSelect('multi')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-colors">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Multi Item</h3>
                <p className="text-gray-600 text-sm">
                  A collection of single items grouped together with automatic price range
                </p>
                <div className="mt-4 space-y-1 text-left">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-purple-500">✓</span> Contains multiple items
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-purple-500">✓</span> Automatic price range
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-purple-500">✓</span> Basic info & dietary only
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemTypeSelector;