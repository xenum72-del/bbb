import { useState, useRef, useEffect } from 'react';

interface LocationData {
  lat: string;
  lon: string;
  place: string;
}

interface LocationInputProps {
  location: LocationData;
  onLocationChange: (location: LocationData) => void;
  className?: string;
  enableOnlineGeocoding?: boolean;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationInput({
  location,
  onLocationChange,
  className = '',
  enableOnlineGeocoding = false
}: LocationInputProps) {
  const [locationState, setLocationState] = useState({
    suggestions: [] as LocationSuggestion[],
    isSearching: false,
    showCurrentLocation: false,
    hasSearched: false,
    lastSearchQuery: ''
  });
  
  const searchTimeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLocationSearch = async (value: string) => {
    onLocationChange({ ...location, place: value });

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length > 2 && enableOnlineGeocoding) {
      // Debounce the search to avoid rate limiting
      searchTimeoutRef.current = window.setTimeout(async () => {
        try {
          setLocationState(ls => ({ ...ls, isSearching: true, hasSearched: false }));
          
          // Use a more permissive search without country restriction
          // Add proper headers to avoid blocking
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1&extratags=1`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'EncounterLedger/1.0',
              }
            }
          );
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          const suggestions = data.map((item: LocationSuggestion) => ({
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon
          }));
          setLocationState(ls => ({ ...ls, suggestions, isSearching: false, hasSearched: true, lastSearchQuery: value }));
        } catch (error) {
          console.log('Location search failed:', error);
          setLocationState(ls => ({ ...ls, isSearching: false, suggestions: [], hasSearched: true, lastSearchQuery: value }));
          
          // Show user-friendly error message for common issues
          if (error instanceof Error) {
            if (error.message.includes('429')) {
              console.warn('Location search rate limited. Please wait a moment before searching again.');
            } else if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
              console.warn('Location search blocked by browser security. Service may be temporarily unavailable.');
            } else if (error.message.includes('Load failed')) {
              console.warn('Location search service temporarily unavailable. Please try again later.');
            }
          }
        }
      }, 500); // 500ms debounce
    } else {
      setLocationState(ls => ({ ...ls, suggestions: [], hasSearched: false }));
    }
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    onLocationChange({
      lat: suggestion.lat,
      lon: suggestion.lon,
      place: suggestion.display_name
    });
    setLocationState(ls => ({ ...ls, suggestions: [], hasSearched: false }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLocationState(ls => ({ ...ls, showCurrentLocation: true }));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Only use reverse geocoding if online features enabled
        if (enableOnlineGeocoding) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'EncounterLedger/1.0',
                }
              }
            );
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            onLocationChange({
              lat: latitude.toString(),
              lon: longitude.toString(),
              place: data.display_name || `${latitude}, ${longitude}`
            });
          } catch (error) {
            console.log('Reverse geocoding failed:', error);
            onLocationChange({
              lat: latitude.toString(),
              lon: longitude.toString(),
              place: `${latitude}, ${longitude}`
            });
            
            // Show user-friendly error message for rate limiting
            if (error instanceof Error && error.message.includes('429')) {
              console.warn('Location service rate limited. Coordinates saved without address.');
            }
          }
        } else {
          onLocationChange({
            lat: latitude.toString(),
            lon: longitude.toString(),
            place: `${latitude}, ${longitude}`
          });
        }
        
        setLocationState(ls => ({ ...ls, showCurrentLocation: false }));
      },
      (error) => {
        console.log('Geolocation error:', error);
        setLocationState(ls => ({ ...ls, showCurrentLocation: false }));
        alert('Unable to retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium mb-1">
        Location 
        <span className="text-xs text-gray-500 ml-2">(optional)</span>
      </label>

      <div className="relative">
        {/* Location Input */}
        <input
          type="text"
          placeholder="🌍 Enter location or address..."
          value={location.place}
          onChange={(e) => handleLocationSearch(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
        />

        {/* Current Location Button */}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={locationState.showCurrentLocation}
          className="absolute right-2 top-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          title="Use current location"
        >
          {locationState.showCurrentLocation ? '📍...' : '📍'}
        </button>

        {/* Loading Indicator */}
        {locationState.isSearching && (
          <div className="absolute right-8 top-2 text-sm text-gray-500">
            Searching...
          </div>
        )}

        {/* Location Suggestions */}
        {locationState.suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {locationState.suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectLocation(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="font-medium text-sm">{suggestion.display_name}</div>
                <div className="text-xs text-gray-500">{suggestion.lat}, {suggestion.lon}</div>
              </button>
            ))}
          </div>
        )}

        {/* No Suggestions Message (when enabled but no results) */}
        {enableOnlineGeocoding && 
         locationState.hasSearched && 
         !locationState.isSearching && 
         locationState.suggestions.length === 0 && 
         locationState.lastSearchQuery === location.place && 
         location.place.length > 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No locations found. You can still enter manually.
            </div>
          </div>
        )}
      </div>

      {/* Coordinates Display */}
      {location.lat && location.lon && (
        <div className="text-xs text-gray-500 flex justify-between">
          <span>📍 {location.lat}, {location.lon}</span>
          <button
            type="button"
            onClick={() => onLocationChange({ lat: '', lon: '', place: '' })}
            className="text-red-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}