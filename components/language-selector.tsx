// Language Selector Component
// Provides dropdown selection for supported languages with persistence

import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { 
  SupportedLanguageCode, 
  LANGUAGE_OPTIONS, 
  STORAGE_KEYS 
} from '@/lib/drug-explanation-frontend-types';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguageCode;
  onLanguageChange: (language: SupportedLanguageCode) => void;
  disabled?: boolean;
  className?: string;
  showNativeNames?: boolean;
}

export function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  disabled = false, 
  className = '',
  showNativeNames = true 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = LANGUAGE_OPTIONS.find(opt => opt.code === selectedLanguage);

  const handleLanguageSelect = (language: SupportedLanguageCode) => {
    onLanguageChange(language);
    setIsOpen(false);
    
    // Persist selection to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element)?.closest('[data-language-selector]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div 
      className={`relative inline-block text-left ${className}`}
      data-language-selector
    >
      <div>
        <button
          type="button"
          className={`inline-flex items-center justify-between w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select explanation language"
        >
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <span>
              {selectedOption?.label}
              {showNativeNames && selectedOption?.native !== selectedOption?.label && (
                <span className="text-gray-500 text-xs ml-1">
                  ({selectedOption?.native})
                </span>
              )}
            </span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="listbox">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  option.code === selectedLanguage 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-700'
                }`}
                role="option"
                aria-selected={option.code === selectedLanguage}
                onClick={() => handleLanguageSelect(option.code)}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {showNativeNames && option.native !== option.label && (
                    <span className="text-gray-500 text-xs">
                      {option.native}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing language selection with persistence
export function useLanguageSelection(defaultLanguage: SupportedLanguageCode = 'en') {
  const [selectedLanguage, setSelectedLanguage] = React.useState<SupportedLanguageCode>(defaultLanguage);

  // Load persisted language on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_LANGUAGE) as SupportedLanguageCode;
      if (saved && LANGUAGE_OPTIONS.some(opt => opt.code === saved)) {
        setSelectedLanguage(saved);
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }
  }, []);

  const handleLanguageChange = React.useCallback((language: SupportedLanguageCode) => {
    setSelectedLanguage(language);
  }, []);

  return {
    selectedLanguage,
    onLanguageChange: handleLanguageChange
  };
}