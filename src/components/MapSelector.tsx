import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface MapSelectorProps {
  initialPosition?: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

// Hook géolocalisation unifié
const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getCurrentPosition = useCallback((): Promise<{ lat: number; lng: number }> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'La géolocalisation n\'est pas supportée par ce navigateur';
        setError(errorMsg);
        setLoading(false);
        reject(new Error(errorMsg));
        return;
      }

      console.log('🔍 Demande de géolocalisation...');

      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // Réduit à 10s
        maximumAge: 60000 // Réduit à 1min
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log('✅ Position obtenue:', { 
            lat, 
            lng, 
            accuracy: position.coords.accuracy + 'm',
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          
          setSuccess(true);
          setLoading(false);
          
          // IMPORTANT: Résoudre avec les bonnes propriétés
          resolve({ lat, lng });
        },
        (error) => {
          console.error('❌ Erreur géolocalisation:', error);
          
          let errorMsg = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre localisation.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Position non disponible. Vérifiez votre connexion et les services de localisation.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Délai d\'attente dépassé. Réessayez ou sélectionnez manuellement sur la carte.';
              break;
          }
          
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        },
        options
      );
    });
  }, []);

  return { getCurrentPosition, loading, error, success };
};

// Composant de carte simplifié avec OpenStreetMap
const InteractiveMap: React.FC<{
  center: [number, number];
  marker: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
}> = ({ center, marker, onMapClick }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    if (!L) {
      console.error('Leaflet n\'est pas chargé');
      return;
    }

    console.log('🗺️ Initialisation carte avec centre:', center);

    const mapInstance = L.map(mapRef.current, {
      center: center,
      zoom: 15, // Zoom plus proche
      zoomControl: true,
      attributionControl: true
    });

    // Ajout des tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    // Gestionnaire de clic sur la carte
    mapInstance.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      console.log('📍 Clic sur la carte:', { lat, lng });
      onMapClick(lat, lng);
    });

    setMap(mapInstance);

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Mise à jour du centre de la carte
  useEffect(() => {
    if (map && center) {
      console.log('🎯 Mise à jour centre carte:', center);
      map.setView(center, map.getZoom()); // Garde le zoom actuel
    }
  }, [map, center]);

  // Gestion du marqueur
  useEffect(() => {
    if (!map) return;

    const L = (window as any).L;
    
    // Supprimer l'ancien marqueur
    if (markerInstance) {
      map.removeLayer(markerInstance);
      setMarkerInstance(null);
    }

    // Ajouter le nouveau marqueur
    if (marker) {
      console.log('📌 Ajout marqueur:', marker);
      const newMarker = L.marker(marker, {
        draggable: true // Marqueur déplaçable
      }).addTo(map);
      
      // Écouter le drag du marqueur
      newMarker.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        console.log('📌 Marqueur déplacé:', { lat: position.lat, lng: position.lng });
        onMapClick(position.lat, position.lng);
      });
      
      setMarkerInstance(newMarker);
    }
  }, [map, marker, onMapClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

export const MapSelector: React.FC<MapSelectorProps> = ({ 
  initialPosition = { lat: 33.5731, lng: -7.5898 }, // Casablanca par défaut
  onPositionChange,
  onAddressChange
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialPosition.lat, 
    initialPosition.lng
  ]);
  const [currentMarker, setCurrentMarker] = useState<[number, number] | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  const { getCurrentPosition, loading, error, success } = useGeolocation();

  // Chargement de Leaflet
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const loadLeaflet = () => {
      // CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // JavaScript
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.log('✅ Leaflet chargé');
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  // Mise à jour de la position initiale
  useEffect(() => {
    console.log('🎯 Position initiale reçue:', initialPosition);
    if (initialPosition.lat !== 0 && initialPosition.lng !== 0) {
      const newCenter: [number, number] = [initialPosition.lat, initialPosition.lng];
      setMapCenter(newCenter);
      setCurrentMarker(newCenter);
    }
  }, [initialPosition]);

  const handleGetCurrentLocation = async () => {
    try {
      console.log('🔍 Demande de géolocalisation...');
      const position = await getCurrentPosition();
      
      console.log('✅ Position reçue:', position);
      
      // Vérifier que les coordonnées sont valides
      if (!position.lat || !position.lng) {
        console.error('❌ Coordonnées invalides:', position);
        return;
      }
      
      const newCenter: [number, number] = [position.lat, position.lng];
      
      console.log('📍 Mise à jour position:', newCenter);
      
      setMapCenter(newCenter);
      setCurrentMarker(newCenter);
      onPositionChange(position.lat, position.lng);
      
      // Obtenir l'adresse
      if (onAddressChange) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            console.log('🏠 Adresse trouvée:', data.display_name);
            onAddressChange(data.display_name);
          }
        } catch (error) {
          console.error('Erreur géocodage:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention de la position:', error);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    console.log('📍 Clic carte traité:', { lat, lng });
    
    const newMarker: [number, number] = [lat, lng];
    setCurrentMarker(newMarker);
    onPositionChange(lat, lng);
    
    // Géocodage inverse
    if (onAddressChange) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          console.log('🏠 Adresse trouvée:', data.display_name);
          onAddressChange(data.display_name);
        }
      } catch (error) {
        console.error('Erreur géocodage:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton géolocalisation avec état */}
      <div className="flex flex-col items-center space-y-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading || !leafletLoaded}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
            loading
              ? 'bg-blue-500 text-white cursor-not-allowed'
              : success
              ? 'bg-green-600 text-white hover:bg-green-700'
              : error
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${!leafletLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <MapPin className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          <span>
            {!leafletLoaded 
              ? 'Chargement de la carte...'
              : loading 
              ? 'Localisation en cours...' 
              : success 
              ? 'Position détectée ✓' 
              : 'Utiliser ma position actuelle'
            }
          </span>
        </button>

        {/* Messages d'état */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Position détectée avec succès !</span>
          </div>
        )}
      </div>

      {/* Carte */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm">
        {leafletLoaded ? (
          <InteractiveMap
            center={mapCenter}
            marker={currentMarker}
            onMapClick={handleMapClick}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        )}
      </div>

      {/* Informations de débogage */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>Centre de la carte:</strong> {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}</p>
        {currentMarker && (
          <p><strong>Marqueur:</strong> {currentMarker[0].toFixed(6)}, {currentMarker[1].toFixed(6)}</p>
        )}
        <p><strong>Position initiale:</strong> {initialPosition.lat.toFixed(6)}, {initialPosition.lng.toFixed(6)}</p>
      </div>

      
    </div>
  );
};