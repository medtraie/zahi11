/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SystemState, User, UserRole, AuditLog, TransferItem } from './types';
import { translations } from './translations';
import Header from './components/Header';
import SupplyChainMap from './components/SupplyChainMap';
import Dashboard from './components/Dashboard';
import ProductionModule from './components/ProductionModule';
import TransferModule from './components/TransferModule';
import DepotModule from './components/DepotModule';
import DriverAppSimulator from './components/DriverAppSimulator';
import FinanceModule from './components/FinanceModule';
import VehicleDriverModule, { Vehicle, Driver } from './components/VehicleDriverModule';
import ProductCatalogue from './components/ProductCatalogue';
import StockMovementModule from './components/StockMovementModule';
import RefrigeratorModule from './components/RefrigeratorModule';
import ReparationModule from './components/ReparationModule';
import ListingModule from './components/ListingModule';
import StorageModal from './components/StorageModal';
import { apiRequest } from './utils/apiClient';
import { subscribeToState } from './services/localStorageService';
import { 
  LayoutDashboard, 
  Boxes, 
  Layers, 
  MapPin, 
  Smartphone, 
  LineChart, 
  FileText,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Sliders,
  CheckCircle,
  Clock,
  Settings,
  Truck,
  IceCream,
  History,
  Snowflake,
  Wrench
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [preselectedProductIdForProduction, setPreselectedProductIdForProduction] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showStorageModal, setShowStorageModal] = useState<boolean>(false);
  const [resetConfirmCode, setResetConfirmCode] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  
  // App state from server
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lifted Fleet Management State with Client-Side Persistence
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_vehicles');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'TRK-EXP-101',
        type: 'transport',
        model: 'Scania R450 Streamline',
        plateNumber: '12-A-54321',
        capacityCartons: 1500,
        currentTemp: -21.4,
        isRefrigerationOn: true,
        assignedDriverId: 'DRV-001',
        fuelLevel: 82,
        status: 'En transit',
        depotAssigned: 'Usine'
      },
      {
        id: 'TRK-EXP-102',
        type: 'transport',
        model: 'Volvo FH16 Globetrotter',
        plateNumber: '50-B-9876',
        capacityCartons: 1500,
        currentTemp: -19.5,
        isRefrigerationOn: true,
        assignedDriverId: 'DRV-002',
        fuelLevel: 65,
        status: 'En transit',
        depotAssigned: 'Casablanca'
      },
      {
        id: 'TRK-EXP-103',
        type: 'transport',
        model: 'Renault Trucks T-High',
        plateNumber: '26-D-7654',
        capacityCartons: 1200,
        currentTemp: -15.2,
        isRefrigerationOn: false,
        assignedDriverId: 'DRV-003',
        fuelLevel: 45,
        status: 'Alerte',
        depotAssigned: 'Marrakech'
      },
      {
        id: 'VAN-LIV-201',
        type: 'livraison',
        model: 'Iveco Daily Refrigerator',
        plateNumber: '33-H-1234',
        capacityCartons: 300,
        currentTemp: -18.4,
        isRefrigerationOn: true,
        assignedDriverId: 'DRV-004',
        fuelLevel: 90,
        status: 'En livraison',
        depotAssigned: 'Casablanca'
      },
      {
        id: 'VAN-LIV-202',
        type: 'livraison',
        model: 'Mercedes-Benz Sprinter Chéreau',
        plateNumber: '44-F-5678',
        capacityCartons: 250,
        currentTemp: -19.1,
        isRefrigerationOn: true,
        assignedDriverId: 'DRV-005',
        fuelLevel: 78,
        status: 'Disponible',
        depotAssigned: 'Marrakech'
      },
      {
        id: 'VAN-LIV-203',
        type: 'livraison',
        model: 'Isuzu Elf Freezer',
        plateNumber: '15-G-4321',
        capacityCartons: 300,
        currentTemp: -18.0,
        isRefrigerationOn: true,
        assignedDriverId: 'DRV-006',
        fuelLevel: 32,
        status: 'En livraison',
        depotAssigned: 'Tanger'
      }
    ];
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_drivers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'DRV-001',
        name: 'Rachid El Amrani',
        licenseNumber: 'EC/123456',
        phone: '+212 661-234567',
        status: 'En mission',
        coldChainScore: 98,
        completedTrips: 124,
        assignedVehicleId: 'TRK-EXP-101'
      },
      {
        id: 'DRV-002',
        name: 'Mustapha Ait Ben Haddou',
        licenseNumber: 'EC/987654',
        phone: '+212 662-876543',
        status: 'En mission',
        coldChainScore: 99,
        completedTrips: 215,
        assignedVehicleId: 'TRK-EXP-102'
      },
      {
        id: 'DRV-003',
        name: 'Karim Bennani',
        licenseNumber: 'EC/456123',
        phone: '+212 663-112233',
        status: 'En mission',
        coldChainScore: 84,
        completedTrips: 92,
        assignedVehicleId: 'TRK-EXP-103'
      },
      {
        id: 'DRV-004',
        name: 'Yassine Belkhadir',
        licenseNumber: 'BC/789012',
        phone: '+212 664-998877',
        status: 'En mission',
        coldChainScore: 97,
        completedTrips: 184,
        assignedVehicleId: 'VAN-LIV-201'
      },
      {
        id: 'DRV-005',
        name: 'Tarik Jamil',
        licenseNumber: 'BC/345678',
        phone: '+212 665-443322',
        status: 'Disponible',
        coldChainScore: 96,
        completedTrips: 142,
        assignedVehicleId: 'VAN-LIV-202'
      },
      {
        id: 'DRV-006',
        name: 'Hicham Daoudi',
        licenseNumber: 'BC/901234',
        phone: '+212 666-554433',
        status: 'En mission',
        coldChainScore: 95,
        completedTrips: 110,
        assignedVehicleId: 'VAN-LIV-203'
      },
      {
        id: 'DRV-007',
        name: 'Amina Tazi',
        licenseNumber: 'BC/567890',
        phone: '+212 667-667788',
        status: 'Disponible',
        coldChainScore: 100,
        completedTrips: 45,
        assignedVehicleId: null
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zahi_vehicles', JSON.stringify(vehicles));
    } catch {}
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem('zahi_drivers', JSON.stringify(drivers));
    } catch {}
  }, [drivers]);

  // Current active logged-in user
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-admin',
    username: 'youssef',
    name: 'Youssef Zahi',
    role: 'Super Admin'
  });

  // Client-side notifications
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: 'info' | 'warning' | 'error' | 'success'; time: string }>>([
    { id: 'n-1', text: 'Bienvenue sur le système logistique Zahi Ice cream.', type: 'info', time: 'À l\'instant' },
    { id: 'n-2', text: 'Alerte Congélateur : Température critique détectée au Dépôt Marrakech (-16.5°C).', type: 'warning', time: 'Il y a 5 min' }
  ]);

  // Fetch the current full state from the server or local storage
  const fetchState = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/state');
      if (data) {
        setState(data);
        setError(null);
      }
    } catch (err: any) {
      console.error(err);
      setError("Le serveur n'a pas pu démarrer ou le fichier est introuvable. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Subscribe to multi-component or multi-tab state sync
    const unsubscribe = subscribeToState((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Update body classes for language direction (RTL/LTR) and dark mode
  useEffect(() => {
    const html = document.documentElement;
    if (lang === 'ar') {
      html.dir = 'rtl';
    } else {
      html.dir = 'ltr';
    }
  }, [lang]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (darkMode) {
      html.classList.add('dark');
      body.classList.add('dark', 'bg-slate-950', 'text-slate-100');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark', 'bg-slate-950', 'text-slate-100');
    }
  }, [darkMode]);

  const handleLangChange = (selected: 'fr' | 'ar') => {
    setLang(selected);
  };

  const handleResetData = () => {
    setResetConfirmCode('');
    setResetError(null);
    setShowResetConfirmModal(true);
  };

  const executeResetData = async () => {
    if (resetConfirmCode.trim() !== '1234561') {
      setResetError(lang === 'fr' ? 'Code de confirmation incorrect.' : 'رمز التأكيد غير صحيح.');
      return;
    }
    try {
      setLoading(true);
      setShowResetConfirmModal(false);
      const data = await apiRequest('/api/reset', { method: 'POST' });
      if (data?.success) {
        setState(data.state);
        setNotifications([
          { id: `n-${Date.now()}`, text: 'Base de données réinitialisée.', type: 'success', time: 'À l\'instant' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (batch: { productId: string; quantity: number; tempRegistered: number; batchNumber: string; newProduct?: any }) => {
    try {
      const data = await apiRequest('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batch, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        // Add alert notification
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Production : Nouveau lot ${batch.batchNumber} de ${batch.quantity} cartons enregistré à l'Usine.`, 
            type: 'success', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTransfer = async (transfer: { source: string; destination: string; items: TransferItem[]; carrierName: string; notes: string }) => {
    try {
      const data = await apiRequest('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transfer, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Transfert : Expédition du transfert vers ${transfer.destination} (Chauffeur: ${transfer.carrierName}).`, 
            type: 'info', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      } else {
        alert(data?.error || "Erreur lors du transfert");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTransferStatus = async (
    transferId: string,
    status: 'In Transit' | 'Received',
    scannedCartons?: number,
    lossCount?: number,
    tempAlert?: boolean,
    notes?: string
  ) => {
    try {
      const data = await apiRequest(`/api/transfers/${transferId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, scannedCartons, lossCount, tempAlert, notes, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Transfert Réceptionné ! Pertes constatées: ${lossCount || 0} cartons. Temp OK: ${!tempAlert}`, 
            type: lossCount && lossCount > 0 ? 'warning' : 'success', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadTruck = async (truckId: string, items: Array<{ productId: string; productName: string; quantity: number }>, tournee: string) => {
    try {
      const data = await apiRequest(`/api/trucks/${truckId}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, tournee, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Camion chargé : Le camion ${truckId} a été chargé avec ${items.reduce((s, i) => s + i.quantity, 0)} cartons.`, 
            type: 'success', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeliverClient = async (
    truckId: string, 
    clientName: string, 
    items: Array<{ productId: string; quantity: number }>, 
    signature: string, 
    gps: { lat: number; lng: number }, 
    paymentMethod: 'Cash' | 'Credit' | 'Cheque'
  ) => {
    try {
      const data = await apiRequest(`/api/trucks/${truckId}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, items, signature, gps, paymentMethod, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Livraison effectuée : Camion ${truckId} a livré ${clientName} (${paymentMethod}).`, 
            type: 'success', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseTournee = async (truckId: string, returns: any[], losses: any[]) => {
    try {
      const data = await apiRequest(`/api/trucks/${truckId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returns, losses, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Tournée Clôturée : Camion ${truckId} a déchargé ses retours au dépôt d'origine.`, 
            type: 'info', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDepotAdjustment = async (depotName: string, productId: string, type: 'damaged' | 'lost' | 'correction', quantity: number, notes: string) => {
    try {
      const data = await apiRequest(`/api/depots/${depotName}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, type, quantity, notes, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Ajustement Dépôt ${depotName} : ${type} de ${quantity} cartons enregistré.`, 
            type: type === 'correction' ? 'info' : 'warning', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDepotReturn = async (depotName: string, productId: string, quantity: number, reason: string) => {
    try {
      const data = await apiRequest(`/api/depots/${depotName}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, reason, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDepot = async (name: string) => {
    try {
      const data = await apiRequest(`/api/depots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        setNotifications(prev => [
          { 
            id: `n-${Date.now()}`, 
            text: `Nouveau dépôt créé : ${name}`, 
            type: 'success', 
            time: 'À l\'instant' 
          },
          ...prev
        ]);
        return true;
      } else {
        alert(data?.error || "Une erreur s'est produite.");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateDepotStartingStock = async (depotName: string, productId: string, startingStock: number, quantity: number) => {
    try {
      const data = await apiRequest(`/api/depots/${depotName}/starting-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, startingStock, quantity, user: currentUser })
      });
      if (data?.success) {
        setState(data.state);
        return true;
      } else {
        alert(data?.error || "Une erreur s'est produite.");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-lg animate-spin">
            <RefreshCw className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase">Zahi Logistics</h2>
          <p className="text-xs text-slate-400">Démarrage du système de stock en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100">
        <div className="max-w-md bg-white dark:bg-slate-900 border border-red-100 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-black text-slate-800 dark:text-white">Une erreur est survenue</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
          <button 
            onClick={fetchState} 
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  const t = translations[lang];

  // Tab configurations
  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { id: 'catalogue', label: lang === 'fr' ? 'Catalogue Zahi' : 'كتالوج زاهي للمثلجات', icon: <IceCream className="h-4.5 w-4.5" /> },
    { id: 'refrigerators', label: lang === 'fr' ? 'Gestion Réfrigérateurs' : 'إدارة الثلاجات', icon: <Snowflake className="h-4.5 w-4.5" /> },
    { id: 'listing', label: lang === 'fr' ? 'Listing Vendeurs' : 'قائمة الموزعين والثلاجات', icon: <FileText className="h-4.5 w-4.5" /> },
    { id: 'geoloc', label: lang === 'fr' ? 'Géolocalisation GPS' : 'التتبع الجغرافي GPS', icon: <MapPin className="h-4.5 w-4.5" /> },
    { id: 'production', label: t.production, icon: <Boxes className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Responsable Usine', 'Comptable', 'Responsable Commercial'] },
    { id: 'transfers', label: t.transfers, icon: <Layers className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Responsable Usine', 'Responsable MICZ', 'Responsable Zone Logistique', 'Responsable Dépôt'] },
    { id: 'depots', label: t.depots, icon: <MapPin className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Responsable Dépôt', 'Comptable', 'Responsable Commercial'] },
    { id: 'vehicles', label: t.vehicles, icon: <Truck className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Responsable Dépôt', 'Responsable Usine', 'Responsable MICZ', 'Responsable Zone Logistique', 'Comptable', 'Responsable Commercial'] },
    { id: 'fridgeLogistics', label: lang === 'fr' ? 'Logistique & Affectation Chauffeurs' : 'اللوجستيات وتعيين السائقين', icon: <Truck className="h-4.5 w-4.5 text-sky-500" />, roles: ['Super Admin', 'Responsable Dépôt', 'Responsable Usine', 'Responsable MICZ', 'Responsable Zone Logistique', 'Comptable', 'Responsable Commercial'] },
    { id: 'reparation', label: lang === 'fr' ? 'Atelier Réparation' : 'ورشة الإصلاح والصيانة', icon: <Wrench className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Responsable Dépôt', 'Responsable Usine', 'Responsable MICZ', 'Responsable Zone Logistique', 'Comptable', 'Responsable Commercial'] },
    { id: 'driverApp', label: t.driverApp, icon: <Smartphone className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Chauffeur'] },
    { id: 'financials', label: t.financials, icon: <LineChart className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Comptable', 'Responsable Commercial'] },
    { id: 'stockMovement', label: t.stockMovement, icon: <History className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Responsable Usine', 'Responsable MICZ', 'Responsable Zone Logistique', 'Responsable Dépôt', 'Comptable', 'Responsable Commercial'] },
    { id: 'auditLogs', label: t.auditLogs, icon: <FileText className="h-4.5 w-4.5" />, roles: ['Super Admin', 'Comptable'] }
  ];

  // Helper to check role authorization on active view tab
  const isAuthorized = (tabRoles?: string[]) => {
    if (!tabRoles) return true; // Accessible by default
    return tabRoles.includes(currentUser.role);
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-200 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. Header Navigation and Controls */}
      <Header
        currentUser={currentUser}
        onUserChange={(usr) => {
          setCurrentUser(usr);
          // Auto route tab to authorized views if current tab becomes unauthorized
          const activeTabConf = tabs.find(t => t.id === activeTab);
          if (activeTabConf?.roles && !activeTabConf.roles.includes(usr.role)) {
            setActiveTab('dashboard');
          }
        }}
        lang={lang}
        onLangChange={handleLangChange}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        onReset={handleResetData}
        onRefresh={fetchState}
        onOpenStorageModal={() => setShowStorageModal(true)}
        notifications={notifications}
        onClearNotifications={handleClearNotifications}
        syncPendingCount={0}
      />

      <main className="max-w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Active Role Permissions Indicator strip */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-sky-500/5 dark:bg-slate-900/60 border border-sky-500/20 dark:border-slate-800 rounded-xl text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-sky-500 rounded-full animate-pulse" />
            <span className="text-slate-600 dark:text-slate-300">
              {lang === 'fr' ? 'Session active :' : 'الجلسة النشطة :'} <b className="text-slate-900 dark:text-white">{currentUser.name}</b> ({t[currentUser.role.toLowerCase().replace(/\s+/g, '') as keyof typeof t] || currentUser.role})
            </span>
          </div>

          <div className="text-[10px] text-slate-400 font-medium">
            {lang === 'fr' ? '*Les fonctionnalités sont restreintes selon le rôle sélectionné.' : '*الصلاحيات مقيدة حسب الدور المحدد.'}
          </div>
        </div>

        {/* 2. Side-By-Side Sidebar Navigation Tab structure on Large screens, Horizontal on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Tabs */}
          <div className="space-y-1.5 lg:sticky lg:top-24 lg:col-span-3 xl:col-span-2">
            {tabs.filter(tab => isAuthorized(tab.roles)).map(tab => {
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-500/15 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400 dark:shadow-sky-500/5'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className={active ? 'text-white dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span className="truncate flex-1">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Presentational Containers */}
          <div className="lg:col-span-9 xl:col-span-10 space-y-6 min-w-0">
            
            {/* Visual supply chain flow maps displayed ONLY on Tableau de Bord (dashboard) and Transferts Internes (transfers) */}
            {(activeTab === 'dashboard' || activeTab === 'transfers') && state && (
              <SupplyChainMap
                stockPositions={state.stockPositions}
                transfers={state.transfers}
                depots={state.depots}
                lang={lang}
              />
            )}

            {activeTab === 'dashboard' && state && (
              <Dashboard 
                state={state} 
                lang={lang} 
                onRefresh={fetchState}
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onReportLoss={async (lossData) => {
                  try {
                    await apiRequest(`/api/losses`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...lossData, user: currentUser })
                    });
                    fetchState();
                  } catch (e) {
                    console.error("Error reporting loss from dashboard:", e);
                  }
                }}
              />
            )}

            {activeTab === 'catalogue' && state && (
              <ProductCatalogue 
                state={state} 
                lang={lang} 
                onProduceBatch={(productId) => {
                  setPreselectedProductIdForProduction(productId);
                  setActiveTab('production');
                }}
                currentUser={currentUser}
                onProductModified={fetchState}
              />
            )}

            {activeTab === 'refrigerators' && state && (
              <RefrigeratorModule state={state} lang={lang} currentUser={currentUser} initialSubTab="inventory" />
            )}

            {activeTab === 'listing' && state && (
              <ListingModule lang={lang} currentUser={currentUser} />
            )}

            {activeTab === 'geoloc' && state && (
              <RefrigeratorModule state={state} lang={lang} currentUser={currentUser} initialSubTab="geoloc" />
            )}

            {activeTab === 'production' && state && (
              <ProductionModule
                state={state}
                lang={lang}
                initialProductId={preselectedProductIdForProduction}
                onClearInitialProductId={() => setPreselectedProductIdForProduction(null)}
                onAddBatch={handleAddBatch}
                onUpdateBatchStatus={async (bId, type, qty) => {
                  // Direct edit helper
                  try {
                    await apiRequest(`/api/production`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: state.batches.find(b => b.id === bId)?.productId, quantity: -qty, tempRegistered: -18, user: currentUser })
                    });
                    fetchState();
                  } catch (e) {}
                }}
                onReportLoss={async (lossData) => {
                  try {
                    await apiRequest(`/api/losses`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...lossData, user: currentUser })
                    });
                    fetchState();
                  } catch (e) {
                    console.error("Error reporting loss:", e);
                  }
                }}
                onRefreshState={fetchState}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'transfers' && state && (
              <TransferModule
                state={state}
                lang={lang}
                onCreateTransfer={handleCreateTransfer}
                onUpdateTransferStatus={handleUpdateTransferStatus}
                currentUser={currentUser}
                vehicles={vehicles}
              />
            )}

            {activeTab === 'depots' && state && (
              <DepotModule
                state={state}
                lang={lang}
                onLoadTruck={handleLoadTruck}
                onAddDepotAdjustment={handleAddDepotAdjustment}
                onAddDepotReturn={handleAddDepotReturn}
                onAddDepot={handleAddDepot}
                onUpdateDepotStartingStock={handleUpdateDepotStartingStock}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'vehicles' && state && (
              <VehicleDriverModule 
                lang={lang} 
                vehicles={vehicles}
                setVehicles={setVehicles}
                drivers={drivers}
                setDrivers={setDrivers}
                state={state}
              />
            )}

            {activeTab === 'fridgeLogistics' && state && (
              <RefrigeratorModule 
                state={state} 
                lang={lang} 
                currentUser={currentUser} 
                initialSubTab="logistics" 
                standalone={true} 
              />
            )}

            {activeTab === 'reparation' && state && (
              <ReparationModule
                lang={lang}
                vehicles={vehicles}
                setVehicles={setVehicles}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'driverApp' && state && (
              <DriverAppSimulator
                state={state}
                lang={lang}
                onDeliverClient={handleDeliverClient}
                onCloseTournee={handleCloseTournee}
                onRefresh={fetchState}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'financials' && state && (
              <FinanceModule state={state} lang={lang} />
            )}

            {activeTab === 'stockMovement' && state && (
              <StockMovementModule state={state} lang={lang} currentUser={currentUser} />
            )}

            {activeTab === 'auditLogs' && state && (
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    {lang === 'fr' ? 'Journal d\'Audit Sécurisé' : 'السجل الأمني للرقابة والتدقيق (Audit Logs)'}
                  </h3>
                  <span className="text-xxs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold uppercase">Lecture seule</span>
                </div>

                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xxs text-slate-500">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-slate-400 font-bold sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Horodatage</th>
                        <th className="px-4 py-3">Utilisateur</th>
                        <th className="px-4 py-3">Rôle</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                      {state.auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <td className="px-4 py-2.5 font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA')} {new Date(log.timestamp).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'ar-MA', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{log.userName}</td>
                          <td className="px-4 py-2.5 text-slate-400">{log.role}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-sm font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 line-clamp-2 max-w-[280px]">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Premium Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-slate-800 dark:text-slate-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4 animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
                {lang === 'fr' ? 'ATTENTION : ZONE DE DANGER' : 'تنبيه : منطقة خطرة'}
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                {lang === 'fr' 
                  ? "Cette opération supprimera définitivement toutes les données d'usine, de production, de distribution et d'encaissement. Elle est totalement IRREVERSIBLE."
                  : "هذه العملية ستؤدي إلى حذف جميع بيانات المصنع، الإنتاج، التوزيع، والتحصيل بشكل نهائي وكامل. لا يمكن التراجع عن هذا الإجراء."}
              </p>

              <div className="my-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-[10px] uppercase font-black tracking-widest text-rose-500">
                  {lang === 'fr' ? 'Code de confirmation requis' : 'رمز التأكيد المطلوب'}
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={resetConfirmCode}
                  onChange={(e) => {
                    setResetConfirmCode(e.target.value);
                    setResetError(null);
                  }}
                  placeholder={lang === 'fr' ? 'Saisir le code de confirmation' : 'أدخل رمز التأكيد هنا'}
                  className="w-full text-center text-xs font-mono font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />

                {resetError && (
                  <p className="text-xxs font-bold text-rose-500 text-center animate-pulse">
                    {resetError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 dark:border-slate-755"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>
                  <button
                    type="button"
                    onClick={executeResetData}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-rose-500/15 transition-all"
                  >
                    {lang === 'fr' ? 'Confirmer' : 'تأكيد'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Local Storage & Computer Data Modal */}
      <StorageModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        lang={lang}
        onRefreshData={fetchState}
      />
    </div>
  );
}
