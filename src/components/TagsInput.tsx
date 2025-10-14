import { useState } from 'react';

interface TagsInputProps {
  tags: string;
  onTagsChange: (tags: string) => void;
  availableTags: string[];
  className?: string;
}

export default function TagsInput({
  tags,
  onTagsChange,
  availableTags,
  className = ''
}: TagsInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(tags);

  const currentTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  const filteredSuggestions = availableTags.filter(tag =>
    !currentTags.includes(tag) &&
    tag.toLowerCase().includes(inputValue.split(',').pop()?.trim().toLowerCase() || '')
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onTagsChange(value);
    setShowSuggestions(value.length > 0);
  };

  const addTag = (tag: string) => {
    const newTags = [...currentTags, tag].join(', ');
    setInputValue(newTags);
    onTagsChange(newTags);
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove).join(', ');
    setInputValue(newTags);
    onTagsChange(newTags);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium mb-1">
        Tags 
        <span className="text-xs text-gray-500 ml-2">(comma separated)</span>
      </label>

      {/* Current Tags Display */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {currentTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
          placeholder="Add tags like: first-time, regular, hotel, kinky..."
        />

        {/* Tag Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-32 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((tag, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <span className="font-medium">{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Buttons for Popular Tags */}
      <div className="flex flex-wrap gap-1">
        {availableTags.slice(0, 6).map((tag, index) => (
          !currentTags.includes(tag) && (
            <button
              key={index}
              type="button"
              onClick={() => addTag(tag)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {tag}
            </button>
          )
        ))}
      </div>
    </div>
  );
}