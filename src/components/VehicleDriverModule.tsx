/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Truck, 
  Users, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Navigation, 
  Thermometer, 
  TrendingUp, 
  Smartphone, 
  Search, 
  MapPin, 
  FileText, 
  Power, 
  UserPlus, 
  AlertTriangle,
  RotateCcw,
  Gauge,
  Compass,
  History,
  Building2,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
  Layers,
  Wrench,
  Radio,
  Eye,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';

export interface Vehicle {
  id: string;
  type: 'transport' | 'livraison';
  model: string;
  plateNumber: string;
  capacityCartons: number;
  currentTemp: number;
  isRefrigerationOn: boolean;
  assignedDriverId: string | null;
  fuelLevel: number; // percentage
  status: 'Disponible' | 'En transit' | 'En livraison' | 'En maintenance' | 'Alerte';
  depotAssigned: string; // e.g. Usine, Casablanca, Marrakech
  // Enhanced Tracking & Geofencing fields
  currentDepotNear?: string;
  inDepotVisits?: number;
  outDepotExits?: number;
  neverEnteredDepot?: boolean;
  daysAwayFromDepot?: number;
  lastDepotEntryDate?: string;
  speedKmh?: number;
  lat?: number;
  lng?: number;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: 'Disponible' | 'En mission' | 'En repos';
  coldChainScore: number; // percentage of temperature compliance
  completedTrips: number;
  assignedVehicleId: string | null;
}

interface VehicleDriverModuleProps {
  lang: 'fr' | 'ar';
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  state: any;
}

export default function VehicleDriverModule({ 
  lang, 
  vehicles, 
  setVehicles, 
  drivers, 
  setDrivers, 
  state 
}: VehicleDriverModuleProps) {
  const isAr = lang === 'ar';

  // --- Search & Filter States ---
  const [activeSubTab, setActiveSubTab] = useState<'transports' | 'livraisons' | 'chauffeurs'>('transports');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Trip History modal state ---
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<Vehicle | null>(null);

  // Helper to generate trip/delivery history
  const getVehicleHistory = (vehicle: Vehicle) => {
    const history: Array<{
      id: string;
      date: string;
      type: string;
      itinerary: string;
      status: string;
      cargo: string;
      temp: string;
    }> = [];

    // 1. Matches from transfers (for transport vehicles)
    if (vehicle.type === 'transport' && state?.transfers) {
      const transfers = state.transfers.filter((t: any) => 
        t.carrierName?.toLowerCase().includes(vehicle.id.toLowerCase()) ||
        t.carrierName?.toLowerCase().includes(vehicle.model.toLowerCase())
      );
      transfers.forEach((t: any) => {
        history.push({
          id: t.trackingNumber,
          date: t.sentAt ? new Date(t.sentAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA') : '---',
          type: lang === 'fr' ? 'Transfert Inter-Dépôt' : 'شحن بين المستودعات',
          itinerary: `${t.source} ➔ ${t.destination}`,
          status: t.status === 'Received' ? (lang === 'fr' ? 'Reçu (Complété)' : 'مكتمل (مستلم)') : (lang === 'fr' ? 'En transit' : 'في الطريق'),
          cargo: `${t.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0} Cartons`,
          temp: `${vehicle.currentTemp}°C`
        });
      });
    }

    // 2. Matches from truck deliveries (for delivery vehicles)
    if (vehicle.type === 'livraison' && state?.trucks) {
      // Find matching truck
      const truck = state.trucks.find((t: any) => 
        t.depotName?.toLowerCase() === vehicle.depotAssigned?.toLowerCase()
      );
      if (truck && truck.deliveries) {
        truck.deliveries.forEach((d: any) => {
          history.push({
            id: d.id,
            date: d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA') : '---',
            type: lang === 'fr' ? 'Livraison Client' : 'توزيع محلي للعملاء',
            itinerary: `${vehicle.depotAssigned} ➔ ${d.clientName} (${d.city})`,
            status: d.status === 'Delivered' ? (lang === 'fr' ? 'Livré (Complété)' : 'مكتمل (تم التوصيل)') : (lang === 'fr' ? 'En cours' : 'قيد التوصيل'),
            cargo: `${d.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0} Cartons`,
            temp: `${vehicle.currentTemp}°C`
          });
        });
      }
    }

    // 3. Fallback mock history if empty
    if (history.length === 0) {
      if (vehicle.type === 'transport') {
        history.push(
          {
            id: `TR-${vehicle.id}-004`,
            date: '28/06/2026',
            type: lang === 'fr' ? 'Transfert Inter-Dépôt' : 'شحن بين المستودعات',
            itinerary: `Usine Zahi ➔ Dépôt ${vehicle.depotAssigned || 'Casablanca'}`,
            status: lang === 'fr' ? 'Reçu (Complété)' : 'مكتمل (مستلم)',
            cargo: '450 Cartons (Twinny)',
            temp: '-19.5°C'
          },
          {
            id: `TR-${vehicle.id}-002`,
            date: '25/06/2026',
            type: lang === 'fr' ? 'Transfert Inter-Dépôt' : 'شحن بين المستودعات',
            itinerary: `Usine Zahi ➔ Dépôt ${vehicle.depotAssigned || 'Marrakech'}`,
            status: lang === 'fr' ? 'Reçu (Complété)' : 'مكتمل (مستلم)',
            cargo: '600 Cartons (Prestige & Capitano)',
            temp: '-20.2°C'
          }
        );
      } else {
        history.push(
          {
            id: `LIV-${vehicle.id}-009`,
            date: '28/06/2026',
            type: lang === 'fr' ? 'Livraison Client' : 'توزيع محلي للعملاء',
            itinerary: `Dépôt ${vehicle.depotAssigned} ➔ Café des Cascades`,
            status: lang === 'fr' ? 'Livré (Complété)' : 'مكتمل (تم التوصيل)',
            cargo: '85 Cartons (Twinny & Aldo)',
            temp: '-18.2°C'
          },
          {
            id: `LIV-${vehicle.id}-005`,
            date: '27/06/2026',
            type: lang === 'fr' ? 'Livraison Client' : 'توزيع محلي للعملاء',
            itinerary: `Dépôt ${vehicle.depotAssigned} ➔ Supermarché BIM`,
            status: lang === 'fr' ? 'Livré (Complété)' : 'مكتمل (تم التوصيل)',
            cargo: '150 Cartons (Gamme Classique)',
            temp: '-18.5°C'
          }
        );
      }
    }

    return history;
  };
  
  // --- Morocco Zahi Ice Dépôts Master GPS Coordinates & Metadata ---
  const ZAHI_DEPOTS_METADATA: Record<string, {
    name: string;
    nameAr: string;
    lat: number;
    lng: number;
    address: string;
    capacityCartons: number;
    color: string;
    type: 'Usine' | 'Dépôt Régional';
  }> = {
    'Casablanca': {
      name: 'Casablanca (Tit Mellil & Maârif)',
      nameAr: 'مستودع الدار البيضاء (تيط مليل والمعاريف)',
      lat: 33.5530,
      lng: -7.4830,
      address: 'Zone Industrielle Tit Mellil, Casablanca',
      capacityCartons: 8500,
      color: '#0284c7',
      type: 'Dépôt Régional'
    },
    'Usine': {
      name: 'Usine Centrale Zahi (Casablanca)',
      nameAr: 'مصنع زاهي الرئيسي للآيس كريم',
      lat: 33.5680,
      lng: -7.5300,
      address: 'Complexe Industriel Zahi, Ain Sebaâ, Casablanca',
      capacityCartons: 25000,
      color: '#4f46e5',
      type: 'Usine'
    },
    'Marrakech': {
      name: 'Dépôt Régional Marrakech (Gueliz)',
      nameAr: 'مستودع مراكش الإقليمي (جيليز)',
      lat: 31.6295,
      lng: -7.9811,
      address: 'Zone Industrielle Sidi Ghanem, Marrakech',
      capacityCartons: 6000,
      color: '#f59e0b',
      type: 'Dépôt Régional'
    },
    'Agadir': {
      name: 'Dépôt Régional Agadir (Anza)',
      nameAr: 'مستودع أكادير الإقليمي (أنزا والقطب السياحي)',
      lat: 30.4278,
      lng: -9.5981,
      address: 'Zone Industrielle Anza, Agadir',
      capacityCartons: 5200,
      color: '#10b981',
      type: 'Dépôt Régional'
    },
    'Tanger': {
      name: 'Dépôt Régional Tanger (Gzenaya TFZ)',
      nameAr: 'مستودع طنجة الإقليمي (المنطقة الحرة كزناية)',
      lat: 35.7595,
      lng: -5.8340,
      address: 'TFZ Zone Franche Gzenaya, Tanger',
      capacityCartons: 5800,
      color: '#06b6d4',
      type: 'Dépôt Régional'
    },
    'Fès': {
      name: 'Dépôt Régional Fès (Ain Chkef)',
      nameAr: 'مستودع فاس الإقليمي (عين الشقف)',
      lat: 34.0331,
      lng: -5.0003,
      address: 'Quartier Industriel Sidi Brahim, Fès',
      capacityCartons: 4800,
      color: '#8b5cf6',
      type: 'Dépôt Régional'
    },
    'Meknès': {
      name: 'Dépôt Régional Meknès (Hamria)',
      nameAr: 'مستودع مكناس الإقليمي (حمرية ومجاط)',
      lat: 33.8935,
      lng: -5.5473,
      address: 'Zone Industrielle Mejjat, Meknès',
      capacityCartons: 4000,
      color: '#ec4899',
      type: 'Dépôt Régional'
    },
    'Oujda': {
      name: 'Dépôt Régional Oujda (Zone Franche)',
      nameAr: 'مستودع وجدة والشرق (المنطقة الحرة)',
      lat: 34.6814,
      lng: -1.9086,
      address: 'Technopole Zone Franche, Oujda',
      capacityCartons: 4200,
      color: '#f97316',
      type: 'Dépôt Régional'
    },
    'Safi': {
      name: 'Dépôt Régional Safi (Port)',
      nameAr: 'مستودع آسفي الإقليمي (الحي الصناعي المينائي)',
      lat: 32.2994,
      lng: -9.2372,
      address: 'Zone Industrielle Portuaire, Safi',
      capacityCartons: 3500,
      color: '#14b8a6',
      type: 'Dépôt Régional'
    },
    'Rabat': {
      name: 'Dépôt Régional Rabat (Hay Riad)',
      nameAr: 'مستودع الرباط سلا تمارة',
      lat: 34.0209,
      lng: -6.8416,
      address: 'Avenue de France, Agdal / Hay Riad, Rabat',
      capacityCartons: 4500,
      color: '#3b82f6',
      type: 'Dépôt Régional'
    },
    'Berrechid': {
      name: 'Dépôt Régional Berrechid',
      nameAr: 'مستودع برشيد والشاوية',
      lat: 33.2655,
      lng: -7.5875,
      address: 'Zone Industrielle Nord, Berrechid',
      capacityCartons: 3800,
      color: '#eab308',
      type: 'Dépôt Régional'
    },
    'Laâyoune': {
      name: 'Dépôt Régional Laâyoune (Sud)',
      nameAr: 'مستودع العيون والأقاليم الجنوبية',
      lat: 27.1253,
      lng: -13.1625,
      address: 'Zone Industrielle El Marsa, Laâyoune',
      capacityCartons: 3200,
      color: '#ef4444',
      type: 'Dépôt Régional'
    }
  };

  // Tracking state for the interactive fleet map
  const [selectedDepotFilter, setSelectedDepotFilter] = useState<string>('Casablanca');
  const [trackingFilterCategory, setTrackingFilterCategory] = useState<'all' | 'near' | 'panne' | 'never' | 'absent'>('all');
  const [selectedVehicleOnMap, setSelectedVehicleOnMap] = useState<string | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [isSimulatingMovement, setIsSimulatingMovement] = useState<boolean>(true);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const depotCircleRef = useRef<L.Circle | null>(null);

  // Form States
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    id: '',
    type: 'transport' as 'transport' | 'livraison',
    model: '',
    plateNumber: '',
    capacityCartons: 1000,
    depotAssigned: 'Usine'
  });

  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    licenseNumber: '',
    phone: '',
    assignedVehicleId: ''
  });

  // --- Stats calculations ---
  const totalVehiclesCount = vehicles.length;
  const transportCount = vehicles.filter(v => v.type === 'transport').length;
  const deliveryCount = vehicles.filter(v => v.type === 'livraison').length;
  const activeDriversCount = drivers.filter(d => d.status !== 'En repos').length;
  const alertVehiclesCount = vehicles.filter(v => v.currentTemp > -18 || v.status === 'Alerte').length;

  // --- Handlers & Enriched Fleet Tracking Simulator Data ---
  // Generate deterministic realistic tracking telemetry for each vehicle
  const enrichedVehicles = vehicles.map((v, index) => {
    const assigned = v.depotAssigned || 'Casablanca';
    const depotInfo = ZAHI_DEPOTS_METADATA[assigned] || ZAHI_DEPOTS_METADATA['Casablanca'];

    // Define custom telemetry states
    const isPanne = v.status === 'En maintenance' || v.status === 'Alerte' || v.currentTemp > -18;
    const isNeverEntered = index === 2 || v.id === 'TRK-EXP-103'; // Vehicle that hasn't entered depot yet
    const isAbsentLongTime = index === 1 || v.id === 'TRK-EXP-102'; // Vehicle absent for 8+ days

    // Simulated visits & exits
    const inVisits = isNeverEntered ? 0 : (24 + (index * 7) % 31);
    const outExits = isNeverEntered ? 0 : (inVisits + (v.status === 'En transit' || v.status === 'En livraison' ? 1 : 0));
    const daysAway = isNeverEntered ? 45 : (isAbsentLongTime ? 12 : (v.status === 'Disponible' ? 0 : 3));
    const lastEntry = isNeverEntered 
      ? 'Jamais / En transit usine' 
      : (isAbsentLongTime ? 'Il y a 12 jours (01/10/2026)' : 'Hier 18:45');

    // Calculate simulated GPS coordinates near assigned depot or in-transit
    let lat = depotInfo.lat;
    let lng = depotInfo.lng;
    let isNearDepot = false;

    if (v.status === 'Disponible' || isPanne) {
      // Parked directly inside or right at depot yard perimeter (~200m)
      lat = depotInfo.lat + ((index % 3) - 1) * 0.003;
      lng = depotInfo.lng + (((index + 1) % 3) - 1) * 0.003;
      isNearDepot = true;
    } else if (v.status === 'En livraison') {
      // In surrounding city area delivery (within 5-15km)
      lat = depotInfo.lat + (Math.sin(index * 1.5) * 0.045);
      lng = depotInfo.lng + (Math.cos(index * 1.5) * 0.045);
      isNearDepot = false;
    } else {
      // En transit on highway route
      lat = depotInfo.lat + (Math.sin(index * 2.2) * 0.18);
      lng = depotInfo.lng + (Math.cos(index * 2.2) * 0.18);
      isNearDepot = false;
    }

    const speed = v.status === 'Disponible' || isPanne ? 0 : (45 + (index * 8) % 40);

    return {
      ...v,
      currentDepotNear: assigned,
      inDepotVisits: v.inDepotVisits ?? inVisits,
      outDepotExits: v.outDepotExits ?? outExits,
      neverEnteredDepot: v.neverEnteredDepot ?? isNeverEntered,
      daysAwayFromDepot: v.daysAwayFromDepot ?? daysAway,
      lastDepotEntryDate: v.lastDepotEntryDate ?? lastEntry,
      speedKmh: speed,
      isNearDepot,
      isPanne,
      lat,
      lng
    };
  });

  // Filter vehicles per selected depot and tracking category
  const depotVehicles = enrichedVehicles.filter(v => v.depotAssigned === selectedDepotFilter);

  const filteredTrackingVehicles = depotVehicles.filter(v => {
    if (trackingFilterCategory === 'near') return v.isNearDepot;
    if (trackingFilterCategory === 'panne') return v.isPanne;
    if (trackingFilterCategory === 'never') return v.neverEnteredDepot;
    if (trackingFilterCategory === 'absent') return (v.daysAwayFromDepot || 0) >= 5;
    return true;
  });

  // Initialize and synchronize Leaflet Map with smooth depot animations & markers
  useEffect(() => {
    if (activeSubTab === 'chauffeurs' || !mapContainerRef.current) return;

    const currentDepot = ZAHI_DEPOTS_METADATA[selectedDepotFilter] || ZAHI_DEPOTS_METADATA['Casablanca'];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentDepot.lat, currentDepot.lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Smoothly fly to selected depot with cinematic animation
    map.flyTo([currentDepot.lat, currentDepot.lng], 12, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    // Clear old markers and circles
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    if (depotCircleRef.current) {
      map.removeLayer(depotCircleRef.current);
    }

    // Draw animated Geofencing Radius Perimeter Circle around Dépôt (5km radius)
    const geofenceCircle = L.circle([currentDepot.lat, currentDepot.lng], {
      color: currentDepot.color,
      fillColor: currentDepot.color,
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6, 8',
      radius: 4500 // 4.5 km geofence radius
    }).addTo(map);
    depotCircleRef.current = geofenceCircle;

    // Add Depot Central Hub Landmark Marker
    const depotIconHtml = `
      <div style="background: ${currentDepot.color}; width: 44px; height: 44px; border-radius: 14px; border: 3px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
      </div>
    `;
    const depotIcon = L.divIcon({
      className: 'zahi-depot-pin',
      html: depotIconHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const depotMarker = L.marker([currentDepot.lat, currentDepot.lng], { icon: depotIcon });
    depotMarker.bindPopup(`
      <div style="min-width: 220px; font-family: sans-serif; padding: 2px;">
        <div style="font-weight: 900; font-size: 13px; color: #0f172a; border-bottom: 2px solid ${currentDepot.color}; padding-bottom: 4px; margin-bottom: 6px;">
          🏢 ${currentDepot.name}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">📍 ${currentDepot.address}</div>
        <div style="font-size: 10px; background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span>📦 Capacité Stock :</span>
          <b>${currentDepot.capacityCartons.toLocaleString()} Ctns</b>
        </div>
      </div>
    `);
    markersGroupRef.current?.addLayer(depotMarker);

    // Place Vehicle Markers for this depot
    depotVehicles.forEach(v => {
      const isWarn = v.isPanne;
      const isNear = v.isNearDepot;
      const pinColor = isWarn ? '#ef4444' : (isNear ? '#10b981' : '#3b82f6');

      const vehicleIconHtml = `
        <div style="background: ${pinColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; position: relative;">
          ${isWarn ? '<span style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #dc2626; border-radius: 50%; border: 2px solid white; animation: ping 1.2s infinite;"></span>' : ''}
          ${isNear ? '<span style="position: absolute; bottom: -3px; right: -3px; width: 10px; height: 10px; background: #10b981; border-radius: 50%; border: 2px solid white;"></span>' : ''}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
      `;
      const vIcon = L.divIcon({
        className: 'zahi-vehicle-pin',
        html: vehicleIconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const vMarker = L.marker([v.lat || currentDepot.lat, v.lng || currentDepot.lng], { icon: vIcon });
      
      const popupContent = `
        <div style="min-width: 240px; font-family: sans-serif; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <b style="font-size: 13px; color: #0f172a;">🚛 ${v.id}</b>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: ${isWarn ? '#fee2e2; color: #b91c1c;' : (isNear ? '#dcfce7; color: #15803d;' : '#e0e7ff; color: #3730a3;')}">${v.status}</span>
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 4px;"><b>${v.model}</b> (${v.plateNumber})</div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">Dépôt : <b>${v.depotAssigned}</b> • Chauffeur : <b>${drivers.find(d => d.id === v.assignedDriverId)?.name || 'Non assigné'}</b></div>
          <div style="background: #f1f5f9; padding: 8px; border-radius: 8px; font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div>❄️ Temp : <b style="color: ${v.currentTemp > -18 ? '#dc2626' : '#0284c7'}">${v.currentTemp}°C</b></div>
            <div>⚡ Vitesse : <b>${v.speedKmh} km/h</b></div>
            <div>📥 Entrées : <b>${v.inDepotVisits} fois</b></div>
            <div>📤 Sorties : <b>${v.outDepotExits} fois</b></div>
            <div style="grid-column: span 2; margin-top: 2px; color: ${v.neverEnteredDepot ? '#dc2626' : '#475569'}">
              ${v.neverEnteredDepot ? '⚠️ Jamais entré dans ce dépôt' : `⏳ Absent depuis : <b>${v.daysAwayFromDepot} jours</b>`}
            </div>
          </div>
        </div>
      `;

      vMarker.bindPopup(popupContent);
      vMarker.on('click', () => {
        setSelectedVehicleOnMap(v.id);
      });

      markersGroupRef.current?.addLayer(vMarker);
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedDepotFilter, vehicles, activeSubTab, isSimulatingMovement]);

  // Periodic Micro-Jitter motion simulation for animated live fleet effect
  useEffect(() => {
    if (!isSimulatingMovement) return;
    const interval = setInterval(() => {
      setVehicles(prev => prev.map((v, i) => {
        if (v.status === 'En transit' || v.status === 'En livraison') {
          return {
            ...v,
            fuelLevel: Math.max(15, v.fuelLevel - (Math.random() > 0.8 ? 1 : 0))
          };
        }
        return v;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulatingMovement]);

  // Handlers
  const handleToggleRefrigeration = (vId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vId) {
        const nextState = !v.isRefrigerationOn;
        const nextTemp = nextState ? -20.5 : -14.2;
        const nextStatus = nextState ? 'Disponible' : 'Alerte';
        return {
          ...v,
          isRefrigerationOn: nextState,
          currentTemp: nextTemp,
          status: nextStatus as any
        };
      }
      return v;
    }));
  };

  const handleSimulateFailure = (vId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vId) {
        return {
          ...v,
          isRefrigerationOn: false,
          currentTemp: -12.5,
          status: 'Alerte'
        };
      }
      return v;
    }));
  };

  const handleResetRefrigeration = (vId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vId) {
        return {
          ...v,
          isRefrigerationOn: true,
          currentTemp: -21.0,
          status: 'Disponible'
        };
      }
      return v;
    }));
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.model || !newVehicle.plateNumber) return;

    const id = `VEH-${Math.floor(100 + Math.random() * 900)}`;
    const addedVehicle: Vehicle = {
      id,
      type: newVehicle.type,
      model: newVehicle.model,
      plateNumber: newVehicle.plateNumber,
      capacityCartons: Number(newVehicle.capacityCartons),
      currentTemp: -19.8,
      isRefrigerationOn: true,
      assignedDriverId: null,
      fuelLevel: 100,
      status: 'Disponible',
      depotAssigned: newVehicle.depotAssigned
    };

    setVehicles(prev => [...prev, addedVehicle]);
    setShowAddVehicleModal(false);
    setNewVehicle({
      id: '',
      type: 'transport',
      model: '',
      plateNumber: '',
      capacityCartons: 1000,
      depotAssigned: 'Usine'
    });
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.licenseNumber) return;

    const id = `DRV-${Math.floor(100 + Math.random() * 900)}`;
    const addedDriver: Driver = {
      id,
      name: newDriver.name,
      licenseNumber: newDriver.licenseNumber,
      phone: newDriver.phone || '+212 600-000000',
      status: 'Disponible',
      coldChainScore: 100,
      completedTrips: 0,
      assignedVehicleId: newDriver.assignedVehicleId || null
    };

    setDrivers(prev => [...prev, addedDriver]);

    if (newDriver.assignedVehicleId) {
      setVehicles(prev => prev.map(v => {
        if (v.id === newDriver.assignedVehicleId) {
          return { ...v, assignedDriverId: id };
        }
        return v;
      }));
    }

    setShowAddDriverModal(false);
    setNewDriver({
      name: '',
      licenseNumber: '',
      phone: '',
      assignedVehicleId: ''
    });
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه المركبة؟' : 'Voulez-vous vraiment supprimer ce véhicule ?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      setDrivers(prev => prev.map(d => d.assignedVehicleId === id ? { ...d, assignedVehicleId: null } : d));
    }
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا السائق؟' : 'Voulez-vous vraiment supprimer ce chauffeur ?')) {
      setDrivers(prev => prev.filter(d => d.id !== id));
      setVehicles(prev => prev.map(v => v.assignedDriverId === id ? { ...v, assignedDriverId: null } : v));
    }
  };

  // --- Filtering ---
  const filteredVehicles = vehicles.filter(v => {
    if (v.type !== (activeSubTab === 'transports' ? 'transport' : 'livraison')) return false;
    const q = searchQuery.toLowerCase();
    return v.model.toLowerCase().includes(q) || v.plateNumber.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.depotAssigned.toLowerCase().includes(q);
  });

  const filteredDrivers = drivers.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q) || d.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header with custom premium styling */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Truck className="h-64 w-64" />
        </div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-6 w-6 text-sky-200 animate-bounce" />
            {isAr ? 'إدارة المركبات والسائقين' : 'Gestion de Véhicules & Chauffeurs'}
          </h2>
          <p className="text-xs text-sky-100 max-w-xl">
            {isAr 
              ? 'تتبع درجات الحرارة والتحقق من سلسلة التبريد للمركبات المبردة وسائقي شركة زاهي للآيس كريم.' 
              : 'Supervision en temps réel de la chaîne du froid, de la flotte de camions et de la performance des chauffeurs Zahi Glaces.'}
          </p>
        </div>
        <div className="flex gap-2 relative z-10 shrink-0">
          <button 
            onClick={() => {
              if (activeSubTab === 'chauffeurs') {
                setShowAddDriverModal(true);
              } else {
                setShowAddVehicleModal(true);
              }
            }}
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-sky-50 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            {activeSubTab === 'chauffeurs' ? (
              <>
                <UserPlus className="h-4 w-4" />
                {isAr ? 'إضافة سائق جديد' : 'Ajouter un Chauffeur'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {isAr ? 'إضافة مركبة جديدة' : 'Ajouter un Véhicule'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Interactive KPI Stats Row with clean non-overlapping layout */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between hover:border-sky-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isAr ? 'إجمالي المركبات' : 'Total Flotte'}
            </span>
            <div className="p-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 rounded-lg shrink-0"><Truck className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">{totalVehiclesCount}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
              <span className="font-semibold text-sky-500">{transportCount} Exp.</span>
              <span>•</span>
              <span className="font-semibold text-indigo-500">{deliveryCount} Livr.</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between hover:border-indigo-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isAr ? 'المركبات الجارية' : 'Véhicules Actifs'}
            </span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-lg shrink-0"><Compass className="h-4 w-4 animate-spin-slow" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">
              {vehicles.filter(v => v.status === 'En transit' || v.status === 'En livraison').length}
            </h3>
            <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              {isAr ? 'قيد الشحن والتوزيع' : 'En transit et livraison'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between hover:border-violet-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isAr ? 'طاقم السائقين' : 'Effectif Chauffeurs'}
            </span>
            <div className="p-1.5 bg-violet-50 dark:bg-violet-950/30 text-violet-600 rounded-lg shrink-0"><Users className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">{drivers.length}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              <span className="text-violet-500 font-bold">{activeDriversCount}</span> {isAr ? 'جاهز ومتاح للعمل' : 'disponibles ou en service'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between hover:border-rose-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isAr ? 'حرارة سلسلة التبريد' : 'Alertes Chaîne Froid'}
            </span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg shrink-0"><Thermometer className="h-4 w-4 text-rose-500 animate-pulse" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{alertVehiclesCount}</h3>
            <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1 font-semibold">
              <ShieldAlert className="h-3 w-3 animate-bounce" />
              {alertVehiclesCount > 0 ? (isAr ? 'حرارة مرتفعة > -18°م' : 'Temp. supérieure à -18°C') : (isAr ? 'لا توجد تنبيهات' : 'Toutes conformes')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-all col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {isAr ? 'كفاءة سلسلة التبريد' : 'Score Conformité'}
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-lg shrink-0"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">94.8%</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {isAr ? 'معدل الالتزام الكلي بالتبريد' : 'Moyenne de la flotte Zahi'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. Sub Tabs & Search */}
      <div className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-wrap">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl self-start w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => { setActiveSubTab('transports'); setSearchQuery(''); }}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'transports'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'مركبات الشحن (Les Transports)' : '(Expédition) camion de transfert'}
          </button>
          
          <button
            onClick={() => { setActiveSubTab('livraisons'); setSearchQuery(''); }}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'livraisons'
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'مركبات التوزيع (Les Livraisons)' : 'Véhicules de Livraison (Dépôts)'}
          </button>

          <button
            onClick={() => { setActiveSubTab('chauffeurs'); setSearchQuery(''); }}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'chauffeurs'
                ? 'bg-violet-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isAr ? 'إدارة السائقين (Chauffeurs)' : 'Gestion des Chauffeurs'}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={isAr ? 'البحث عن مركبة، لوحة، سائق...' : 'Rechercher un camion, plaque...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>

      </div>

      {/* 4. Main Lists Display with interactive animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          
          {/* VEHICLES CARDS: Category 1 & 2 */}
          {activeSubTab !== 'chauffeurs' && (
            filteredVehicles.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-950 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-850">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-400">{isAr ? 'لم يتم العثور على مركبات مبردة مطابقة.' : 'Aucun véhicule réfrigéré trouvé.'}</p>
              </div>
            ) : (
              filteredVehicles.map(vehicle => {
                const driverObj = drivers.find(d => d.id === vehicle.assignedDriverId);
                const isTempCritical = vehicle.type !== 'livraison' && vehicle.currentTemp > -18;

                return (
                  <div
                    key={vehicle.id}
                    className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                      isTempCritical 
                        ? 'border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-white to-rose-50/10 dark:from-slate-950 dark:to-rose-950/5' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-sky-300'
                    }`}
                  >
                    {/* Active Temp indicator light */}
                    {vehicle.type !== 'livraison' && (
                      <div className="absolute right-4 top-4 flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${isTempCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {vehicle.isRefrigerationOn ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    )}

                    <div>
                      {/* Vehicle Category Badge */}
                      <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-sm tracking-wide mb-3 ${
                        vehicle.type === 'transport'
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {vehicle.type === 'transport' ? (isAr ? 'شحن مسافات طويلة' : 'Transport Inter-Dépôts') : (isAr ? 'توزيع إقليمي محلي' : 'Livraison Locale')}
                      </span>

                      {/* Header title */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{vehicle.model}</h4>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{vehicle.id} • {vehicle.plateNumber}</p>
                        </div>
                      </div>

                      {/* Real-time Frozen Status Indicator */}
                      <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        {vehicle.type !== 'livraison' ? (
                          <div className="flex items-center gap-2">
                            <Thermometer className={`h-5 w-5 ${isTempCritical ? 'text-rose-500' : 'text-sky-500'}`} />
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{isAr ? 'حرارة الحاوية' : 'Température congélateur'}</p>
                              <span className={`text-base font-black font-mono ${isTempCritical ? 'text-rose-500' : 'text-sky-500'}`}>
                                {vehicle.currentTemp}°C
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                              {isAr ? 'توزيع محلي' : 'Livraison locale'}
                            </span>
                          </div>
                        )}

                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{isAr ? 'الحالة اللوجستية' : 'Statut'}</p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${
                            vehicle.status === 'Alerte' || isTempCritical
                              ? 'bg-rose-100 text-rose-700'
                              : vehicle.status === 'Disponible'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/30'
                          }`}>
                            {vehicle.status}
                          </span>
                        </div>
                      </div>

                      {/* Details specs */}
                      <div className="grid grid-cols-2 gap-3 text-[10px] my-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'المقر / الدائرة' : 'Point d\'attache'}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-sky-500" />
                            {vehicle.depotAssigned}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'سعة الشحن الكبرى' : 'Capacité max'}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 font-mono mt-0.5 block">
                            {vehicle.capacityCartons.toLocaleString()} CTN
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'مستوى الوقود' : 'Niveau de Carburant'}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {vehicle.fuelLevel}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'السائق المعين' : 'Chauffeur titulaire'}</span>
                          <span className="font-black text-slate-850 dark:text-slate-200 mt-0.5 block truncate">
                            {driverObj ? driverObj.name : (isAr ? 'لم يعين' : 'Non assigné')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive quick action controls for simulation */}
                    <div className="space-y-2 mt-2">
                      {vehicle.type !== 'livraison' && (
                        <div className="flex gap-2">
                          {/* Power refrigeration toggle */}
                          <button
                            onClick={() => handleToggleRefrigeration(vehicle.id)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors ${
                              vehicle.isRefrigerationOn
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20'
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950/20'
                            }`}
                          >
                            <Power className="h-3 w-3" />
                            {vehicle.isRefrigerationOn 
                              ? (isAr ? 'إطفاء التبريد' : 'Éteindre Froid') 
                              : (isAr ? 'تشغيل المبرد' : 'Allumer Froid')}
                          </button>

                          {/* Compressor crash simulator */}
                          <button
                            onClick={() => isTempCritical ? handleResetRefrigeration(vehicle.id) : handleSimulateFailure(vehicle.id)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors ${
                              isTempCritical
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/20'
                            }`}
                          >
                            {isTempCritical ? (
                              <>
                                <RotateCcw className="h-3 w-3 animate-spin" />
                                {isAr ? 'إصلاح العطل' : 'Résoudre Panne'}
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3 animate-pulse" />
                                {isAr ? 'محاكاة عطل' : 'Simuler Panne'}
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* View Trip History */}
                      <button
                        onClick={() => setSelectedVehicleForHistory(vehicle)}
                        className="w-full py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-slate-900 text-violet-600 dark:text-violet-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 border border-violet-100 dark:border-violet-950/40"
                      >
                        <History className="h-3.5 w-3.5 text-violet-500" />
                        {isAr ? 'عرض سجل الرحلات' : 'Voir historique des trajets'}
                      </button>

                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="w-full py-1 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg text-[9px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        {isAr ? 'حذف المركبة من الأسطول' : 'Supprimer le véhicule de la flotte'}
                      </button>
                    </div>

                  </div>
                );
              })
            )
          )}

          {/* CHAUFFEURS LIST */}
          {activeSubTab === 'chauffeurs' && (
            filteredDrivers.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-950 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-400">{isAr ? 'لم يتم العثور على سائقين مسجلين.' : 'Aucun chauffeur enregistré.'}</p>
              </div>
            ) : (
              filteredDrivers.map(driver => {
                const assignedCar = vehicles.find(v => v.id === driver.assignedVehicleId);
                const scoreColor = driver.coldChainScore >= 95 ? 'text-emerald-500' : driver.coldChainScore >= 90 ? 'text-amber-500' : 'text-rose-500';

                return (
                  <div
                    key={driver.id}
                    className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:border-violet-300"
                  >
                    <div>
                      {/* Driver Status Badge */}
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          driver.status === 'Disponible'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                            : driver.status === 'En mission'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/20'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {driver.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{driver.id}</span>
                      </div>

                      {/* Info & Name */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{driver.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{isAr ? 'رخصة سياقة :' : 'N° Permis :'} <span className="font-mono">{driver.licenseNumber}</span></p>
                      </div>

                      {/* Phone Number */}
                      <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
                        <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                        {driver.phone}
                      </p>

                      {/* Score metrics */}
                      <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/60">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{isAr ? 'التزام سلسلة التبريد' : 'Score Froid'}</span>
                          <span className={`text-base font-black font-mono ${scoreColor}`}>
                            {driver.coldChainScore}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{isAr ? 'الرحلات المكتملة' : 'Trajets Livrés'}</span>
                          <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                            {driver.completedTrips}
                          </span>
                        </div>
                      </div>

                      {/* Vehicle Assigned Details with Lier and Dissocier features */}
                      <div className="text-[10px] border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                        <span className="text-slate-400 block font-bold mb-1">{isAr ? 'ارتباط المركبة (Lier / Dissocier)' : 'Association du véhicule'}</span>
                        {assignedCar ? (
                          <div className="flex items-center justify-between gap-1.5 mt-1 p-2 bg-violet-50/50 dark:bg-violet-950/10 rounded-lg border border-violet-100 dark:border-violet-900/30">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Truck className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                              <div className="truncate">
                                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block truncate">{assignedCar.model}</span>
                                <span className="text-slate-400 font-mono text-[9px] block">({assignedCar.id})</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                // Dissocier: remove assignedVehicleId from driver and assignedDriverId from vehicle
                                setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, assignedVehicleId: null } : d));
                                setVehicles(prev => prev.map(v => v.id === assignedCar.id ? { ...v, assignedDriverId: null } : v));
                              }}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold rounded-md transition-colors text-[9px] shrink-0"
                            >
                              {isAr ? 'فك الارتباط' : 'Dissocier'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <select
                              id={`select-vehicle-${driver.id}`}
                              className="flex-1 text-[10px] px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 outline-none font-semibold"
                            >
                              <option value="">{isAr ? '-- اختر مركبة --' : '-- Choisir véhicule --'}</option>
                              {vehicles
                                .filter(v => v.assignedDriverId === null)
                                .map(v => (
                                  <option key={v.id} value={v.id}>
                                    {v.model} ({v.id})
                                  </option>
                                ))
                              }
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const selectEl = document.getElementById(`select-vehicle-${driver.id}`) as HTMLSelectElement;
                                const vId = selectEl?.value;
                                if (!vId) return;
                                // Lier: associate driver and vehicle
                                setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, assignedVehicleId: vId } : d));
                                setVehicles(prev => prev.map(v => v.id === vId ? { ...v, assignedDriverId: driver.id } : v));
                              }}
                              className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors text-[10px] shrink-0"
                            >
                              {isAr ? 'ربط المركبة' : 'Lier'}
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="mt-5 space-y-2">
                      <button
                        onClick={() => {
                          const nextStatus = driver.status === 'Disponible' ? 'En repos' : 'Disponible';
                          setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: nextStatus as any } : d));
                        }}
                        className="w-full py-1.5 bg-slate-50 hover:bg-violet-50 dark:hover:bg-slate-900 text-slate-600 hover:text-violet-600 dark:text-slate-400 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        {isAr ? 'تغيير حالة السائق / العطلة' : 'Changer Disponibilité'}
                      </button>

                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="w-full py-1 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg text-[9px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        {isAr ? 'حذف السائق من النظام' : 'Supprimer le chauffeur'}
                      </button>
                    </div>

                  </div>
                );
              })
            )
          )}

        </motion.div>
      </AnimatePresence>

      {/* 5. Comprehensive Interactive Fleet Tracking Map Simulator (Simulée & Réaliste) */}
      {activeSubTab !== 'chauffeurs' && (
        <div className={`bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 transition-all ${isMapFullscreen ? 'fixed inset-4 z-50 overflow-y-auto' : ''}`}>
          
          {/* Top Header Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-xl shadow-md shadow-sky-500/20">
                  <Navigation className="h-5 w-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                    <span>{isAr ? 'الخريطة التفاعلية لتتبع الأسطول (محاكاة ذكية شاملة)' : 'Carte Interactive de Suivi de Flotte (Simulée)'}</span>
                    <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] rounded-full font-mono font-bold tracking-wider border border-sky-200 dark:border-sky-800">
                      IoT Live 10Hz
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr 
                      ? 'مراقبة تواجد المركبات قرب المستودعات، حركات الدخول والخروج، الأعطال، والغائبين عن المستودع مع محاكاة مقربة' 
                      : 'Supervision en temps réel des dépôts Zahi : proximité, entrées/sorties, pannes, absences prolongées et télémétrie GPS.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Fullscreen */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSimulatingMovement 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Activity className="h-3.5 w-3.5 animate-spin-slow" />
                <span>{isSimulatingMovement ? (isAr ? 'المحاكاة نشطة' : 'Simulation Active') : (isAr ? 'إيقاف المحاكاة' : 'En pause')}</span>
              </button>

              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                title={isMapFullscreen ? 'Réduire' : 'Plein écran'}
              >
                {isMapFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Dépôts Selector Bar with live badge indicators */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                {isAr ? 'اختر المستودع للتقريب وتتبع مركباته :' : 'Sélectionner un dépôt pour zoom automatique & analyse :'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {Object.keys(ZAHI_DEPOTS_METADATA).length} {isAr ? 'مستودعات مجهزة بـ GPS' : 'sites logistiques'}
              </span>
            </div>

            {/* Scrollable list of clickable depot pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {Object.entries(ZAHI_DEPOTS_METADATA).map(([dKey, dInfo]) => {
                const countAssigned = enrichedVehicles.filter(v => v.depotAssigned === dKey).length;
                const countNear = enrichedVehicles.filter(v => v.depotAssigned === dKey && v.isNearDepot).length;
                const isSelected = selectedDepotFilter === dKey;

                return (
                  <button
                    key={dKey}
                    onClick={() => {
                      setSelectedDepotFilter(dKey);
                      setSelectedVehicleOnMap(null);
                    }}
                    className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/30 scale-102 ring-2 ring-sky-300 dark:ring-sky-700'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dInfo.color }} />
                    <span>{dKey}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {countNear}/{countAssigned}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dépôt Telemetry KPI Cards Bar (5 key criteria required by user) */}
          {(() => {
            const currentDepotInfo = ZAHI_DEPOTS_METADATA[selectedDepotFilter] || ZAHI_DEPOTS_METADATA['Casablanca'];
            const vehiclesNear = depotVehicles.filter(v => v.isNearDepot);
            const vehiclesPanne = depotVehicles.filter(v => v.isPanne);
            const vehiclesNever = depotVehicles.filter(v => v.neverEnteredDepot);
            const vehiclesAbsent = depotVehicles.filter(v => (v.daysAwayFromDepot || 0) >= 5);
            const totalVisitsIn = depotVehicles.reduce((sum, v) => sum + (v.inDepotVisits || 0), 0);
            const totalExitsOut = depotVehicles.reduce((sum, v) => sum + (v.outDepotExits || 0), 0);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                
                {/* 1. Proximité Dépôt */}
                <div 
                  onClick={() => setTrackingFilterCategory(trackingFilterCategory === 'near' ? 'all' : 'near')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    trackingFilterCategory === 'near' 
                      ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-400 shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'مركبات بقرب المستودع' : 'Proches du Dépôt'}</span>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-slate-800 dark:text-white">{vehiclesNear.length}</span>
                    <span className="text-[10px] text-slate-400 font-mono">/ {depotVehicles.length} camions</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
                    {isAr ? 'داخل محيط 4.5 كم' : '< 4.5 km du portail'}
                  </span>
                </div>

                {/* 2. Nombre de fois dans le dépôt (In) */}
                <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sky-600 dark:text-sky-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'عدد مرات الدخول' : 'Entrées Dépôt'}</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-sky-600 dark:text-sky-400">{totalVisitsIn}</span>
                    <span className="text-[10px] text-slate-400">{isAr ? 'مرة' : 'visites'}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block font-mono">{isAr ? 'سجل شهري تراكمي' : 'Cumul ce mois'}</span>
                </div>

                {/* 3. Nombre de fois sorties (Out) */}
                <div className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'عدد مرات المغادرة' : 'Sorties Dépôt'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{totalExitsOut}</span>
                    <span className="text-[10px] text-slate-400">{isAr ? 'مغادرة' : 'départs'}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block font-mono">{isAr ? 'مهام توزيع وشحن' : 'Missions de livraison'}</span>
                </div>

                {/* 4. Jamais entré dans le dépôt */}
                <div 
                  onClick={() => setTrackingFilterCategory(trackingFilterCategory === 'never' ? 'all' : 'never')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    trackingFilterCategory === 'never' 
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-400 shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'لم تدخل المستودع' : 'Jamais Entrés'}</span>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{vehiclesNever.length}</span>
                    <span className="text-[10px] text-slate-400">véhicules</span>
                  </div>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">
                    {isAr ? 'تتطلب فحص التسجيل' : 'En route / usine'}
                  </span>
                </div>

                {/* 5. Véhicules en Panne */}
                <div 
                  onClick={() => setTrackingFilterCategory(trackingFilterCategory === 'panne' ? 'all' : 'panne')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    trackingFilterCategory === 'panne' 
                      ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-400 shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-rose-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'مركبات في عطل (Panne)' : 'En Panne'}</span>
                    <Wrench className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{vehiclesPanne.length}</span>
                    <span className="text-[10px] text-rose-500 font-bold">alertes</span>
                  </div>
                  <span className="text-[9px] text-rose-500 mt-1 block">
                    {isAr ? 'حرارة > -18°م أو صيانة' : 'Froid ou mécanique'}
                  </span>
                </div>

                {/* 6. Absent depuis longtemps */}
                <div 
                  onClick={() => setTrackingFilterCategory(trackingFilterCategory === 'absent' ? 'all' : 'absent')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    trackingFilterCategory === 'absent' 
                      ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-400 shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-purple-400'
                  }`}
                >
                  <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{isAr ? 'لم تدخل منذ مدة' : 'Absents Prolongés'}</span>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">{vehiclesAbsent.length}</span>
                    <span className="text-[10px] text-slate-400">&gt; 5 jours</span>
                  </div>
                  <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium mt-1 block">
                    {isAr ? 'تنبيه غياب طويل' : 'Surveillance requise'}
                  </span>
                </div>

              </div>
            );
          })()}

          {/* Main Map & Live Vehicle Telemetry Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left Column: Interactive Vehicle Telemetry List for Selected Dépôt */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {isAr ? 'أسطول المستودع :' : 'Véhicules du dépôt :'} ({filteredTrackingVehicles.length})
                </span>
                {trackingFilterCategory !== 'all' && (
                  <button 
                    onClick={() => setTrackingFilterCategory('all')}
                    className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline"
                  >
                    {isAr ? 'عرض الكل' : 'Réinitialiser filtre'}
                  </button>
                )}
              </div>

              {filteredTrackingVehicles.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  {isAr ? 'لا توجد مركبات تطابق هذا الفلتر في هذا المستودع.' : 'Aucun véhicule ne correspond à ce filtre.'}
                </div>
              ) : (
                filteredTrackingVehicles.map(v => {
                  const isSelected = selectedVehicleOnMap === v.id;
                  const driverName = drivers.find(d => d.id === v.assignedDriverId)?.name || (isAr ? 'سائق غير محدد' : 'Chauffeur non assigné');

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVehicleOnMap(v.id);
                        if (mapInstanceRef.current && v.lat && v.lng) {
                          mapInstanceRef.current.flyTo([v.lat, v.lng], 14, { duration: 0.8 });
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-400/50' 
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl text-white ${
                            v.isPanne ? 'bg-rose-500 animate-bounce' : (v.isNearDepot ? 'bg-emerald-500' : 'bg-sky-600')
                          }`}>
                            <Truck className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-black text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {v.id}
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-mono font-normal">
                                {v.plateNumber}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {v.model} • {driverName}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          v.isPanne 
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300' 
                            : (v.isNearDepot 
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                              : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300')
                        }`}>
                          {v.isPanne ? 'En Panne' : (v.isNearDepot ? 'Proche Dépôt' : v.status)}
                        </span>
                      </div>

                      {/* Micro Telemetry Metrics */}
                      <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'الحرارة' : 'Température'}</span>
                          <span className={`font-mono font-black ${v.currentTemp > -18 ? 'text-rose-500' : 'text-sky-500'}`}>
                            {v.currentTemp}°C
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'دخول / خروج' : 'Entrées / Sorties'}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            {v.inDepotVisits} / {v.outDepotExits}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'السرعة والوقود' : 'Vitesse / Carburant'}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            {v.speedKmh} km/h • {v.fuelLevel}%
                          </span>
                        </div>
                      </div>

                      {/* Status Warning Banner */}
                      {v.neverEnteredDepot && (
                        <div className="mt-2 text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{isAr ? 'تنبيه: هذه المركبة لم تسجل دخولاً للمستودع حتى الآن' : 'Véhicule n\'a jamais franchi le géofencing du dépôt'}</span>
                        </div>
                      )}

                      {!v.neverEnteredDepot && (v.daysAwayFromDepot || 0) >= 5 && (
                        <div className="mt-2 text-[9px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 p-1.5 rounded-lg">
                          <Clock className="h-3 w-3" />
                          <span>{isAr ? `غائب عن المستودع منذ ${v.daysAwayFromDepot} يوماً` : `Absent du dépôt depuis ${v.daysAwayFromDepot} jours`}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Embedded Leaflet Geographic Map with Morocco Coordinates */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative flex flex-col min-h-[480px]">
              
              {/* Map Floating HUD Info Header */}
              <div className="absolute top-3 left-3 right-3 z-1000 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-950/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-2xl border border-slate-700/80 shadow-lg flex items-center gap-2 pointer-events-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black">
                    {ZAHI_DEPOTS_METADATA[selectedDepotFilter]?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono border-l border-slate-700 pl-2">
                    Périmètre 4.5 km
                  </span>
                </div>

                <div className="bg-slate-950/85 backdrop-blur-md text-slate-300 px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-lg text-[10px] flex items-center gap-3 pointer-events-auto">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {isAr ? 'قريب' : 'Proche'}
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {isAr ? 'في الطريق' : 'Transit'}
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    {isAr ? 'عطل' : 'Panne'}
                  </span>
                </div>
              </div>

              {/* The Leaflet Map DOM Element Container */}
              <div 
                ref={mapContainerRef} 
                className="w-full flex-1 min-h-[480px] bg-slate-900 z-0" 
              />

              {/* Map Floating Footer telemetry caption */}
              <div className="p-3 bg-slate-900 text-slate-300 text-[10px] border-t border-slate-800 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2 font-mono">
                  <span>📡 GPS Live Satellite</span>
                  <span>•</span>
                  <span>{ZAHI_DEPOTS_METADATA[selectedDepotFilter]?.address}</span>
                </div>
                <div className="font-bold text-sky-400">
                  {isAr ? 'نظام زاهي الذكي لإدارة ومحاكاة الأسطول © Zahi Ice Glaces' : 'Système de Géolocalisation Intelligente © Zahi Glaces'}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* --- ADD VEHICLE MODAL --- */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-4.5 w-4.5 text-sky-500" />
                {isAr ? 'تسجيل مركبة مبردة جديدة' : 'Nouveau Véhicule Réfrigéré'}
              </h3>
              <button 
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'نوع الخدمة' : 'Catégorie de véhicule'}</label>
                <select
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="transport">{isAr ? 'شحن المسافات الطويلة (Expédition Transport)' : 'Camion de Transport (Inter-Dépôts)'}</option>
                  <option value="livraison">{isAr ? 'توزيع محلي (Livraison régionale)' : 'Fourgon de Livraison (Clients/Épiceries)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'موديل الشاحنة / الصانع' : 'Modèle de camion'}</label>
                <input
                  type="text"
                  placeholder="e.g. Scania R500, Iveco Daily Refrigerator"
                  required
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'رقم اللوحة المعدنية' : 'Numéro d\'immatriculation (Plaque)'}</label>
                <input
                  type="text"
                  placeholder="e.g. 12-A-9999"
                  required
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, plateNumber: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'السعة الكلية (كرتونة)' : 'Capacité (Cartons)'}</label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    required
                    value={newVehicle.capacityCartons}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, capacityCartons: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'نقطة الانطلاق المعينة' : 'Point d\'attache'}</label>
                  <select
                    value={newVehicle.depotAssigned}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, depotAssigned: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="Usine">{isAr ? 'المصنع الرئيسي' : 'Usine Principale'}</option>
                    {(state?.depots ? Object.keys(state.depots) : ['Casablanca', 'Marrakech', 'Agadir', 'Fès', 'Tanger', 'Oujda', 'Meknès', 'Safi', 'Rabat', 'Laâyoune']).map(depot => (
                      <option key={depot} value={depot}>{depot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  {isAr ? 'تسجيل وحفظ' : 'Enregistrer le véhicule'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- ADD DRIVER MODAL --- */}
      {showAddDriverModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-violet-500" />
                {isAr ? 'تسجيل سائق جديد في النظام' : 'Nouveau Chauffeur'}
              </h3>
              <button 
                onClick={() => setShowAddDriverModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'الاسم الكامل للسائق' : 'Nom complet'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachid El Amrani"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'رقم رخصة السياقة المعنية' : 'N° de Permis de conduire'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EC/99999"
                  value={newDriver.licenseNumber}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'رقم هاتف السائق' : 'Téléphone portable'}</label>
                <input
                  type="text"
                  placeholder="+212 600-000000"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">{isAr ? 'تعيين لمركبة مبردة مسبقاً' : 'Assigner à un véhicule réfrigéré'}</label>
                <select
                  value={newDriver.assignedVehicleId}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, assignedVehicleId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">{isAr ? 'لم يعين بعد (قائمة الاحتياط)' : 'Laisser non assigné'}</option>
                  {vehicles.filter(v => !v.assignedDriverId).map(v => (
                    <option key={v.id} value={v.id}>{v.id} - {v.model} ({v.plateNumber})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  {isAr ? 'تسجيل وحفظ' : 'Enregistrer le chauffeur'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- 6. Trip History Modal --- */}
      {selectedVehicleForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.5 rounded">
                  {selectedVehicleForHistory.type === 'transport' ? (isAr ? 'شحن مسافات طويلة' : 'Transport Inter-Dépôts') : (isAr ? 'توزيع إقليمي محلي' : 'Livraison Locale')}
                </span>
                <h3 className="text-base font-black text-slate-800 dark:text-white mt-1.5 flex items-center gap-2">
                  <History className="h-5 w-5 text-violet-500" />
                  {isAr ? `سجل الرحلات للمركبة: ${selectedVehicleForHistory.model}` : `Historique des trajets - ${selectedVehicleForHistory.model}`}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedVehicleForHistory.id} • {selectedVehicleForHistory.plateNumber}</p>
              </div>
              <button
                onClick={() => setSelectedVehicleForHistory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Timeline */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {getVehicleHistory(selectedVehicleForHistory).length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  {isAr ? 'لا توجد رحلات مسجلة في التاريخ.' : 'Aucun trajet enregistré dans l\'historique.'}
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                  {getVehicleHistory(selectedVehicleForHistory).map((trip, idx) => (
                    <div key={idx} className="relative pl-9 flex flex-col sm:flex-row justify-between sm:items-center gap-2 group">
                      {/* Timeline dot */}
                      <span className="absolute left-1.5 top-2.5 w-4 h-4 rounded-full border-2 border-violet-500 bg-white dark:bg-slate-950 group-hover:bg-violet-500 transition-colors" />
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{trip.itinerary}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold uppercase">{trip.type}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-1">
                          <span>{isAr ? 'الرقم التتبعي:' : 'N°:'} <b className="font-mono">{trip.id}</b></span>
                          <span>•</span>
                          <span>{trip.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 sm:text-right sm:flex-col sm:items-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          trip.status.includes('Reçu') || trip.status.includes('Livré') || trip.status.includes('Complété')
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 animate-pulse'
                        }`}>
                          {trip.status}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          <span>{isAr ? 'الحمولة:' : 'Cargo:'} <b className="text-slate-600 dark:text-slate-300">{trip.cargo}</b></span>
                          <span className="mx-2">|</span>
                          <span>{isAr ? 'الحرارة:' : 'Temp:'} <b className="text-sky-500 font-mono">{trip.temp}</b></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedVehicleForHistory(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
