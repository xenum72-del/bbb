import { useState, useEffect, useMemo, useRef } from 'react';
import { useActiveFriends, useInteractionTypes } from '../hooks/useDatabase';
import type { Encounter } from '../db/schema';

interface MapViewProps {
  onClose: () => void;
  encounters: Encounter[];
}

interface MapEncounter extends Encounter {
  friendNames: string[];
  activityNames: string[];
}

interface ClusterGroup {
  id: string;
  encounters: MapEncounter[];
  centerLat: number;
  centerLon: number;
  count: number;
}

export default function MapView({ onClose, encounters }: MapViewProps) {
  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapEncounters, setMapEncounters] = useState<MapEncounter[]>([]);
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [centerLat, setCenterLat] = useState(40.7128); // Default to NYC
  const [centerLon, setCenterLon] = useState(-74.0060);
  const [selectedEncounter, setSelectedEncounter] = useState<MapEncounter | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; lat: number; lon: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Create maps for quick lookup
  const friendsMap = useMemo(() => new Map(friends.map(f => [f.id!, f])), [friends]); 
  const typesMap = useMemo(() => new Map(interactionTypes.map(t => [t.id!, t])), [interactionTypes]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          setCenterLat(latitude);
          setCenterLon(longitude);
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
        }
      );
    }
  }, []);

  // Process encounters to add friend names and activity names
  useEffect(() => {
    const processedEncounters: MapEncounter[] = encounters
      .filter(encounter => encounter.location) // Only encounters with location
      .map(encounter => {
        const friendNames = encounter.participants
          .map(id => friendsMap.get(id)?.name || 'Unknown')
          .filter(name => name !== 'Unknown');
        
        const activities = encounter.activitiesPerformed 
          ? encounter.activitiesPerformed.map(id => typesMap.get(id)).filter(Boolean)
          : [typesMap.get(encounter.typeId)].filter(Boolean);
        
        const activityNames = activities.map(activity => activity!.name);

        return {
          ...encounter,
          friendNames,
          activityNames: activityNames.length > 0 ? activityNames : ['Encounter']
        };
      });

    setMapEncounters(processedEncounters);
  }, [encounters, friendsMap, typesMap]);

  // Clustering logic based on zoom level
  useEffect(() => {
    if (mapEncounters.length === 0) return;

    // Clustering distance based on zoom level (in degrees)
    const clusterDistance = getClusterDistance(zoomLevel);
    
    const clusteredGroups: ClusterGroup[] = [];
    const processed = new Set<number>();

    mapEncounters.forEach((encounter, index) => {
      if (processed.has(index) || !encounter.location) return;

      const cluster: MapEncounter[] = [encounter];
      processed.add(index);

      // Find nearby encounters to cluster
      mapEncounters.forEach((otherEncounter, otherIndex) => {
        if (processed.has(otherIndex) || !otherEncounter.location || index === otherIndex) return;

        const distance = calculateDistance(
          encounter.location!.lat, encounter.location!.lon,
          otherEncounter.location!.lat, otherEncounter.location!.lon
        );

        if (distance <= clusterDistance) {
          cluster.push(otherEncounter);
          processed.add(otherIndex);
        }
      });

      // Calculate cluster center
      const centerLat = cluster.reduce((sum, e) => sum + e.location!.lat, 0) / cluster.length;
      const centerLon = cluster.reduce((sum, e) => sum + e.location!.lon, 0) / cluster.length;

      clusteredGroups.push({
        id: `cluster-${index}`,
        encounters: cluster,
        centerLat,
        centerLon,
        count: cluster.length
      });
    });

    setClusters(clusteredGroups);
  }, [mapEncounters, zoomLevel]);

  const getClusterDistance = (zoom: number): number => {
    // More aggressive clustering at lower zoom levels
    if (zoom <= 8) return 2.0;   // Very wide clustering
    if (zoom <= 10) return 1.0;  // Wide clustering  
    if (zoom <= 12) return 0.5;  // Medium clustering
    if (zoom <= 14) return 0.1;  // Tight clustering
    return 0.05; // Very tight clustering at high zoom
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const getMapBounds = () => {
    // Calculate bounds based on zoom and center
    const zoomFactor = Math.pow(2, 15 - zoomLevel);
    const latRange = 0.01 * zoomFactor;
    const lonRange = 0.01 * zoomFactor;
    
    return {
      north: centerLat + latRange,
      south: centerLat - latRange,
      east: centerLon + lonRange,
      west: centerLon - lonRange
    };
  };

  const isInView = (lat: number, lon: number) => {
    const bounds = getMapBounds();
    return lat >= bounds.south && lat <= bounds.north && 
           lon >= bounds.west && lon <= bounds.east;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 3));
  };

  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const panDistance = 0.01 * Math.pow(2, 15 - zoomLevel);
    
    switch (direction) {
      case 'up':
        setCenterLat(prev => prev + panDistance);
        break;
      case 'down':
        setCenterLat(prev => prev - panDistance);
        break;
      case 'left':
        setCenterLon(prev => prev - panDistance);
        break;
      case 'right':
        setCenterLon(prev => prev + panDistance);
        break;
    }
  };

  const handleClusterClick = (cluster: ClusterGroup, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent map drag
    
    if (cluster.count === 1) {
      setSelectedEncounter(cluster.encounters[0]);
    } else {
      // Show cluster details or zoom in
      if (selectedCluster?.id === cluster.id) {
        // If same cluster clicked again, zoom in
        setCenterLat(cluster.centerLat);
        setCenterLon(cluster.centerLon);
        setZoomLevel(prev => Math.min(prev + 2, 18));
        setSelectedCluster(null);
      } else {
        // Show cluster details
        setSelectedCluster(cluster);
      }
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setCenterLat(userLocation.lat);
      setCenterLon(userLocation.lon);
      setZoomLevel(13);
    }
  };

  // Touch distance calculation for pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Mouse and touch event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    setIsDragging(true);
    const rect = mapRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      lat: centerLat,
      lon: centerLon
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - rect.left) - dragStart.x;
    const deltaY = (e.clientY - rect.top) - dragStart.y;
    
    // Convert pixel delta to coordinate delta (simple approximation)
    const zoomFactor = Math.pow(2, 15 - zoomLevel);
    const latDelta = -(deltaY / rect.height) * (0.02 * zoomFactor);
    const lonDelta = (deltaX / rect.width) * (0.02 * zoomFactor);
    
    setCenterLat(dragStart.lat + latDelta);
    setCenterLon(dragStart.lon + lonDelta);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!mapRef.current) return;
    
    if (e.touches.length === 1) {
      // Single touch - start drag
      const touch = e.touches[0];
      const rect = mapRef.current.getBoundingClientRect();
      setDragStart({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        lat: centerLat,
        lon: centerLon
      });
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // Two touches - start pinch
      setLastTouchDistance(getTouchDistance(e.touches));
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    
    if (!mapRef.current) return;

    if (e.touches.length === 1 && isDragging && dragStart) {
      // Single touch drag
      const touch = e.touches[0];
      const rect = mapRef.current.getBoundingClientRect();
      const deltaX = (touch.clientX - rect.left) - dragStart.x;
      const deltaY = (touch.clientY - rect.top) - dragStart.y;
      
      const zoomFactor = Math.pow(2, 15 - zoomLevel);
      const latDelta = -(deltaY / rect.height) * (0.02 * zoomFactor);
      const lonDelta = (deltaX / rect.width) * (0.02 * zoomFactor);
      
      setCenterLat(dragStart.lat + latDelta);
      setCenterLon(dragStart.lon + lonDelta);
    } else if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch to zoom
      const currentDistance = getTouchDistance(e.touches);
      const scaleFactor = currentDistance / lastTouchDistance;
      
      if (scaleFactor > 1.1) {
        // Zoom in
        setZoomLevel(prev => Math.min(prev + 1, 18));
        setLastTouchDistance(currentDistance);
      } else if (scaleFactor < 0.9) {
        // Zoom out
        setZoomLevel(prev => Math.max(prev - 1, 3));
        setLastTouchDistance(currentDistance);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStart(null);
    setLastTouchDistance(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Encounter Map</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {mapEncounters.length} encounters with locations
            </span>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative map-container">
          {/* Simple coordinate-based map visualization */}
          <div 
            ref={mapRef}
            className="absolute inset-0 overflow-hidden cursor-grab select-none"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Grid lines for reference */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 10}%` }} />
              ))}
              {[...Array(10)].map((_, i) => (
                <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 10}%` }} />
              ))}
            </div>

            {/* User location indicator */}
            {userLocation && isInView(userLocation.lat, userLocation.lon) && (
              <div
                className="absolute w-4 h-4 user-location-pin rounded-full border-2 border-white shadow-lg z-10"
                style={{
                  left: `${((userLocation.lon - getMapBounds().west) / (getMapBounds().east - getMapBounds().west)) * 100}%`,
                  top: `${((getMapBounds().north - userLocation.lat) / (getMapBounds().north - getMapBounds().south)) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title="Your Location"
              />
            )}

            {/* Encounter clusters */}
            {clusters.map(cluster => {
              if (!isInView(cluster.centerLat, cluster.centerLon)) return null;

              const x = ((cluster.centerLon - getMapBounds().west) / (getMapBounds().east - getMapBounds().west)) * 100;
              const y = ((getMapBounds().north - cluster.centerLat) / (getMapBounds().north - getMapBounds().south)) * 100;

              return (
                <button
                  key={cluster.id}
                  onClick={(e) => handleClusterClick(cluster, e)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${
                    cluster.count === 1 
                      ? 'w-6 h-6 bg-red-500 map-pin' 
                      : 'w-8 h-8 map-cluster flex items-center justify-center text-white text-xs font-bold'
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`
                  }}
                  title={cluster.count === 1 
                    ? `${cluster.encounters[0].activityNames[0]} at ${cluster.encounters[0].location?.place}`
                    : `${cluster.count} encounters in this area`
                  }
                >
                  {cluster.count > 1 && cluster.count}
                </button>
              );
            })}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow hover:shadow-md flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow hover:shadow-md flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
            {userLocation && (
              <button
                onClick={centerOnUserLocation}
                className="w-8 h-8 bg-blue-500 text-white rounded shadow hover:shadow-md flex items-center justify-center text-sm"
                title="Center on my location"
              >
                📍
              </button>
            )}
          </div>

          {/* Pan Controls */}
          <div className="absolute bottom-4 right-4">
            <div className="grid grid-cols-3 gap-1">
              <div></div>
              <button onClick={() => handlePan('up')} className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow flex items-center justify-center">↑</button>
              <div></div>
              <button onClick={() => handlePan('left')} className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow flex items-center justify-center">←</button>
              <div className="w-8 h-8"></div>
              <button onClick={() => handlePan('right')} className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow flex items-center justify-center">→</button>
              <div></div>
              <button onClick={() => handlePan('down')} className="w-8 h-8 bg-white dark:bg-gray-700 rounded shadow flex items-center justify-center">↓</button>
              <div></div>
            </div>
          </div>

          {/* Zoom level indicator */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-700 px-2 py-1 rounded shadow text-sm">
            Zoom: {zoomLevel}
          </div>

          {/* Coordinates display */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-700 px-2 py-1 rounded shadow text-xs">
            {centerLat.toFixed(4)}, {centerLon.toFixed(4)}
          </div>

          {/* Scale indicator */}
          <div className="absolute bottom-16 left-4 bg-white dark:bg-gray-700 px-2 py-1 rounded shadow text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-px bg-gray-600 dark:bg-gray-300"></div>
              <span>
                {zoomLevel >= 15 ? '100m' : 
                 zoomLevel >= 12 ? '1km' : 
                 zoomLevel >= 10 ? '10km' : 
                 zoomLevel >= 8 ? '50km' : '100km'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Cluster Details */}
        {selectedCluster && selectedCluster.count > 1 && (
          <div className="p-4 border-t max-h-48 overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">
                Cluster ({selectedCluster.count} encounters)
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCenterLat(selectedCluster.centerLat);
                    setCenterLon(selectedCluster.centerLon);
                    setZoomLevel(prev => Math.min(prev + 2, 18));
                    setSelectedCluster(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Zoom In
                </button>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Center: {selectedCluster.centerLat.toFixed(4)}, {selectedCluster.centerLon.toFixed(4)}
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {selectedCluster.encounters.map((encounter) => (
                <div 
                  key={encounter.id} 
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setSelectedEncounter(encounter);
                    setSelectedCluster(null);
                  }}
                >
                  <div className="font-medium">
                    {new Date(encounter.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {encounter.friendNames.length > 0 ? encounter.friendNames.join(', ') : 'Solo'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {encounter.activityNames.slice(0, 2).join(', ')}
                    {encounter.activityNames.length > 2 && ` +${encounter.activityNames.length - 2} more`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Encounter Details */}
        {selectedEncounter && (
          <div className="p-4 border-t max-h-48 overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">Encounter Details</h3>
              <button
                onClick={() => setSelectedEncounter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Date:</strong> {new Date(selectedEncounter.date).toLocaleDateString()}
              </div>
              <div>
                <strong>Rating:</strong> {'⭐'.repeat(selectedEncounter.rating)}
              </div>
              <div>
                <strong>Location:</strong> {selectedEncounter.location?.place}
              </div>
              <div>
                <strong>Activities:</strong> {selectedEncounter.activityNames.slice(0, 2).join(', ')}
                {selectedEncounter.activityNames.length > 2 && ` + ${selectedEncounter.activityNames.length - 2} more`}
              </div>
              <div>
                <strong>Participants:</strong> {
                  selectedEncounter.isAnonymous 
                    ? 'Anonymous' 
                    : selectedEncounter.friendNames.length > 0 
                      ? selectedEncounter.friendNames.join(', ')
                      : 'Solo'
                }
              </div>
              <div>
                <strong>Beneficiary:</strong> <span className="capitalize">{selectedEncounter.beneficiary}</span>
              </div>
            </div>
            {selectedEncounter.notes && (
              <div className="mt-2">
                <strong>Notes:</strong> <span className="text-gray-700 dark:text-gray-300">{selectedEncounter.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}