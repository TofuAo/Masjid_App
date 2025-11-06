import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

const GoogleMapPicker = ({ 
  latitude, 
  longitude, 
  radius, 
  onLocationChange, 
  onRadiusChange,
  height = '400px' 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps) {
      setError('Google Maps tidak tersedia');
      setIsLoading(false);
      return;
    }

    if (!mapRef.current) {
      return;
    }

    const defaultLat = parseFloat(latitude) || 3.8157;
    const defaultLng = parseFloat(longitude) || 103.3239;
    const defaultRadius = parseFloat(radius) || 500;

    const mapOptions = {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = newMap;

    // Create marker
    const newMarker = new window.google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map: newMap,
      draggable: true,
      title: 'Lokasi Masjid',
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = newMarker;

    // Create circle for radius
    const newCircle = new window.google.maps.Circle({
      strokeColor: '#10b981',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#10b981',
      fillOpacity: 0.15,
      map: newMap,
      center: { lat: defaultLat, lng: defaultLng },
      radius: defaultRadius,
    });
    circleRef.current = newCircle;

    // Update location when marker is dragged
    newMarker.addListener('dragend', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      if (onLocationChange) {
        onLocationChange(newLat, newLng);
      }
      
      // Update circle center
      newCircle.setCenter({ lat: newLat, lng: newLng });
    });

    // Update location when map is clicked
    newMap.addListener('click', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      newMarker.setPosition({ lat: newLat, lng: newLng });
      if (onLocationChange) {
        onLocationChange(newLat, newLng);
      }
      
      // Update circle center
      newCircle.setCenter({ lat: newLat, lng: newLng });
    });

    setIsLoading(false);
    setMapLoaded(true);
  }, [latitude, longitude, radius, onLocationChange]);

  // Initialize Google Maps
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Check if we have an API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === '' || apiKey === 'AIzaSyDummyKey') {
      setError('Google Maps API key tidak dikonfigurasi. Sila gunakan input manual di bawah atau tambahkan VITE_GOOGLE_MAPS_API_KEY dalam fail .env');
      setIsLoading(false);
      return;
    }

    // Load Google Maps script
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // Script already exists, wait for it to load
      if (window.google && window.google.maps) {
        initializeMap();
      } else {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            initializeMap();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initializeMap();
    };
    
    script.onerror = () => {
      setError('Gagal memuatkan Google Maps. Sila pastikan API key dikonfigurasi dengan betul atau gunakan input manual.');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [initializeMap]);

  // Update marker position when latitude/longitude change externally
  useEffect(() => {
    if (mapLoaded && markerRef.current && latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const newPosition = { lat, lng };
        markerRef.current.setPosition(newPosition);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newPosition);
        }
        if (circleRef.current) {
          circleRef.current.setCenter(newPosition);
        }
      }
    }
  }, [latitude, longitude, mapLoaded]);

  // Update circle radius when radius changes
  useEffect(() => {
    if (circleRef.current && radius) {
      const radiusValue = parseFloat(radius);
      if (!isNaN(radiusValue) && radiusValue > 0) {
        circleRef.current.setRadius(radiusValue);
      }
    }
  }, [radius]);

  return (
    <div className="w-full">
      {isLoading && !error && (
        <div className="flex items-center justify-center border border-gray-300 rounded-lg" style={{ height }}>
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-gray-600">Memuatkan peta Google Maps...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">Peta Google Maps Tidak Tersedia</p>
              <p className="text-xs text-yellow-700">{error}</p>
              <p className="text-xs text-yellow-600 mt-2">
                Anda masih boleh menggunakan input manual di bawah untuk menetapkan koordinat masjid.
              </p>
            </div>
          </div>
        </div>
      )}

      {!error && mapLoaded && (
        <div 
          ref={mapRef} 
          style={{ width: '100%', height }}
          className="rounded-lg border border-gray-300"
        />
      )}
      
      {mapLoaded && !error && (
        <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Cara menggunakan:</p>
          <p>• <strong>Klik</strong> pada peta untuk menetapkan lokasi masjid</p>
          <p>• <strong>Seret penanda</strong> (marker) untuk menyesuaikan lokasi dengan tepat</p>
          <p>• <strong>Bulatan hijau</strong> menunjukkan jejari check-in yang dibenarkan</p>
          <p>• Lokasi akan dikemaskini secara automatik apabila anda klik atau seret penanda</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapPicker;
