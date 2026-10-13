/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SystemState, TruckData, Delivery, Product } from '../types';
import { translations } from '../translations';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Package, 
  RotateCcw, 
  Play, 
  ArrowRight, 
  User, 
  Compass, 
  QrCode, 
  Radio, 
  CreditCard, 
  Banknote, 
  Check, 
  AlertCircle, 
  Store, 
  Snowflake, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Maximize2,
  Navigation,
  FileCheck
} from 'lucide-react';

interface FridgeLocationItem {
  id: string;
  serialNumber: string;
  type: string;
  client: string;
  depot: string;
  status: string;
  temperature?: number;
  nfcTagUid: string;
  nfcChipType: string;
  gps: {
    lat: number;
    lng: number;
    city: string;
    address: string;
  };
}

// Built-in fallback list of fridges equipped with Ntag215 RFID NFC tags
const DEFAULT_NFC_FRIDGES: FridgeLocationItem[] = [
  {
    id: 'REF-ZH-7501',
    serialNumber: 'ZAHI-CF-750109',
    type: 'AP',
    client: 'Alimentation Générale Benani',
    depot: 'Casablanca',
    status: 'service',
    temperature: -21.4,
    nfcTagUid: '04:5A:8E:12:3B:70:80',
    nfcChipType: 'NTAG215 (504 Bytes)',
    gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Bd Mohammed VI, Tit Mellil, Casablanca' }
  },
  {
    id: 'REF-ZH-7502',
    serialNumber: 'ZAHI-VD-750212',
    type: 'AG',
    client: 'Café Restaurant Al Amal',
    depot: 'Casablanca',
    status: 'service',
    temperature: 3.8,
    nfcTagUid: '04:7F:3C:99:A1:4D:81',
    nfcChipType: 'NTAG215 (504 Bytes)',
    gps: { lat: 33.5780, lng: -7.6320, city: 'Casablanca', address: 'Bd Al Massira Al Khadra, Maârif, Casablanca' }
  },
  {
    id: 'REF-ZH-7503',
    serialNumber: 'ZAHI-CF-750305',
    type: 'chest',
    client: 'Superette Panoramique',
    depot: 'Casablanca',
    status: 'service',
    temperature: -18.2,
    nfcTagUid: '04:88:2E:4A:F2:6C:80',
    nfcChipType: 'NTAG215 (504 Bytes)',
    gps: { lat: 33.5380, lng: -7.6000, city: 'Casablanca', address: 'Bd Panoramique, Ain Chock, Casablanca' }
  },
  {
    id: 'REF-ZH-7504',
    serialNumber: 'ZAHI-VD-750488',
    type: 'upright',
    client: 'Epicerie Chams Gueliz',
    depot: 'Marrakech',
    status: 'service',
    temperature: 4.2,
    nfcTagUid: '04:1A:9D:6B:2E:3F:80',
    nfcChipType: 'NTAG215 (504 Bytes)',
    gps: { lat: 31.6295, lng: -7.9811, city: 'Marrakech', address: 'Avenue Mohammed V, Gueliz, Marrakech' }
  },
  {
    id: 'REF-ZH-7506',
    serialNumber: 'ZAHI-VD-750625',
    type: 'AG',
    client: 'Superette Baie Malabata',
    depot: 'Tanger',
    status: 'service',
    temperature: 4.1,
    nfcTagUid: '04:C3:54:19:88:7B:80',
    nfcChipType: 'NTAG215 (504 Bytes)',
    gps: { lat: 35.7700, lng: -5.7850, city: 'Tanger', address: 'Baie de Tanger, Malabata, Tanger' }
  },
  {
    id: 'REF-ZH-7517',
    serialNumber: 'ZAHI-CF-751710',
    type: 'AP',
    client: 'Supermarché Al-Amri Berrechid',
    depot: 'Berrechid',
    status: 'service',
    temperature: -19.6,
    nfcTagUid: '04:D2:71:04:9A:5E:80',
    nfcChipType: 'NTAG215 (504 Bytes)',
    gps: { lat: 33.2655, lng: -7.5875, city: 'Berrechid', address: 'Avenue Mohammed V, Centre-ville, Berrechid' }
  }
];

interface DriverAppSimulatorProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  onDeliverClient: (
    truckId: string, 
    clientName: string, 
    items: Array<{ productId: string; quantity: number }>, 
    signature: string, 
    gps: { lat: number; lng: number }, 
    paymentMethod: 'Cash' | 'Credit' | 'Cheque'
  ) => void;
  onCloseTournee: (truckId: string, returns: any[], losses: any[]) => void;
  onRefresh: () => void;
  currentUser: any;
}

export default function DriverAppSimulator({
  state,
  lang,
  onDeliverClient,
  onCloseTournee,
  onRefresh,
  currentUser
}: DriverAppSimulatorProps) {
  const t = translations[lang];

  // Pick active truck
  const driverTruck = state.trucks.find(t => t.id === 'TRK-CA-01' || t.depotName === currentUser.depot) || state.trucks[0];
  const [activeTruckId, setActiveTruckId] = useState(driverTruck?.id || '');

  const truck = state.trucks.find(t => t.id === activeTruckId);

  // Mobile App Internal Navigation Pages
  const [mobilePage, setMobilePage] = useState<'home' | 'scan' | 'order' | 'deliveries' | 'end_day'>('home');
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  // Offline Simulation State
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Signature Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // GPS Simulation coordinates
  const [gpsCoords, setGpsCoords] = useState({ lat: 33.5530, lng: -7.4830 });

  // Returns and Losses forms
  const [unsoldReturns, setUnsoldReturns] = useState<any[]>([]);
  const [unsoldLosses, setUnsoldLosses] = useState<any[]>([]);

  // === SMART NFC TAG (NTAG215) SCANNING & DELIVERY FLOW STATES ===
  const [fridgesList, setFridgesList] = useState<FridgeLocationItem[]>([]);
  const [isScanningNfc, setIsScanningNfc] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const [selectedFridge, setSelectedFridge] = useState<FridgeLocationItem | null>(null);
  const [deliveredFridgeIds, setDeliveredFridgeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_delivered_fridge_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Order Cart state (Product ID -> quantity)
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit' | 'Cheque'>('Cash');
  const [deliverySuccessPopup, setDeliverySuccessPopup] = useState<{
    fridge: FridgeLocationItem;
    totalAmount: number;
    itemsCount: number;
    payment: string;
  } | null>(null);

  // Mini Leaflet Map ref in Mobile Screen
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Save delivered fridges
  useEffect(() => {
    try {
      localStorage.setItem('zahi_delivered_fridge_ids', JSON.stringify(deliveredFridgeIds));
    } catch {}
  }, [deliveredFridgeIds]);

  // Load Fridges list from localStorage or fallback
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zahi_refrigerators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: FridgeLocationItem[] = parsed
            .filter((f: any) => f.client && f.gps)
            .map((f: any, idx: number) => ({
              id: f.id,
              serialNumber: f.serialNumber,
              type: f.type || 'AP',
              client: f.client,
              depot: f.depot,
              status: f.status,
              temperature: f.temperature,
              nfcTagUid: `04:${(idx + 10).toString(16).toUpperCase()}:A${idx}:9B:${(idx + 22).toString(16).toUpperCase()}:80`,
              nfcChipType: 'NTAG215 (504 Bytes NFC Type 2)',
              gps: f.gps
            }));
          if (mapped.length > 0) {
            setFridgesList(mapped);
            return;
          }
        }
      }
    } catch {}
    setFridgesList(DEFAULT_NFC_FRIDGES);
  }, []);

  useEffect(() => {
    if (truck) {
      const latBase = truck.depotName === 'Marrakech' ? 31.6295 : 33.5731;
      const lngBase = truck.depotName === 'Marrakech' ? -7.9811 : -7.5898;
      setGpsCoords({ lat: latBase, lng: lngBase });
      
      setUnsoldReturns(truck.stock.map(s => ({ productId: s.productId, productName: s.productName, quantity: 0, reason: 'Retour invendu' })));
      setUnsoldLosses(truck.stock.map(s => ({ productId: s.productId, productName: s.productName, quantity: 0, reason: 'Casse camion' })));
    }
  }, [truck, activeTruckId]);

  // Initialize and update Mini Map on Mobile Screen when a fridge is selected
  useEffect(() => {
    if (!selectedFridge || !mapContainerRef.current) return;

    const lat = selectedFridge.gps.lat;
    const lng = selectedFridge.gps.lng;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom pulsing fridge pin icon
      const customIcon = L.divIcon({
        className: 'custom-fridge-pin',
        html: `
          <div style="background: #2563EB; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M5 10h16"/><path d="M15 6h1"/><path d="M15 15h1"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`<b>${selectedFridge.client}</b><br/>${selectedFridge.serialNumber}`).openPopup();

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([lat, lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.getPopup()?.setContent(`<b>${selectedFridge.client}</b><br/>${selectedFridge.serialNumber}`);
      }
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedFridge, mobilePage]);

  if (!truck) {
    return <div className="text-center py-12 text-slate-500">Aucun camion configuré pour ce chauffeur.</div>;
  }

  // Trigger NFC Scan Simulation
  const handleSimulateNfcScan = (targetFridge?: FridgeLocationItem) => {
    setIsScanningNfc(true);
    setScanPulse(true);

    const available = fridgesList.length > 0 ? fridgesList : DEFAULT_NFC_FRIDGES;
    // Choose fridge matching truck depot or specified one
    const fridgeToScan = targetFridge || 
      available.find(f => f.depot.toLowerCase() === truck.depotName.toLowerCase()) || 
      available[0];

    setTimeout(() => {
      setIsScanningNfc(false);
      setScanPulse(false);
      setSelectedFridge(fridgeToScan);
      setGpsCoords({ lat: fridgeToScan.gps.lat, lng: fridgeToScan.gps.lng });
      // Reset cart quantities
      const initialCart: Record<string, number> = {};
      state.products.slice(0, 3).forEach((p, idx) => {
        initialCart[p.id] = idx === 0 ? 5 : 3;
      });
      setCartQuantities(initialCart);
      setMobilePage('order');
    }, 1200);
  };

  // Drawing Canvas helpers
  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Cart calculations
  const cartEntries = Object.entries(cartQuantities).filter(([_, qty]) => qty > 0);
  const totalCartCartons = cartEntries.reduce((sum, [_, qty]) => sum + qty, 0);
  const totalAmountMAD = cartEntries.reduce((sum, [pId, qty]) => {
    const p = state.products.find(prod => prod.id === pId);
    // Price per carton (if unitPriceSell exists, e.g. 24 or 30 pcs per ctn)
    const cartonPrice = (p?.unitPriceSell || 3) * 24;
    return sum + (cartonPrice * qty);
  }, 0);

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  // Validate Smart NFC Delivery
  const handleValidateSmartDelivery = () => {
    if (!selectedFridge) return;
    if (totalCartCartons === 0) {
      alert(lang === 'fr' ? 'Veuillez saisir au moins une quantité de produit.' : 'يرجى إدخال كمية لمنتج واحد على الأقل.');
      return;
    }

    let signatureBase64 = '';
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      signatureBase64 = canvas.toDataURL('image/png');
    } else {
      // Fallback verified electronic signature hash
      signatureBase64 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10,25 Q35,5 60,25 T110,20" fill="none" stroke="%232563EB" stroke-width="3"/></svg>';
    }

    const deliveryItems = cartEntries.map(([productId, quantity]) => ({
      productId,
      quantity
    }));

    // Trigger parent delivery persistence
    onDeliverClient(
      truck.id,
      selectedFridge.client,
      deliveryItems,
      signatureBase64,
      selectedFridge.gps,
      paymentMethod
    );

    // Mark fridge as "Livré"
    if (!deliveredFridgeIds.includes(selectedFridge.id)) {
      setDeliveredFridgeIds(prev => [...prev, selectedFridge.id]);
    }

    // Show high-end success confirmation popup
    setDeliverySuccessPopup({
      fridge: selectedFridge,
      totalAmount: totalAmountMAD,
      itemsCount: totalCartCartons,
      payment: paymentMethod
    });

    handleClearSignature();
  };

  // Submit closing shift returns
  const handleShiftClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const returnsToSubmit = unsoldReturns.filter(r => r.quantity > 0);
    const lossesToSubmit = unsoldLosses.filter(l => l.quantity > 0);
    onCloseTournee(truck.id, returnsToSubmit, lossesToSubmit);
    alert(lang === 'fr' ? 'Rapport de fin de tournée transmis au dépôt !' : 'تم استلام المرتجعات والخسائر وإغلاق خط السير اليومي !');
    setMobilePage('home');
  };

  const isFridgeDelivered = (fridgeId: string) => deliveredFridgeIds.includes(fridgeId);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Truck Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{lang === 'fr' ? 'Application Camion Chauffeur Mobile' : 'تطبيق شاحنة التوزيع وسائقي زاهي'}</span>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] rounded-full font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                  NTAG215 RFID / NFC
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'fr' 
                  ? 'Scan RFID NTAG215 sur réfrigérateur, géolocalisation GPS en direct, catalogue produits réels en MAD et signature numérique.' 
                  : 'مسح ملصق Ntag215 الذكي للثلاجة، تحديد الموقع والزبون في الخريطة، إدخال المنتجات بـ MAD والتوقيع الإلكتروني.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{lang === 'fr' ? 'Chauffeur & Camion' : 'الشاحنة والسائق'}</label>
            <select
              value={activeTruckId}
              onChange={(e) => setActiveTruckId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {state.trucks.map(t => (
                <option key={t.id} value={t.id}>{t.id} - {t.driverName} ({t.depotName})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              // Quick trigger scan from top bar
              setMobilePage('scan');
              handleSimulateNfcScan();
            }}
            className="mt-4 md:mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Radio className="h-4 w-4 animate-pulse" />
            <span>{lang === 'fr' ? 'Scan NFC Tag' : 'مسح ملصق Ntag'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Mobile Simulator Frame */}
      <div className="flex justify-center items-center py-4">
        
        {/* Physical Smartphone Frame (iPhone/Android Modern Bezel) */}
        <div className="relative w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[52px] border-[12px] border-slate-900 shadow-2xl flex flex-col overflow-hidden ring-4 ring-slate-800/20">
          
          {/* Dynamic Island / Speaker Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-full z-50 flex items-center justify-between px-3 border border-slate-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
            <div className="w-2 h-2 rounded-full bg-indigo-500/80 animate-ping" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          {/* Smartphone Screen Body */}
          <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col pt-8 font-sans select-none relative overflow-hidden">
            
            {/* Top Status Bar */}
            <div className="h-7 px-6 flex items-center justify-between text-xxs font-bold text-slate-400 bg-slate-950 z-30 select-none">
              <span>09:41</span>
              
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9px] font-black tracking-wider text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/40">
                  <Radio className="h-2.5 w-2.5 text-indigo-400" />
                  NFC ON
                </span>
                {offlineMode ? (
                  <span className="flex items-center gap-1 text-rose-500 font-extrabold text-[9px]">
                    <WifiOff className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-extrabold text-[9px]">
                    <Wifi className="h-3 w-3" />
                  </span>
                )}
                <span className="h-2.5 w-5 bg-slate-800 border border-slate-700 rounded-xs flex items-center px-0.5">
                  <span className="h-full w-3.5 bg-emerald-500 rounded-xs" />
                </span>
              </div>
            </div>

            {/* Quick Action Navigation Bar inside Screen */}
            <div className="p-2.5 bg-slate-900/90 border-b border-slate-800/80 flex justify-between items-center gap-2 z-20 backdrop-blur">
              <div className="flex items-center gap-1.5 truncate">
                <Store className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-black text-white truncate">{truck.driverName}</span>
                <span className="text-[9px] font-mono text-slate-400 shrink-0">({truck.id})</span>
              </div>

              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className={`px-2 py-0.5 text-[9px] font-black rounded-md flex items-center gap-1 transition-all ${
                  offlineMode 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {offlineMode ? 'Hors-ligne' : 'En ligne'}
              </button>
            </div>

            {/* Screen Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-20 space-y-3.5">

              {/* ======================================================== */}
              {/* PAGE 1: HOME / DASHBOARD & NFC QUICK LAUNCH              */}
              {/* ======================================================== */}
              {mobilePage === 'home' && (
                <div className="space-y-3.5 animate-fadeIn">
                  
                  {/* Hero Shift Banner */}
                  <div className="p-4 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-600 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
                      <Radio className="h-24 w-24 text-white" />
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-indigo-200 tracking-wider">Tournée du Jour</span>
                        <h4 className="text-base font-black text-white leading-tight mt-0.5">{truck.tournee}</h4>
                        <p className="text-[10px] text-blue-100 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>Dépôt {truck.depotName}</span>
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-white/20 backdrop-blur rounded-xl text-[10px] font-bold text-white">
                        {deliveredFridgeIds.length} / {fridgesList.length} Livrés
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-blue-100 font-medium">Bilan Réfrigérateurs</span>
                      <span className="font-black text-white font-mono bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">
                        NTAG215 Activé
                      </span>
                    </div>
                  </div>

                  {/* Main Action: SMART SCAN NTAG215 BUTTON */}
                  <button
                    onClick={() => {
                      setMobilePage('scan');
                    }}
                    className="w-full p-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-3xl shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all transform active:scale-98 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                        <Radio className="h-6 w-6 text-white animate-pulse" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-wide">
                          {lang === 'fr' ? 'Scanner Tag Ntag215' : 'مسح ملصق Ntag215 للثلاجة'}
                        </p>
                        <p className="text-[10px] text-emerald-100 mt-0.5 font-medium">
                          {lang === 'fr' ? 'Approcher le téléphone du sticker Zahi' : 'قرب الهاتف من ملصق الثلاجة'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Fridges in this tour list */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Snowflake className="h-3.5 w-3.5 text-blue-400" />
                        <span>{lang === 'fr' ? 'Réfrigérateurs Clients' : 'ثلاجات زبائن الجولة'}</span>
                      </h5>
                      <span className="text-[10px] font-mono text-slate-500">{fridgesList.length} tags</span>
                    </div>

                    <div className="space-y-2">
                      {fridgesList.slice(0, 4).map(f => {
                        const delivered = isFridgeDelivered(f.id);
                        return (
                          <div
                            key={f.id}
                            onClick={() => {
                              setSelectedFridge(f);
                              setGpsCoords({ lat: f.gps.lat, lng: f.gps.lng });
                              setMobilePage('order');
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                              delivered 
                                ? 'bg-emerald-950/20 border-emerald-800/40' 
                                : 'bg-slate-900 border-slate-800 hover:border-indigo-600/50'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white truncate">{f.client}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono font-bold border border-indigo-900/50">
                                  {f.type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                                <MapPin className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                                <span className="truncate">{f.gps.address}</span>
                              </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {delivered ? (
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[9px] font-black tracking-wider uppercase flex items-center gap-1">
                                  <Check className="h-2.5 w-2.5" />
                                  <span>Livré</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSimulateNfcScan(f);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <Radio className="h-3 w-3" />
                                  <span>Scan</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Camion Stock Overview */}
                  <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-2xl space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Stock Camion Embarqué</span>
                      <span className="font-mono text-blue-400">{truck.stock.reduce((s, it) => s + (it.loaded - it.delivered), 0)} ctn</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {truck.stock.slice(0, 4).map(st => {
                        const inTruck = st.loaded - st.delivered - st.returned - st.lost;
                        return (
                          <div key={st.productId} className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px] flex justify-between items-center">
                            <span className="truncate text-slate-300 pr-1">{st.productName}</span>
                            <span className="font-mono font-bold text-indigo-400">{inTruck}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 2: NFC SCANNER RADAR / EMULATOR SCREEN              */}
              {/* ======================================================== */}
              {mobilePage === 'scan' && (
                <div className="space-y-4 animate-fadeIn text-center py-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Radio className="h-3.5 w-3.5" />
                      Lecteur RFID / NFC
                    </span>
                    <button 
                      onClick={() => setMobilePage('home')} 
                      className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-white rounded-md"
                    >
                      ✕ Fermer
                    </button>
                  </div>

                  {/* Physical Ntag215 Sticker Visual Card */}
                  <div className="mx-auto w-56 p-4 bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950/40 rounded-3xl border-2 border-dashed border-indigo-500/40 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                      <span className="text-[9px] font-black text-amber-400 font-mono">ZAHI RFID</span>
                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">NTAG215</span>
                    </div>

                    {/* Animated Pulsing Antenna Rings */}
                    <div className="py-6 relative flex justify-center items-center">
                      <div className={`w-28 h-28 rounded-full border-2 border-indigo-500/30 flex items-center justify-center transition-all ${isScanningNfc ? 'animate-ping' : ''}`}>
                        <div className="w-20 h-20 rounded-full border-2 border-indigo-500/60 flex items-center justify-center bg-indigo-600/10">
                          <Radio className={`h-10 w-10 text-indigo-400 ${isScanningNfc ? 'animate-bounce' : ''}`} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-center">
                      <p className="text-[11px] font-black text-white">Sticker Ntag215 sur Réfrigérateur</p>
                      <p className="text-[9px] text-slate-400 font-mono">13.56 MHz • ISO 14443-A</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-white">
                      {isScanningNfc 
                        ? (lang === 'fr' ? 'Lecture du tag en cours...' : 'جاري قراءة الملصق الذكي...') 
                        : (lang === 'fr' ? 'Prêt pour le Scan NFC' : 'جاهز للمسح')}
                    </h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      {lang === 'fr' 
                        ? 'Placez le dos du téléphone sur le sticker du réfrigérateur pour charger automatiquement le client et la position GPS.' 
                        : 'ضع ظهر الهاتف على ملصق الثلاجة Ntag215 ليتم تحميل بيانات الزبون وموقعه تلقائياً.'}
                    </p>
                  </div>

                  {/* Manual trigger / Pick test fridge */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleSimulateNfcScan()}
                      disabled={isScanningNfc}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <Radio className="h-4 w-4" />
                      <span>{isScanningNfc ? 'Lecture en cours...' : 'Simuler le Scan (Ntag215)'}</span>
                    </button>

                    <div className="pt-2 text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Ou sélectionner une cible directe :</span>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {fridgesList.slice(0, 4).map(f => (
                          <button
                            key={f.id}
                            onClick={() => handleSimulateNfcScan(f)}
                            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left text-[10px] truncate cursor-pointer transition-colors"
                          >
                            <p className="font-bold text-white truncate">{f.client}</p>
                            <p className="text-[9px] text-indigo-400 font-mono">{f.serialNumber}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 3: ORDER, GPS MAP, QUANTITIES & SIGNATURE SCREEN   */}
              {/* ======================================================== */}
              {mobilePage === 'order' && selectedFridge && (
                <div className="space-y-3.5 animate-fadeIn">
                  
                  {/* Top Bar with fridge identity */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider font-mono">
                        {selectedFridge.nfcChipType}
                      </span>
                    </div>
                    <button 
                      onClick={() => setMobilePage('home')} 
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 bg-slate-850 rounded"
                    >
                      ✕ Retour
                    </button>
                  </div>

                  {/* 1. Client & Fridge Identified Card */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-800/40 rounded-2xl shadow-md space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Client Associé</span>
                        <h4 className="text-sm font-black text-white">{selectedFridge.client}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          UID: <span className="text-amber-400">{selectedFridge.nfcTagUid}</span> • {selectedFridge.serialNumber}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isFridgeDelivered(selectedFridge.id)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isFridgeDelivered(selectedFridge.id) ? '✓ Livré' : 'À Livrer'}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">{selectedFridge.temperature || -20}°C</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-300">
                      <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                      <span className="truncate">{selectedFridge.gps.address}</span>
                    </div>
                  </div>

                  {/* 2. Embedded Leaflet Mini GPS Map */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-blue-400" />
                        Localisation GPS de la Réfrigérateur
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {selectedFridge.gps.lat.toFixed(4)}, {selectedFridge.gps.lng.toFixed(4)}
                      </span>
                    </div>

                    <div className="h-36 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative z-0">
                      <div ref={mapContainerRef} className="w-full h-full bg-slate-900" />
                    </div>
                  </div>

                  {/* 3. Real Product Quantities Input (with MAD total) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-amber-400" />
                        Sélection des Produits & Quantités
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        Total: {totalAmountMAD.toFixed(2)} MAD
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {state.products.map(product => {
                        const qty = cartQuantities[product.id] || 0;
                        const cartonPrice = (product.unitPriceSell || 3) * 24; // MAD per carton
                        const subtotal = qty * cartonPrice;

                        return (
                          <div 
                            key={product.id}
                            className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                              qty > 0 
                                ? 'bg-slate-900 border-indigo-700/60' 
                                : 'bg-slate-950 border-slate-850'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="text-xs font-bold text-white truncate">{product.name}</p>
                              <p className="text-[9px] text-slate-400">
                                <span className="font-mono text-slate-300">{cartonPrice.toFixed(0)} MAD</span>/ctn
                                {qty > 0 && (
                                  <span className="ml-1.5 font-bold text-amber-400 font-mono">= {subtotal.toFixed(0)} MAD</span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(product.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setCartQuantities(prev => ({ ...prev, [product.id]: val }));
                                }}
                                className="w-10 text-center bg-slate-900 border border-slate-700 rounded-md py-0.5 text-xs font-mono font-bold text-white"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(product.id, 1)}
                                className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Payment Method Choice */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode de Paiement</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Cash')}
                        className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === 'Cash'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Banknote className="h-3.5 w-3.5" />
                        <span>Espèces</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Credit')}
                        className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === 'Credit'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Crédit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Cheque')}
                        className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === 'Cheque'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Chèque</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Electronic Signature Canvas Panel */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileCheck className="h-3 w-3 text-indigo-400" />
                        Tsignature Électronique Client
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-[9px] text-slate-400 hover:text-rose-400 font-bold"
                      >
                        Effacer
                      </button>
                    </div>

                    <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-700 shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={330}
                        height={90}
                        onMouseDown={handleStartDrawing}
                        onMouseMove={handleDraw}
                        onMouseUp={handleStopDrawing}
                        onMouseLeave={handleStopDrawing}
                        onTouchStart={handleStartDrawing}
                        onTouchMove={handleDraw}
                        onTouchEnd={handleStopDrawing}
                        className="w-full bg-slate-50 touch-none cursor-crosshair"
                      />
                    </div>
                    <p className="text-[8px] text-slate-500 italic text-center">
                      Signez avec le doigt ou la souris à la réception des cartons
                    </p>
                  </div>

                  {/* 6. Grand Validate Button */}
                  <button
                    type="button"
                    onClick={handleValidateSmartDelivery}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>VALIDER LA LIVRAISON ({totalAmountMAD.toFixed(2)} MAD)</span>
                  </button>

                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 4: TOUR LIST / ALL DELIVERIES                     */}
              {/* ======================================================== */}
              {mobilePage === 'deliveries' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {lang === 'fr' ? 'Plan de Tournée' : 'قائمة التسليمات'}
                    </h5>
                    <button onClick={() => setMobilePage('home')} className="text-xxs text-slate-400 hover:text-white">✕ Retour</button>
                  </div>

                  <div className="space-y-2">
                    {fridgesList.map(fridge => {
                      const delivered = isFridgeDelivered(fridge.id);
                      return (
                        <div 
                          key={fridge.id}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-white">{fridge.client}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-500" />
                                <span>{fridge.gps.address}</span>
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              delivered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {delivered ? '✓ Livré' : 'En attente'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-850">
                            <span className="text-[10px] font-mono text-indigo-400">Tag: {fridge.nfcTagUid}</span>
                            <button
                              onClick={() => {
                                setSelectedFridge(fridge);
                                setGpsCoords({ lat: fridge.gps.lat, lng: fridge.gps.lng });
                                setMobilePage('order');
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xxs font-black"
                            >
                              {delivered ? 'Voir détails' : 'Livrer maintenant'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PAGE 5: END OF DAY CLÔTURE TOURNEE                     */}
              {/* ======================================================== */}
              {mobilePage === 'end_day' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {lang === 'fr' ? 'Clôture de la Tournée' : 'إغلاق اليومية'}
                    </h5>
                    <button onClick={() => setMobilePage('home')} className="text-xxs text-slate-400 hover:text-white">✕ Back</button>
                  </div>

                  <form onSubmit={handleShiftClosingSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cartons Invendus (Retour Dépôt)</p>
                      {unsoldReturns.map((r, i) => (
                        <div key={r.productId} className="flex justify-between items-center gap-2 text-xxs bg-slate-900 p-2 rounded-xl">
                          <span className="truncate flex-1 text-slate-300 font-medium">{r.productName}</span>
                          <input
                            type="number"
                            value={r.quantity}
                            onChange={(e) => {
                              const updated = [...unsoldReturns];
                              updated[i].quantity = Math.max(0, Number(e.target.value));
                              setUnsoldReturns(updated);
                            }}
                            className="w-12 text-center bg-slate-950 border border-slate-800 text-white py-1 rounded-lg"
                            min={0}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl cursor-pointer"
                    >
                      Transmettre le Rapport de Clôture
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Smart Delivery Success Modal Popup inside Mobile */}
            {deliverySuccessPopup && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 w-full max-w-xs text-center space-y-3 shadow-2xl">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/40 animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Opération Réussie
                    </span>
                    <h4 className="text-base font-black text-white mt-1">Réfrigérateur Livré !</h4>
                    <p className="text-xs font-bold text-slate-300 mt-0.5">{deliverySuccessPopup.fridge.client}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{deliverySuccessPopup.fridge.serialNumber}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total payé :</span>
                      <span className="font-mono font-black text-emerald-400">{deliverySuccessPopup.totalAmount.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantité :</span>
                      <span className="font-mono text-white">{deliverySuccessPopup.itemsCount} cartons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mode :</span>
                      <span className="font-bold text-indigo-400">{deliverySuccessPopup.payment}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-850">
                      <span className="text-slate-400">Tag RFID :</span>
                      <span className="font-mono text-amber-400 text-[10px]">{deliverySuccessPopup.fridge.nfcTagUid}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDeliverySuccessPopup(null);
                      setMobilePage('home');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    Continuer la Tournée
                  </button>
                </div>
              </div>
            )}

            {/* Smartphone Bottom Navigation Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/95 border-t border-slate-850 px-6 flex items-center justify-between z-30 backdrop-blur">
              <button 
                onClick={() => setMobilePage('home')}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'home' ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Accueil</span>
              </button>

              <button 
                onClick={() => {
                  setMobilePage('scan');
                }}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'scan' ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                <Radio className="h-4 w-4" />
                <span>NFC Tag</span>
              </button>

              <button 
                onClick={() => setMobilePage('deliveries')}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'deliveries' ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                <MapPin className="h-4 w-4" />
                <span>Tournée</span>
              </button>

              <button 
                onClick={() => setMobilePage('end_day')}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'end_day' ? 'text-indigo-400' : 'text-slate-500'}`}
              >
                <Clock className="h-4 w-4" />
                <span>Clôture</span>
              </button>
            </div>

            {/* Apple / Android Home Indicator bar */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-800 rounded-full z-40 pointer-events-none" />

          </div>
        </div>

      </div>
    </div>
  );
}
