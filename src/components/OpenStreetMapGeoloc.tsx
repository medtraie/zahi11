import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Globe, Maximize2, Minimize2, RotateCcw, EyeOff, AlertTriangle, FileText, Download } from 'lucide-react';
import { generateFridgePdfReport } from '../utils/fridgePdfExport';

export interface FridgeGpsData {
  id: string;
  serialNumber: string;
  type: 'chest' | 'upright' | 'AP' | 'AG' | 'AS';
  status: 'service' | 'stock' | 'maintenance';
  client?: string;
  depot: string;
  fillLevel: number;
  powerConsumption: number;
  lastServiceDate?: string;
  driverId?: string;
  installationDate?: string;
  
  // Delivery analytics
  deliveryDaysCount?: number;
  totalQuantityDeliveredLiters?: number;
  totalCartonsDelivered?: number;
  lastDeliveryDate?: string;
  estimatedRevenueDH?: number;

  // GPS & Location Alert
  isLocationAlert?: boolean;
  alertReason?: string;
  alertTimestamp?: string;
  gps?: {
    lat: number;
    lng: number;
    city: string;
    address: string;
  };
}

interface OpenStreetMapGeolocProps {
  fridges: FridgeGpsData[];
  selectedCity?: string;
  filterStatus?: 'all' | 'service' | 'stock' | 'maintenance';
  searchTerm?: string;
  selectedFridgeId: string | null;
  onSelectFridge: (id: string | null) => void;
  lang?: 'fr' | 'ar';
  moroccoCityCoords?: Record<string, { lat: number; lng: number; city: string; address: string }>;
}

export const DEFAULT_MOROCCO_COORDS: Record<string, { lat: number; lng: number; city: string; address: string }> = {
  'Casablanca': { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Tit Mellil, Casablanca' },
  'Marrakech': { lat: 31.6295, lng: -7.9811, city: 'Marrakech', address: 'Gueliz, Marrakech' },
  'Tanger': { lat: 35.7595, lng: -5.8340, city: 'Tanger', address: 'Corniche de Tanger' },
  'Oujda': { lat: 34.6814, lng: -1.9086, city: 'Oujda', address: 'Zone Franche, Oujda' },
  'Meknès': { lat: 33.8935, lng: -5.5473, city: 'Meknès', address: 'Hamria, Meknès' },
  'Fès': { lat: 34.0331, lng: -5.0003, city: 'Fès', address: 'Ville Nouvelle, Fès' },
  'Agadir': { lat: 30.4278, lng: -9.5981, city: 'Agadir', address: 'Zone Touristique, Agadir' },
  'Safi': { lat: 32.2994, lng: -9.2372, city: 'Safi', address: 'Zone Portuaire, Safi' },
  'Rabat': { lat: 34.0209, lng: -6.8416, city: 'Rabat', address: 'Agdal, Rabat' },
  'Berrechid': { lat: 33.2655, lng: -7.5875, city: 'Berrechid', address: 'Centre-ville, Berrechid' },
  'Laâyoune': { lat: 27.1253, lng: -13.1625, city: 'Laâyoune', address: 'Avenue Makkah, Laâyoune' },
};

// Inland Neighborhood Coordinates for Moroccan Cities (Prevents sea/ocean pins!)
export const MOROCCO_CITY_DISTRICTS: Record<string, Array<{ name: string; lat: number; lng: number; address: string }>> = {
  'Casablanca': [
    { name: 'Tit Mellil Zone Ind.', lat: 33.5530, lng: -7.4830, address: 'Zone Industrielle Tit Mellil, Casablanca' },
    { name: 'Maârif Centre', lat: 33.5780, lng: -7.6320, address: 'Bd Al Massira Al Khadra, Maârif, Casablanca' },
    { name: 'Mers Sultan', lat: 33.5650, lng: -7.6100, address: 'Place 2 Mars, Mers Sultan, Casablanca' },
    { name: 'Sidi Othmane', lat: 33.5500, lng: -7.5600, address: 'Bd 10 Mars, Sidi Othmane, Casablanca' },
    { name: 'Hay Hassani', lat: 33.5550, lng: -7.6600, address: 'Bd Afghanistan, Hay Hassani, Casablanca' },
    { name: 'Ain Chock', lat: 33.5380, lng: -7.6000, address: 'Bd Panoramique, Ain Chock, Casablanca' },
    { name: 'Sidi Maârouf', lat: 33.5180, lng: -7.6400, address: 'Technopark, Sidi Maârouf, Casablanca' },
    { name: 'Ain Sebaâ Ind.', lat: 33.5950, lng: -7.5300, address: 'Route de Rabat, Ain Sebaâ, Casablanca' },
    { name: 'Oulfa', lat: 33.5420, lng: -7.6700, address: 'Bd Oued Um Errabia, Oulfa, Casablanca' },
    { name: 'Californie', lat: 33.5300, lng: -7.6150, address: 'Bd Taddart, Californie, Casablanca' },
    { name: 'Bouskoura Ind.', lat: 33.4500, lng: -7.6500, address: 'Zone Industrielle Bouskoura, Casablanca' },
    { name: 'Derb Sultan', lat: 33.5660, lng: -7.6020, address: 'Derb Omar, Casablanca' },
  ],
  'Marrakech': [
    { name: 'Gueliz', lat: 31.6295, lng: -7.9811, address: 'Bd Mohammed V, Gueliz, Marrakech' },
    { name: 'Hivernage', lat: 31.6210, lng: -7.9950, address: 'Avenue Menara, Hivernage, Marrakech' },
    { name: 'Sidi Ghanem', lat: 31.6650, lng: -8.0200, address: 'Zone Industrielle Sidi Ghanem, Marrakech' },
    { name: 'Menara', lat: 31.6150, lng: -8.0100, address: 'Route de l\'Aéroport, Marrakech' },
    { name: 'Daoudiate', lat: 31.6450, lng: -7.9850, address: 'Unité 4, Daoudiate, Marrakech' },
    { name: 'Massira', lat: 31.6350, lng: -8.0400, address: 'Massira 1, Marrakech' },
  ],
  'Tanger': [
    { name: 'Avenue de l\'Espagne', lat: 35.7720, lng: -5.8020, address: 'Zone Portuaire, Tanger' },
    { name: 'Malabata', lat: 35.7700, lng: -5.7850, address: 'Baie de Tanger, Malabata' },
    { name: 'Marshan', lat: 35.7850, lng: -5.8200, address: 'Quartier Marshan, Tanger' },
    { name: 'Zone Franche Gzenaya', lat: 35.7200, lng: -5.8900, address: 'TFZ Gzenaya, Tanger' },
    { name: 'Beni Makada', lat: 35.7500, lng: -5.8100, address: 'Bd Moulay Ismail, Beni Makada, Tanger' },
  ],
  'Oujda': [
    { name: 'Zone Franche', lat: 34.6814, lng: -1.9086, address: 'Zone Franche Oujda' },
    { name: 'Centre Ville', lat: 34.6850, lng: -1.9120, address: 'Bd Mohammed V, Oujda' },
    { name: 'Route de Taourirt', lat: 34.6700, lng: -1.9300, address: 'Route Nationale 6, Oujda' },
  ],
  'Meknès': [
    { name: 'Hamria', lat: 33.8935, lng: -5.5473, address: 'Avenue FAR, Hamria, Meknès' },
    { name: 'Ville Nouvelle', lat: 33.8880, lng: -5.5400, address: 'Bd Hassan II, Meknès' },
    { name: 'Zone Ind. Agropolis', lat: 33.8600, lng: -5.5100, address: 'Agropolis, Meknès' },
  ],
  'Fès': [
    { name: 'Ville Nouvelle', lat: 34.0331, lng: -5.0003, address: 'Avenue Hassan II, Fès' },
    { name: 'Dhar El Mehraz', lat: 34.0250, lng: -4.9850, address: 'Quartier Industriel, Fès' },
    { name: 'Route de Sefrou', lat: 34.0100, lng: -4.9900, address: 'Bd Allal Ben Abdellah, Fès' },
  ],
  'Agadir': [
    { name: 'Talborjt', lat: 30.4210, lng: -9.5920, address: 'Boulevard Mohammed V, Talborjt, Agadir' },
    { name: 'Dakhla', lat: 30.4100, lng: -9.5700, address: 'Avenue Hassan II, Dakhla, Agadir' },
    { name: 'Anza Ind.', lat: 30.4400, lng: -9.6200, address: 'Zone Industrielle Anza, Agadir' },
    { name: 'Tikiouine', lat: 30.3800, lng: -9.5200, address: 'Route de Taroudant, Tikiouine, Agadir' },
  ],
  'Safi': [
    { name: 'Zone Portuaire', lat: 32.2920, lng: -9.2320, address: 'Route du Port, Safi' },
    { name: 'Plateau', lat: 32.2994, lng: -9.2300, address: 'Avenue Moulay Youssef, Safi' },
    { name: 'Sidi Bouzid', lat: 32.3150, lng: -9.2450, address: 'Quartier Sidi Bouzid, Safi' },
  ],
  'Rabat': [
    { name: 'Agdal', lat: 34.0080, lng: -6.8500, address: 'Avenue de France, Agdal, Rabat' },
    { name: 'Hassan', lat: 34.0209, lng: -6.8350, address: 'Avenue Mohammed V, Hassan, Rabat' },
    { name: 'Hay Riad', lat: 33.9650, lng: -6.8700, address: 'Avenue Annakhil, Hay Riad, Rabat' },
    { name: 'Akkari Ind.', lat: 34.0150, lng: -6.8650, address: 'Zone Industrielle Akkari, Rabat' },
  ],
  'Berrechid': [
    { name: 'Centre-ville', lat: 33.2655, lng: -7.5875, address: 'Place Hassan II, Berrechid' },
    { name: 'Zone Industrielle', lat: 33.2550, lng: -7.5750, address: 'Route de Settat, Berrechid' },
  ],
  'Laâyoune': [
    { name: 'Avenue Makkah', lat: 27.1450, lng: -13.1900, address: 'Bd Makkah, Laâyoune' },
    { name: 'Port El Marsa', lat: 27.0950, lng: -13.4100, address: 'Zone Portuaire, Laâyoune El Marsa' },
  ]
};

export default function OpenStreetMapGeoloc({
  fridges,
  selectedCity = 'all',
  filterStatus = 'all',
  searchTerm = '',
  selectedFridgeId,
  onSelectFridge,
  lang = 'fr',
  moroccoCityCoords = DEFAULT_MOROCCO_COORDS
}: OpenStreetMapGeolocProps) {
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tracking refs to avoid overriding user manual zooming & panning
  const prevSelectedCityRef = useRef<string>(selectedCity);
  const prevFilterStatusRef = useRef<string>(filterStatus);
  const prevSearchTermRef = useRef<string>(searchTerm);
  const lastFlownFridgeIdRef = useRef<string | null>(null);
  const userClosedPopupForIdRef = useRef<string | null>(null);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!containerWrapperRef.current) return;

    if (!document.fullscreenElement && !(containerWrapperRef.current as any).webkitFullscreenElement) {
      const el = containerWrapperRef.current as any;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
  };

  useEffect(() => {
    const handleFSChange = () => {
      const isFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFS);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [31.7917, -7.0926],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('popupclose', () => {
        if (lastFlownFridgeIdRef.current) {
          userClosedPopupForIdRef.current = lastFlownFridgeIdRef.current;
        }
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Markers dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    const cityChanged = prevSelectedCityRef.current !== selectedCity;
    const filterChanged = prevFilterStatusRef.current !== filterStatus;
    const searchChanged = prevSearchTermRef.current !== searchTerm;

    prevSelectedCityRef.current = selectedCity;
    prevFilterStatusRef.current = filterStatus;
    prevSearchTermRef.current = searchTerm;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current = {};

    // Filter fridges
    const filtered = fridges.filter(f => {
      const matchCity = selectedCity === 'all' || f.depot === selectedCity;
      const matchStatus = filterStatus === 'all' || f.status === filterStatus;
      const matchSearch = !searchTerm || 
        f.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.client && f.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
        f.depot.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCity && matchStatus && matchSearch;
    });

    const cityCoordsMap = { ...DEFAULT_MOROCCO_COORDS, ...moroccoCityCoords };
    const bounds: L.LatLngExpression[] = [];

    // Group count per city to map fridges to distinct inland districts
    const cityCountMap: Record<string, number> = {};

    filtered.forEach((f) => {
      const depotKey = f.depot || 'Casablanca';
      const cityInfo = cityCoordsMap[depotKey] || cityCoordsMap['Casablanca'];
      
      const countInCity = cityCountMap[depotKey] || 0;
      cityCountMap[depotKey] = countInCity + 1;

      // Inland District Mapping to ensure pins never land in Atlantic Ocean!
      const districtList = MOROCCO_CITY_DISTRICTS[depotKey] || MOROCCO_CITY_DISTRICTS['Casablanca'];
      const district = districtList[countInCity % districtList.length];

      let lat = f.gps?.lat ?? district.lat;
      let lng = f.gps?.lng ?? district.lng;

      // Check if coordinates were invalid or in sea (e.g. Casablanca ocean area: lat > 33.58 & lng < -7.63)
      if (depotKey === 'Casablanca' && lat > 33.585 && lng < -7.62) {
        lat = district.lat;
        lng = district.lng;
      }

      // If count exceeds district list size, apply inland-safe offset strictly directed South-East
      if (countInCity >= districtList.length) {
        const extraFactor = countInCity - districtList.length + 1;
        lat -= 0.003 * extraFactor; // Southwards (Inland)
        lng += 0.004 * extraFactor; // Eastwards (Inland)
      }

      bounds.push([lat, lng]);

      const isAlert = !!f.isLocationAlert;
      const statusColor = isAlert ? '#ef4444' : f.status === 'service' ? '#10b981' : f.status === 'stock' ? '#0284c7' : '#f59e0b';
      const statusLabel = isAlert ? '🚨 ALERTE GPS' : f.status === 'service' ? 'En Service' : f.status === 'stock' ? 'En Stock' : 'Maintenance';
      const isSelected = f.id === selectedFridgeId;
      const categoryBadge = f.type === 'AS' ? 'AS (500L)' : (f.type === 'chest' || f.type === 'AP') ? 'AP (300L)' : 'AG (400L)';

      // Custom divIcon with pulsing alert if location alert is active
      const customHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: ${isSelected || isAlert ? '46px' : '32px'};
            height: ${isSelected || isAlert ? '46px' : '32px'};
            background-color: ${statusColor};
            opacity: ${isSelected || isAlert ? '0.6' : '0.25'};
            border-radius: 50%;
            animation: ${isAlert ? 'ping 0.8s infinite' : isSelected ? 'ping 1.4s infinite' : 'none'};
          "></div>
          <div style="
            position: relative;
            background-color: ${isAlert ? '#991b1b' : isSelected ? '#0f172a' : '#ffffff'};
            color: ${isAlert || isSelected ? '#ffffff' : '#0f172a'};
            border: 2px solid ${statusColor};
            border-radius: 10px;
            padding: 3px 7px;
            font-family: monospace, sans-serif;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 8px 16px -2px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            transform: scale(${isSelected ? '1.15' : '1'});
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: ${statusColor};
              display: inline-block;
              box-shadow: 0 0 8px ${statusColor};
            "></span>
            <span>${f.serialNumber}</span>
            <span style="
              background-color: ${isAlert ? '#7f1d1d' : isSelected ? '#1e293b' : '#f1f5f9'};
              color: ${isAlert ? '#fca5a5' : isSelected ? '#38bdf8' : '#0284c7'};
              padding: 1px 4px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 900;
            ">${isAlert ? '🚨 ALERTE' : categoryBadge}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-leaflet-fridge-pin',
        iconSize: [50, 40],
        iconAnchor: [25, 20]
      });

      const deliveryDays = f.deliveryDaysCount || 64;
      const totalLiters = f.totalQuantityDeliveredLiters || Math.round(deliveryDays * 38);
      const totalCartons = f.totalCartonsDelivered || Math.round(totalLiters / 4);

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 10px; min-width: 250px; color: #0f172a;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <div>
              <span style="font-family: monospace; font-size: 13px; font-weight: 900; color: #0f172a;">${f.serialNumber}</span>
              <span style="margin-left: 4px; background-color: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 800;">${categoryBadge}</span>
            </div>
            <span style="
              background-color: ${isAlert ? '#fee2e2' : f.status === 'service' ? '#dcfce7' : f.status === 'stock' ? '#e0f2fe' : '#fef3c7'};
              color: ${isAlert ? '#991b1b' : f.status === 'service' ? '#15803d' : f.status === 'stock' ? '#0369a1' : '#b45309'};
              padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 800; text-transform: uppercase;
            ">
              ${statusLabel}
            </span>
          </div>

          ${isAlert ? `
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 6px 8px; border-radius: 8px; margin-bottom: 8px; font-size: 10px; color: #991b1b; font-weight: 700;">
              🚨 <b>ALERTE Mouvement Suspect GPS:</b><br/>${f.alertReason || 'Changement de position hors zone client détecté.'}
            </div>
          ` : ''}
          
          <div style="font-size: 11px; line-height: 1.6; color: #334155; margin-bottom: 8px;">
            <b>📍 Affectation:</b> ${f.status === 'service' ? (f.client || f.depot) : `Dépôt ${f.depot}`}<br/>
            <b>🌆 Quartier / Adresse:</b> ${f.gps?.address || district.address}<br/>
            <b>📅 Jours de Livraison:</b> <span style="font-weight: 900; color: #0284c7;">${deliveryDays} Jours</span><br/>
            <b>🍦 Volume Livré:</b> <span style="font-weight: 900; color: #059669;">${totalLiters.toLocaleString()} L (${totalCartons} Cartons)</span><br/>
            <b>📦 Remplissage Stock:</b> <span style="font-weight: 800; color: #0f172a;">${f.fillLevel}%</span>
          </div>

          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="
            display: flex; align-items: center; justify-content: center; gap: 4px;
            text-align: center; margin-top: 6px; padding: 7px 10px;
            background-color: #0284c7; color: white; border-radius: 8px; text-decoration: none;
            font-size: 10px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);
          ">
            🗺️ Google Maps (${lat.toFixed(4)}, ${lng.toFixed(4)})
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        userClosedPopupForIdRef.current = null;
        onSelectFridge(f.id);
      });

      markersRef.current[f.id] = marker;
    });

    // Fly to selected fridge
    const isNewFridgeSelection = selectedFridgeId !== null && selectedFridgeId !== lastFlownFridgeIdRef.current;

    if (selectedFridgeId === null) {
      lastFlownFridgeIdRef.current = null;
      userClosedPopupForIdRef.current = null;
      map.closePopup();
    } else if (isNewFridgeSelection && markersRef.current[selectedFridgeId]) {
      const selected = fridges.find(f => f.id === selectedFridgeId);
      if (selected) {
        const depotKey = selected.depot || 'Casablanca';
        const districtList = MOROCCO_CITY_DISTRICTS[depotKey] || MOROCCO_CITY_DISTRICTS['Casablanca'];
        const lat = selected.gps?.lat ?? districtList[0].lat;
        const lng = selected.gps?.lng ?? districtList[0].lng;

        lastFlownFridgeIdRef.current = selectedFridgeId;

        map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { animate: true, duration: 1.0 });

        if (userClosedPopupForIdRef.current !== selectedFridgeId) {
          markersRef.current[selectedFridgeId].openPopup();
        }
      }
    } else if ((cityChanged || filterChanged || searchChanged) && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [fridges, selectedCity, filterStatus, searchTerm, selectedFridgeId, moroccoCityCoords]);

  // Recenter / Reset map view to all Morocco pins
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const cityCoordsMap = { ...DEFAULT_MOROCCO_COORDS, ...moroccoCityCoords };
    const allBounds: L.LatLngExpression[] = Object.values(cityCoordsMap).map(c => [c.lat, c.lng]);
    if (allBounds.length > 0) {
      map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 8 });
    } else {
      map.setView([31.7917, -7.0926], 6);
    }
  };

  const selectedFridge = fridges.find(f => f.id === selectedFridgeId);

  return (
    <div 
      ref={containerWrapperRef}
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none bg-slate-900 p-0 m-0' : 'h-[640px] bg-slate-900'
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-10 bg-slate-900" />
      
      {/* Top Map Badges & Full Screen Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="bg-slate-950/90 hover:bg-sky-600 text-white px-3 py-2 rounded-xl border border-slate-700 hover:border-sky-400 text-xs font-mono font-bold flex items-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
          title={lang === 'fr' ? 'Mode Plein Écran' : 'وضع ملء الشاشة'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 text-amber-400" />
              <span>{lang === 'fr' ? 'Quitter Plein Écran' : 'خروج من ملء الشاشة'}</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 text-sky-400" />
              <span>{lang === 'fr' ? 'Plein Écran' : 'ملء الشاشة'}</span>
            </>
          )}
        </button>

        {/* Recenter Map Button */}
        <button
          type="button"
          onClick={handleResetView}
          className="bg-slate-950/90 hover:bg-slate-800 text-slate-200 hover:text-white p-2 rounded-xl border border-slate-700 text-xs font-mono font-bold flex items-center gap-1 shadow-xl transition-all cursor-pointer"
          title={lang === 'fr' ? 'Réinitialiser la Vue' : 'إعادة ضبط الخريطة'}
        >
          <RotateCcw className="h-4 w-4 text-emerald-400" />
        </button>

        {/* Map Header Title Badge */}
        <div className="hidden sm:flex bg-slate-950/80 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono font-bold items-center gap-2 shadow-lg">
          <Globe className="h-4 w-4 text-emerald-400 animate-spin-slow" />
          <span>OpenStreetMap Maroc 2026</span>
        </div>
      </div>

      {/* Selected Fridge Floating Quick Card overlay on bottom left of map */}
      {selectedFridge && (
        <div className="absolute bottom-6 left-6 z-20 max-w-md bg-slate-950/90 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${selectedFridge.isLocationAlert ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'}`}>
                {selectedFridge.isLocationAlert ? <AlertTriangle className="h-5 w-5 text-rose-500" /> : <MapPin className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-black text-sm text-white">
                    {selectedFridge.serialNumber}
                  </p>
                  {selectedFridge.isLocationAlert && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase animate-bounce">
                      ALERTE GPS
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  {selectedFridge.depot} - {selectedFridge.client || 'Dépôt / Non assigné'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectFridge(null)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title={lang === 'fr' ? 'Masquer' : 'إخفاء'}
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>{lang === 'fr' ? 'Masquer' : 'إخفاء'}</span>
            </button>
          </div>

          {/* Quick Metrics Bar inside Map Overlay Card */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-[10px]">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-bold">Livraison</span>
              <span className="font-mono font-black text-sky-400">{selectedFridge.deliveryDaysCount || 64} Jours</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-bold">Glaces</span>
              <span className="font-mono font-black text-emerald-400">{(selectedFridge.totalCartonsDelivered || 612).toLocaleString()} Cartons</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block font-bold">Ventes</span>
              <span className="font-mono font-black text-amber-400">{(selectedFridge.estimatedRevenueDH || 49000).toLocaleString()} DH</span>
            </div>
          </div>

          {/* PDF Download Action Button */}
          <button
            type="button"
            onClick={() => generateFridgePdfReport(selectedFridge, lang)}
            className="w-full py-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{lang === 'fr' ? 'Télécharger Rapport PDF (2026)' : 'تحميل تقرير PDF (2026)'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
