import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useActiveFriends, useInteractionTypes } from '../hooks/useDatabase';
import type { Encounter, Friend, InteractionType } from '../db/schema';

interface ClusterGroup {
  id: string;
  encounters: MapEncounter[];
  centerLat: number;
  centerLon: number;
  count: number;
}

// Custom marker styles
const createCustomIcon = (color: string = '#ef4444', clusterCount?: number) => {
  if (clusterCount && clusterCount > 1) {
    // Cluster marker with count
    const size = clusterCount > 99 ? 40 : clusterCount > 9 ? 36 : 32;
    const fontSize = clusterCount > 99 ? '10px' : '12px';
    
    return L.divIcon({
      html: `<div class="cluster-marker" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${fontSize}; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${clusterCount}</div>`,
      className: 'custom-cluster-icon',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  // Single encounter marker
  return L.divIcon({
    html: `<div class="custom-marker" style="background: ${color}; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 20]
  });
};

// User location marker
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `<div style="width: 16px; height: 16px; background: radial-gradient(circle, #3b82f6 0%, #1d4ed8 100%); border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); animation: pulse 2s infinite;"></div>`,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

interface MapViewProps {
  onClose: () => void;
  encounters: Encounter[];
  onViewEncounter?: (encounterId: string) => void;
}

interface MapEncounter extends Encounter {
  friendNames: string[];
  activityNames: string[];
}

// Component to handle map events and user location
function MapController({ 
  userLocation, 
  onLocationFound,
  onZoomChange
}: { 
  userLocation: { lat: number; lon: number } | null;
  onLocationFound: (location: { lat: number; lon: number }) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Try to get user location and center map on it
    if (!userLocation) {
      map.locate({ setView: true, maxZoom: 8 })
        .on('locationfound', (e) => {
          const { lat, lng } = e.latlng;
          onLocationFound({ lat, lon: lng });
          map.setView([lat, lng], 8); // Set view to user location with zoom level 8
        })
        .on('locationerror', () => {
          console.log('Location access denied or unavailable');
        });
    }

    // Track zoom changes for clustering
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    
    // Initial zoom
    onZoomChange(map.getZoom());

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, userLocation, onLocationFound, onZoomChange]);

  const centerOnUserLocation = () => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 13);
    }
  };

  return userLocation ? (
    <>
      <Marker 
        position={[userLocation.lat, userLocation.lon]} 
        icon={createUserLocationIcon()}
      >
        <Popup>
          <div className="text-center">
            <strong>Your Location</strong>
          </div>
        </Popup>
      </Marker>
      
      {/* Custom control for centering on user location */}
      <div className="leaflet-top leaflet-right" style={{ marginTop: '80px' }}>
        <div className="leaflet-control leaflet-bar">
          <button
            onClick={centerOnUserLocation}
            className="bg-white hover:bg-gray-50 p-2 text-blue-600 font-bold border-0 cursor-pointer"
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Center on my location"
          >
            📍
          </button>
        </div>
      </div>
    </>
  ) : null;
}

export default function MapViewLeaflet({ onClose, encounters, onViewEncounter }: MapViewProps) {
  const [selectedEncounter, setSelectedEncounter] = useState<MapEncounter | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapEncounters, setMapEncounters] = useState<MapEncounter[]>([]);
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  const [zoomLevel, setZoomLevel] = useState(5);

  const friends = useActiveFriends();
  const interactionTypes = useInteractionTypes();

  // Create lookup maps for performance using useMemo to prevent recreation
  const friendsMap = useMemo(() => 
    new Map(friends?.map((f: Friend) => [f.id, f]) || []), 
    [friends]
  );
  
  const typesMap = useMemo(() => 
    new Map(interactionTypes?.map((t: InteractionType) => [t.id, t]) || []), 
    [interactionTypes]
  );

  // Clustering functions - memoized to prevent infinite re-renders
  const calculateDistance = useMemo(() => 
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    }, []
  );

  const getClusterDistance = useMemo(() => 
    (zoom: number): number => {
      // More aggressive clustering at lower zoom levels
      if (zoom <= 6) return 100;   // Very wide clustering (100km)
      if (zoom <= 8) return 50;    // Wide clustering (50km)
      if (zoom <= 10) return 20;   // Medium clustering (20km)
      if (zoom <= 12) return 5;    // Tight clustering (5km)
      return 1; // Very tight clustering at high zoom (1km)
    }, []
  );

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

    // Clustering distance based on zoom level (in km)
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
  }, [mapEncounters, zoomLevel, calculateDistance, getClusterDistance]);

  // Calculate initial center - prefer user location, then encounters, then NYC
  const initialCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon]
    : mapEncounters.length > 0 
    ? [
        mapEncounters.reduce((sum, e) => sum + e.location!.lat, 0) / mapEncounters.length,
        mapEncounters.reduce((sum, e) => sum + e.location!.lon, 0) / mapEncounters.length
      ]
    : [40.7128, -74.0060]; // NYC default

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 pt-8 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] h-[600px] flex flex-col my-4">
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
        <div className="flex-1 relative min-h-0">
          <MapContainer
            center={initialCenter}
            zoom={5}
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
            zoomControl={true}
            scrollWheelZoom={true}
            touchZoom={true}
            doubleClickZoom={true}
            dragging={true}
          >
            {/* OpenStreetMap tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Map controller for user location and events */}
            <MapController 
              userLocation={userLocation}
              onLocationFound={setUserLocation}
              onZoomChange={setZoomLevel}
            />

            {/* Cluster markers */}
            {clusters.map((cluster) => {
              if (cluster.count === 1) {
                // Single encounter - show as regular marker
                const encounter = cluster.encounters[0];
                return (
                  <Marker
                    key={encounter.id}
                    position={[encounter.location!.lat, encounter.location!.lon]}
                    icon={createCustomIcon('#ef4444')}
                    eventHandlers={{
                      click: () => setSelectedEncounter(encounter),
                    }}
                  >
                    <Popup>
                      <div className="min-w-64">
                        <div className="font-bold text-lg mb-2">
                          {new Date(encounter.date).toLocaleDateString()}
                        </div>
                        
                        {encounter.location?.place && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            📍 {encounter.location.place}
                          </div>
                        )}

                        <div className="text-sm mb-2">
                          <strong>Participants:</strong> {encounter.friendNames.length > 0 ? encounter.friendNames.join(', ') : 'Solo'}
                        </div>

                        <div className="text-sm mb-2">
                          <strong>Activities:</strong> {encounter.activityNames.join(', ')}
                        </div>

                        {encounter.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t">
                            {encounter.notes.length > 100 
                              ? `${encounter.notes.substring(0, 100)}...` 
                              : encounter.notes
                            }
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                          {encounter.location!.lat.toFixed(4)}, {encounter.location!.lon.toFixed(4)}
                        </div>

                        {onViewEncounter && (
                          <div className="mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                onViewEncounter(encounter.id?.toString() || '');
                                onClose();
                              }}
                              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              View Full Encounter
                            </button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              } else {
                // Multiple encounters - show as cluster
                return (
                  <Marker
                    key={cluster.id}
                    position={[cluster.centerLat, cluster.centerLon]}
                    icon={createCustomIcon('#f97316', cluster.count)}
                    eventHandlers={{
                      click: () => setSelectedCluster(cluster),
                    }}
                  >
                    <Popup>
                      <div className="min-w-64">
                        <div className="font-bold text-lg mb-2">
                          Cluster ({cluster.count} encounters)
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Center: {cluster.centerLat.toFixed(4)}, {cluster.centerLon.toFixed(4)}
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {cluster.encounters.map((encounter) => (
                            <div 
                              key={encounter.id} 
                              className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                              onClick={() => {
                                setSelectedEncounter(encounter);
                                setSelectedCluster(null);
                              }}
                            >
                              <div className="font-medium text-sm">
                                {new Date(encounter.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
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
                    </Popup>
                  </Marker>
                );
              }
            })}
          </MapContainer>
        </div>

        {/* Selected Cluster Details (Bottom Panel) */}
        {selectedCluster && selectedCluster.count > 1 && (
          <div className="p-4 border-t max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700 flex-shrink-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">
                Cluster ({selectedCluster.count} encounters)
              </h3>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Center: {selectedCluster.centerLat.toFixed(4)}, {selectedCluster.centerLon.toFixed(4)}
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {selectedCluster.encounters.map((encounter) => (
                <div 
                  key={encounter.id} 
                  className="p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
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

        {/* Selected Encounter Details (Bottom Panel) */}
        {selectedEncounter && (
          <div className="p-4 border-t max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700 flex-shrink-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">Encounter Details</h3>
              <button
                onClick={() => setSelectedEncounter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</div>
                <div className="text-sm">{new Date(selectedEncounter.date).toLocaleDateString()}</div>
              </div>
              
              {selectedEncounter.location?.place && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</div>
                  <div className="text-sm">{selectedEncounter.location.place}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Participants</div>
                <div className="text-sm">{selectedEncounter.friendNames.length > 0 ? selectedEncounter.friendNames.join(', ') : 'Solo'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Activities</div>
                <div className="text-sm">{selectedEncounter.activityNames.join(', ')}</div>
              </div>
            </div>

            {selectedEncounter.notes && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded">
                  {selectedEncounter.notes}
                </div>
              </div>
            )}

            {onViewEncounter && (
              <div className="mt-4 pt-3 border-t">
                <button
                  onClick={() => {
                    onViewEncounter(selectedEncounter.id?.toString() || '');
                    onClose();
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
                >
                  View Full Encounter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}