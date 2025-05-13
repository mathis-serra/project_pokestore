import React, { useState } from 'react';

export default function ImagePreview({ url, alt }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!url) return null;

  return (
    <>
      <img
        src={url}
        alt={alt}
        className="w-12 h-12 object-cover rounded cursor-pointer"
        onClick={() => setIsOpen(true)}
      />
      
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={url}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
} 