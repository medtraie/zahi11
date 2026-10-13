import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Snowflake, 
  Warehouse, 
  Settings, 
  Activity, 
  Truck, 
  QrCode, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause, 
  Camera,
  Upload,
  Volume2, 
  VolumeX, 
  RotateCw, 
  Search, 
  Plus, 
  Sliders, 
  ChevronRight, 
  MapPin, 
  User, 
  Cpu, 
  Zap, 
  FileText,
  Clock,
  Thermometer,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRightLeft,
  Printer,
  Check,
  Trash2,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Filter,
  History,
  Wrench,
  Map,
  Navigation,
  Compass,
  Globe,
  LocateFixed,
  DollarSign,
  Calendar,
  Building2,
  ShieldAlert,
  Download,
  BellRing,
  LayoutGrid,
  List
} from 'lucide-react';
import { SystemState, User as LoggedUser } from '../types';
import OpenStreetMapGeoloc from './OpenStreetMapGeoloc';
import { generateFridgePdfReport, generateFridgeMovementHistoryPdf, generateBatchTransferPdf } from '../utils/fridgePdfExport';
import ZahiLogo from './ZahiLogo';

interface RefrigeratorModuleProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  currentUser?: LoggedUser;
  initialSubTab?: 'inventory' | 'maintenance' | 'geoloc' | 'movements' | 'logistics' | 'bons' | 'historique';
  standalone?: boolean;
}

export interface MaintenanceRecord {
  id: string;
  refrigeratorId: string;
  serialNumber: string;
  date: string;
  type: 'Préventive' | 'Curative' | 'Recharge Gaz' | 'Remplacement Pièces' | 'Nettoyage & Diagnostic';
  technician: string;
  description: string;
  cost: number; // MAD
  status: 'Programmé' | 'En cours' | 'Terminé';
  nextDueDate?: string;
  location: string;
}

interface Refrigerator {
  id: string;
  serialNumber: string;
  type: 'chest' | 'upright' | 'AP' | 'AG' | 'AS';
  status: 'stock' | 'service' | 'maintenance';
  depot: string;
  client?: string;
  driverId?: string;
  temperature: number;
  targetTemperature: number;
  humidity: number;
  compressorStatus: 'running' | 'idle' | 'defrosting' | 'error';
  lastServiceDate: string;
  fillLevel: number; // Ice cream stock level %
  powerConsumption: number; // in Watts
  customImage?: string;
  installationDate?: string;

  // Delivery Analytics
  deliveryDaysCount?: number;
  totalQuantityDeliveredLiters?: number;
  totalCartonsDelivered?: number;
  lastDeliveryDate?: string;
  estimatedRevenueDH?: number;

  // GPS Movement / Geofencing Alert
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

interface RefrigeratorMovement {
  id: string;
  refrigeratorId: string;
  serialNumber: string;
  type: 'chest' | 'upright' | 'AP' | 'AG' | 'AS';
  fromStatus: 'stock' | 'service' | 'maintenance';
  toStatus: 'stock' | 'service' | 'maintenance';
  fromLocation: string;
  toLocation: string;
  driverName: string;
  date: string;
  notes: string;
}

const FreezerVector = ({ type, className = "h-20 w-14" }: { type: 'chest' | 'upright' | 'AP' | 'AG' | 'AS'; className?: string }) => {
  const isAP = type === 'chest' || type === 'AP';
  const isAS = type === 'AS';

  return (
    <div className={`relative ${className} bg-gradient-to-b from-slate-100 to-sky-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-sky-300 dark:border-slate-700 p-1 flex flex-col justify-between overflow-hidden shadow-inner`}>
      {/* Glossy lighting overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/30 pointer-events-none z-10" />
      
      {isAP ? (
        // AP - Congélateur Coffre Horizontal (300 L)
        <div className="w-full h-full flex flex-col justify-between relative bg-sky-50/50 dark:bg-slate-950/50 rounded-lg p-0.5">
          {/* Top Sliding Glass Lids */}
          <div className="h-3.5 w-full bg-slate-200/90 dark:bg-slate-700/90 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-between px-1 shadow-sm">
            <span className="w-3 h-1 bg-sky-500/80 rounded-sm" />
            <span className="w-3 h-1 bg-sky-500/80 rounded-sm" />
          </div>
          
          {/* Main Body with Zahi Glaces Logo */}
          <div className="flex-1 flex flex-col justify-center items-center py-0.5 gap-0.5 relative">
            <div className="w-10 h-auto my-auto">
              <ZahiLogo className="w-full h-auto drop-shadow-sm" />
            </div>
            
            <span className="px-1 py-0.2 bg-sky-950 text-[6.5px] font-mono font-black text-sky-300 rounded shadow">
              AP • 300L
            </span>
          </div>
          
          {/* Bottom Ventilation Grill */}
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-xs flex flex-col justify-center gap-0.5 px-0.5">
            <div className="h-[1px] w-full bg-slate-400 dark:bg-slate-600" />
            <div className="h-[1px] w-full bg-slate-400 dark:bg-slate-600" />
          </div>
        </div>
      ) : isAS ? (
        // AS - Armoire Spéciale Supermarché (500 L)
        <div className="w-full h-full flex flex-col justify-between relative bg-purple-50/50 dark:bg-slate-950/50 rounded-lg p-0.5">
          {/* Top Illuminated Marquee with Zahi Glaces Logo */}
          <div className="h-4 w-full bg-gradient-to-r from-purple-800 via-amber-600 to-purple-800 rounded-sm flex items-center justify-center p-0.5 shadow-sm">
            <ZahiLogo className="h-full w-auto drop-shadow" />
          </div>
          
          {/* Double Glass Door Interior */}
          <div className="flex-1 border border-purple-300/60 dark:border-purple-800/60 my-0.5 rounded-sm bg-purple-950/20 flex justify-between p-0.5 gap-0.5 relative overflow-hidden">
            <div className="flex-1 border-r border-purple-300/40 dark:border-purple-800/40 flex flex-col justify-around py-0.5">
              <div className="h-[1px] w-full bg-purple-300/60" />
              <div className="h-[1px] w-full bg-purple-300/60" />
              <div className="h-[1px] w-full bg-purple-300/60" />
            </div>
            <div className="flex-1 flex flex-col justify-around py-0.5">
              <div className="h-[1px] w-full bg-purple-300/60" />
              <div className="h-[1px] w-full bg-purple-300/60" />
              <div className="h-[1px] w-full bg-purple-300/60" />
            </div>
          </div>
          
          {/* Bottom Grill */}
          <div className="h-2 w-full bg-slate-900 rounded-xs flex items-center justify-center">
            <span className="text-[6.5px] font-mono font-black text-purple-300">AS • 500L</span>
          </div>
        </div>
      ) : (
        // AG - Armoire Vitrée Verticale (400 L)
        <div className="w-full h-full flex flex-col justify-between relative bg-emerald-50/50 dark:bg-slate-950/50 rounded-lg p-0.5">
          {/* Top Illuminated Marquee with Zahi Glaces Logo */}
          <div className="h-4 w-full bg-gradient-to-r from-emerald-800 via-amber-600 to-emerald-800 rounded-sm flex items-center justify-center p-0.5 shadow-sm">
            <ZahiLogo className="h-full w-auto drop-shadow" />
          </div>
          
          {/* Single Glass Door Interior with Shelves */}
          <div className="flex-1 border border-emerald-300/60 dark:border-emerald-800/60 my-0.5 rounded-sm bg-emerald-950/20 flex flex-col justify-between p-0.5 relative overflow-hidden">
            <div className="h-[1px] w-full bg-emerald-400/50" />
            <div className="h-[1px] w-full bg-emerald-400/50" />
            <div className="h-[1px] w-full bg-emerald-400/50" />
          </div>
          
          {/* Bottom Compressor & Tag */}
          <div className="h-2 w-full bg-slate-900 rounded-xs flex items-center justify-center">
            <span className="text-[6.5px] font-mono font-black text-emerald-300">AG • 400L</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function RefrigeratorModule({ state, lang, currentUser, initialSubTab, standalone }: RefrigeratorModuleProps) {
  // Localization dict
  const localT = {
    fr: {
      title: "Gestion Digitale des Réfrigérateurs Zahi",
      subtitle: "Supervision IoT en temps réel, Mouvements de Stock et Logistique",
      all: "Tous les Réfrigérateurs",
      inStock: "En Stock (Dépôt)",
      inService: "En Service (Commerces)",
      maintenance: "En Maintenance / Entretien",
      addFridge: "Enregistrer un Réfrigérateur",
      serial: "N° de Série / Code-barres",
      type: "Type d'appareil",
      status: "État d'activité",
      location: "Dépôt / Emplacement",
      assignDriver: "Lier à un Chauffeur",
      chest: "Congélateur Coffre (Zahi Glaces)",
      upright: "Vitrine Verticale (Zahi Glaces)",
      temp: "Température",
      targetTemp: "Temp. de Consigne",
      humidity: "Humidité",
      compressor: "État Compresseur",
      fillLevel: "Niveau de Remplissage",
      power: "Consommation Électrique",
      lastService: "Dernière Révision",
      driverName: "Chauffeur Assigné",
      clientName: "Client / Commerce",
      noFridges: "Aucun réfrigérateur correspondant aux critères.",
      successAdd: "Le réfrigérateur a été ajouté avec succès !",
      scanBarcode: "Simuler un Scan Code-barres",
      quickDiagnostics: "Diagnostics IoT",
      defrostCycle: "Cycle de Dégivrage",
      normalCooling: "Refroidissement Normal",
      alertTemp: "Température élevée détectée !",
      logsTitle: "Historique des Mouvements de Réfrigérateurs",
      logMovement: "Enregistrer un Nouveau Mouvement",
      from: "Origine",
      to: "Destination",
      selectFridge: "Sélectionner le Réfrigérateur",
      driverSelect: "Sélectionner le Chauffeur Transporteur",
      reason: "Motif du mouvement",
      saveMovement: "Enregistrer le Transfert",
      successMove: "Mouvement de stock enregistré !",
      driverLinking: "Logistique & Affectation Chauffeurs",
      linkGroup: "Assigner un Groupe de Congélateurs",
      unassigned: "Non assigné",
      videoSection: "Zahi Glaces Smart Telemetry Live",
      videoSubtitle: "Simulation IA d'analyse vidéo en temps réel sur notre congélateur vedette",
      liveTelemetry: "Flux Télémétrique Connecté",
      aiVision: "Analyse Vidéo par Vision Artificielle",
      aiStatusActive: "Analyse IA : Active",
      productDetected: "Produit Détecté",
      confidence: "Confiance",
      optEfficiency: "Efficacité Thermique",
      compressorRpm: "Régime Compresseur",
      gridTemp: "Température Grille",
      defrostUrgency: "Nécessité de Dégivrage",
      soundOn: "Son activé",
      soundOff: "Sourdine",
      iotDiagnosticRunning: "Analyse de diagnostic IoT en cours...",
      iotDiagnosticSuccess: "Diagnostic Complété : Compresseur sain. Isolation thermique efficace à 94%.",
      beepPrompt: "Signal sonore émis lors du scan !",
      fridgeControl: "Panneau de Contrôle Interactif",
      cancel: "Annuler",
      add: "Ajouter",
      uploadPhoto: "Télécharger une photo de la vitrine",
      uploadVideo: "Télécharger une vidéo de la vitrine",
      uploading: "Téléchargement en cours...",
      photoUploaded: "Photo téléchargée avec succès !",
      videoUploaded: "Vidéo téléchargée avec succès !"
    },
    ar: {
      title: "التسيير الرقمي لثلاجات زاهي للمثلجات",
      subtitle: "المراقبة الفورية للثلاجات (IoT)، حركات المخزون واللوجستيات",
      all: "جميع الثلاجات",
      inStock: "في المستودع (Stock)",
      inService: "قيد الخدمة (en service)",
      maintenance: "في الصيانة (maintenance)",
      addFridge: "تسجيل ثلاجة جديدة",
      serial: "الرقم التسلسلي / الرمز الشريطي",
      type: "نوع الثلاجة",
      status: "حالة النشاط",
      location: "المستودع / الموقع",
      assignDriver: "ربط بسائق",
      chest: "ثلاجة أفقية (Zahi Glaces)",
      upright: "ثلاجة زجاجية عمودية (Zahi)",
      temp: "درجة الحرارة",
      targetTemp: "درجة الحرارة المطلوبة",
      humidity: "الرطوبة",
      compressor: "حالة الضاغط",
      fillLevel: "مستوى التعبئة",
      power: "استهلاك الكهرباء",
      lastService: "آخر صيانة",
      driverName: "السائق المسؤول",
      clientName: "العميل / المحل التجاري",
      noFridges: "لا توجد ثلاجات تطابق المعايير المحددة.",
      successAdd: "تم تسجيل الثلاجة بنجاح!",
      scanBarcode: "محاكاة قراءة الرمز الشريطي",
      quickDiagnostics: "تشخيص الأعطال والـ IoT",
      defrostCycle: "دورة إذابة الجليد (Dégivrage)",
      normalCooling: "التبريد الطبيعي",
      alertTemp: "درجة حرارة مرتفعة!",
      logsTitle: "سجل تحركات الثلاجات",
      logMovement: "تسجيل حركة ثلاجة جديدة",
      from: "من (الموقع الحالي)",
      to: "إلى (الوجهة الجديدة)",
      selectFridge: "اختر الثلاجة",
      driverSelect: "اختر السائق الناقل",
      reason: "سبب النقل",
      saveMovement: "حفظ الحركة والتنقل",
      saveVideo: "حفظ الفيديو المرفوع",
      successMove: "تم تسجيل حركة المخزون بنجاح!",
      driverLinking: "اللوجستيات وتعيين السائقين",
      linkGroup: "ربط مجموعة من الثلاجات بسائق",
      unassigned: "غير معين",
      videoSection: "لوحة التتبع الذكية لثلاجة زاهي بالفيديو",
      videoSubtitle: "تحليل الذكاء الاصطناعي المباشر بالفيديو على ثلاجاتنا Zahi Glaces",
      liveTelemetry: "البث التمريضي لإنترنت الأشياء (IoT)",
      aiVision: "تحليل الفيديو بواسطة الذكاء الاصطناعي",
      aiStatusActive: "تحليل الذكاء الاصطناعي: نشط",
      productDetected: "المنتج المكتشف",
      confidence: "نسبة الدقة",
      optEfficiency: "الكفاءة الحرارية",
      compressorRpm: "سرعة دوران الضاغط",
      gridTemp: "درجة حرارة شبكة التبريد",
      defrostUrgency: "الحاجة لإذابة الجليد",
      soundOn: "تشغيل الصوت",
      soundOff: "كتم الصوت",
      iotDiagnosticRunning: "جاري تشغيل تشخيص إنترنت الأشياء...",
      iotDiagnosticSuccess: "اكتمل التشخيص: الضاغط سليم. كفاءة العزل الحراري 94%.",
      beepPrompt: "تم إصدار إشارة صوتية لمحاكاة المسح الضوئي!",
      fridgeControl: "لوحة التحكم التفاعلية للثلاجة",
      cancel: "إلغاء",
      add: "إضافة",
      uploadPhoto: "تحميل صورة الثلاجة",
      uploadVideo: "تحميل مقطع فيديو للثلاجة",
      uploading: "جاري التحميل...",
      photoUploaded: "تم تحميل الصورة بنجاح!",
      videoUploaded: "تم تحميل الفيديو بنجاح!"
    }
  };

  const t = localT[lang] || localT['fr'];

  // Simulated Drivers in System
  const driversList = [
    { id: 'DRV-001', name: 'Hamza Chauffeur (TRK-CA-01)', location: 'Casablanca' },
    { id: 'DRV-002', name: 'Mustapha Ait Ben Haddou', location: 'Marrakech' },
    { id: 'DRV-003', name: 'Karim Bennani', location: 'Tanger' },
    { id: 'DRV-004', name: 'Yassine Belkhadir', location: 'Oujda' },
    { id: 'DRV-005', name: 'Tarik Jamil', location: 'Meknès' },
    { id: 'DRV-006', name: 'Hicham Daoudi', location: 'Agadir' },
    { id: 'DRV-007', name: 'Amina Tazi', location: 'Safi' }
  ];

  const getDrivers = () => {
    try {
      const saved = localStorage.getItem('zahi_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          if (!merged.some(d => d.name.toUpperCase().includes('ABDERAHIM'))) {
            merged.push({ id: 'DRV-008', name: 'ABDERAHIM', location: 'Casablanca' });
          }
          if (!merged.some(d => d.name.toUpperCase().includes('RACHIDI'))) {
            merged.push({ id: 'DRV-009', name: 'RACHIDI', location: 'El Jadida' });
          }
          return merged;
        }
      }
    } catch (e) {}
    const list = [...driversList];
    if (!list.some(d => d.name.toUpperCase().includes('ABDERAHIM'))) {
      list.push({ id: 'DRV-008', name: 'ABDERAHIM', location: 'Casablanca' });
    }
    if (!list.some(d => d.name.toUpperCase().includes('RACHIDI'))) {
      list.push({ id: 'DRV-009', name: 'RACHIDI', location: 'El Jadida' });
    }
    return list;
  };

  const defaultVehicles = [
    { id: 'TRK-EXP-101', type: 'transport', model: 'Scania R450 Streamline', plateNumber: '12-A-54321', depotAssigned: 'Usine' },
    { id: 'TRK-EXP-102', type: 'transport', model: 'Volvo FH16 Globetrotter', plateNumber: '50-B-9876', depotAssigned: 'Casablanca' },
    { id: 'TRK-EXP-103', type: 'transport', model: 'Renault Trucks T-High', plateNumber: '26-D-7654', depotAssigned: 'Marrakech' },
    { id: 'VAN-LIV-201', type: 'livraison', model: 'Iveco Daily Refrigerator', plateNumber: '33-H-1234', depotAssigned: 'Casablanca' },
    { id: 'VAN-LIV-202', type: 'livraison', model: 'Mercedes-Benz Sprinter Cold', plateNumber: '44-F-5555', depotAssigned: 'Rabat' },
    { id: 'VAN-LIV-203', type: 'livraison', model: 'Ford Transit Custom Frigo', plateNumber: '10-G-7788', depotAssigned: 'Fès' }
  ];

  const getVehicles = () => {
    try {
      const saved = localStorage.getItem('zahi_vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return defaultVehicles;
  };

  const getVendeurFridges = () => {
    let listSerials: string[] = [];
    try {
      const savedListingStr = localStorage.getItem('zahi_refrigerator_listing');
      if (savedListingStr) {
        const listing = JSON.parse(savedListingStr);
        if (Array.isArray(listing)) {
          const sellerKey = (bonNomVendeur || '').trim().toUpperCase();
          listSerials = listing
            .filter(r => r.vendeur && r.vendeur.trim().toUpperCase() === sellerKey)
            .map(r => r.conge.trim().toUpperCase());
        }
      }
    } catch (e) {}

    if (listSerials.length === 0) {
      return fridges.map(f => f.serialNumber);
    }
    return Array.from(new Set(listSerials));
  };

  const parseMovementDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const clean = dateStr.trim();
    
    // Format YYYY-MM-DD HH:MM or YYYY-MM-DD
    const yyyyMmDd = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
    if (yyyyMmDd) {
      const year = parseInt(yyyyMmDd[1], 10);
      const month = parseInt(yyyyMmDd[2], 10) - 1;
      const day = parseInt(yyyyMmDd[3], 10);
      const hour = yyyyMmDd[4] ? parseInt(yyyyMmDd[4], 10) : 0;
      const min = yyyyMmDd[5] ? parseInt(yyyyMmDd[5], 10) : 0;
      return new Date(year, month, day, hour, min);
    }
    
    // Format DD/MM/YYYY HH:MM or DD/MM/YYYY
    const ddMmYyyy = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*,?\s*(\d{2}):(\d{2}))?/);
    if (ddMmYyyy) {
      const day = parseInt(ddMmYyyy[1], 10);
      const month = parseInt(ddMmYyyy[2], 10) - 1;
      const year = parseInt(ddMmYyyy[3], 10);
      const hour = ddMmYyyy[4] ? parseInt(ddMmYyyy[4], 10) : 0;
      const min = ddMmYyyy[5] ? parseInt(ddMmYyyy[5], 10) : 0;
      return new Date(year, month, day, hour, min);
    }
    
    // Format DD/MM/YYYY simple
    const ddMmYyyySimple = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddMmYyyySimple) {
      const day = parseInt(ddMmYyyySimple[1], 10);
      const month = parseInt(ddMmYyyySimple[2], 10) - 1;
      const year = parseInt(ddMmYyyySimple[3], 10);
      return new Date(year, month, day);
    }

    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) return new Date(parsed);
    return new Date();
  };

  const calculateDuration = (startStr: string, endStr?: string) => {
    const start = parseMovementDate(startStr);
    const end = endStr ? parseMovementDate(endStr) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return lang === 'fr' ? "Moins d'un jour" : "أقل من يوم";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        return lang === 'fr' ? "Quelques minutes" : "بضع دقائق";
      }
      return lang === 'fr' ? `${diffHours} h` : `${diffHours} ساعة`;
    }
    
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months === 0) {
      return lang === 'fr' 
        ? `${diffDays} jour${diffDays > 1 ? 's' : ''}` 
        : `${diffDays} يوم`;
    } else {
      let resultFr = `${months} mois`;
      let resultAr = `${months} شهر`;
      if (days > 0) {
        resultFr += ` et ${days} jour${days > 1 ? 's' : ''}`;
        resultAr += ` و ${days} يوم`;
      }
      return lang === 'fr' ? resultFr : resultAr;
    }
  };

  // Morocco Cities GPS Coordinates Map Configuration
  const MOROCCO_CITY_COORDS: Record<string, { lat: number; lng: number; city: string; address: string; mapX: number; mapY: number }> = {
    'Casablanca': { lat: 33.5731, lng: -7.5898, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca', mapX: 42, mapY: 38 },
    'Marrakech': { lat: 31.6295, lng: -7.9811, city: 'Marrakech', address: 'Avenue Mohammed V, Gueliz, Marrakech', mapX: 38, mapY: 58 },
    'Tanger': { lat: 35.7595, lng: -5.8340, city: 'Tanger', address: 'Corniche de Tanger, Port Tanger Ville', mapX: 52, mapY: 14 },
    'Oujda': { lat: 34.6814, lng: -1.9086, city: 'Oujda', address: 'Zone Franche Logistique, Oujda', mapX: 86, mapY: 26 },
    'Meknès': { lat: 33.8935, lng: -5.5473, city: 'Meknès', address: 'Quartier Hamria, Meknès', mapX: 56, mapY: 34 },
    'Fès': { lat: 34.0331, lng: -5.0003, city: 'Fès', address: 'Avenue Hassan II, Fès Ville Nouvelle', mapX: 62, mapY: 32 },
    'Agadir': { lat: 30.4278, lng: -9.5981, city: 'Agadir', address: 'Zone Touristique, Bd du 20 Août, Agadir', mapX: 25, mapY: 72 },
    'Safi': { lat: 32.2994, lng: -9.2372, city: 'Safi', address: 'Zone Portuaire, Safi', mapX: 28, mapY: 50 },
    'Rabat': { lat: 34.0209, lng: -6.8416, city: 'Rabat', address: 'Avenue de France, Agdal, Rabat', mapX: 46, mapY: 30 },
    'Berrechid': { lat: 33.2655, lng: -7.5875, city: 'Berrechid', address: 'Centre-ville, Berrechid', mapX: 42, mapY: 42 },
    'Laâyoune': { lat: 27.1253, lng: -13.1625, city: 'Laâyoune', address: 'Avenue Makkah, Laâyoune', mapX: 14, mapY: 92 },
  };

  // Prefilled Refrigerator State with full coverage across Moroccan depots
  const [fridges, setFridges] = useState<Refrigerator[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_refrigerators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const cleaned = parsed.filter((f: Refrigerator) => {
            const s = (f.serialNumber || '').trim().toUpperCase();
            if (!s || seen.has(s)) return false;
            seen.add(s);
            return true;
          });
          // Ensure at least one fridge has GPS location alert active for monitoring
          const hasAlert = cleaned.some((f: Refrigerator) => !!f.isLocationAlert);
          if (!hasAlert) {
            const candidate = cleaned.find((f: Refrigerator) => f.id === 'REF-ZH-7503' || f.serialNumber === 'ZAHI-CF-750305') || cleaned[0];
            if (candidate) {
              candidate.isLocationAlert = true;
              candidate.alertReason = '⚠️ Déplacement suspect hors périmètre (+3.4 km détecté)';
              candidate.alertTimestamp = '2026-07-22 14:15';
              if (!candidate.gps) {
                candidate.gps = { lat: 33.5380, lng: -7.6000, city: 'Casablanca', address: 'Bd Panoramique, Ain Chock, Casablanca' };
              }
            }
          }
          return cleaned;
        }
      }
    } catch {}

    const initialList: Refrigerator[] = [
      {
        id: 'REF-ZH-7501',
        serialNumber: 'ZAHI-CF-750109',
        type: 'AP',
        status: 'stock',
        depot: 'Casablanca',
        temperature: -19.4,
        targetTemperature: -22.0,
        humidity: 62,
        compressorStatus: 'running',
        lastServiceDate: '2026-04-15',
        installationDate: '2025-06-10',
        fillLevel: 85,
        powerConsumption: 120,
        driverId: 'DRV-001',
        deliveryDaysCount: 84,
        totalQuantityDeliveredLiters: 3250,
        totalCartonsDelivered: 812,
        lastDeliveryDate: '2026-07-21',
        estimatedRevenueDH: 71500,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7501-B',
        serialNumber: 'ZAHI-CF-750110',
        type: 'AP',
        status: 'stock',
        depot: 'Casablanca',
        temperature: -20.1,
        targetTemperature: -22.0,
        humidity: 60,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-10',
        installationDate: '2025-06-15',
        fillLevel: 0,
        powerConsumption: 115,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7501-C',
        serialNumber: 'ZAHI-CF-750111',
        type: 'AP',
        status: 'stock',
        depot: 'Casablanca',
        temperature: -19.8,
        targetTemperature: -22.0,
        humidity: 58,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-12',
        installationDate: '2025-06-20',
        fillLevel: 0,
        powerConsumption: 118,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7501-D',
        serialNumber: 'ZAHI-VD-750201',
        type: 'AG',
        status: 'stock',
        depot: 'Casablanca',
        temperature: 3.8,
        targetTemperature: 4.0,
        humidity: 52,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-15',
        installationDate: '2025-07-01',
        fillLevel: 0,
        powerConsumption: 210,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7501-E',
        serialNumber: 'ZAHI-VD-750202',
        type: 'AG',
        status: 'stock',
        depot: 'Casablanca',
        temperature: 4.1,
        targetTemperature: 4.0,
        humidity: 50,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-18',
        installationDate: '2025-07-05',
        fillLevel: 0,
        powerConsumption: 215,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7501-F',
        serialNumber: 'ZAHI-AS-750301',
        type: 'AS',
        status: 'stock',
        depot: 'Casablanca',
        temperature: -18.6,
        targetTemperature: -20.0,
        humidity: 54,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-20',
        installationDate: '2025-07-10',
        fillLevel: 0,
        powerConsumption: 140,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7501-G',
        serialNumber: 'ZAHI-AS-750302',
        type: 'AS',
        status: 'stock',
        depot: 'Casablanca',
        temperature: -18.2,
        targetTemperature: -20.0,
        humidity: 56,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-22',
        installationDate: '2025-07-15',
        fillLevel: 0,
        powerConsumption: 142,
        gps: { lat: 33.5530, lng: -7.4830, city: 'Casablanca', address: 'Zone Industrielle Tit Mellil, Casablanca' }
      },
      {
        id: 'REF-ZH-7502',
        serialNumber: 'ZAHI-VD-750212',
        type: 'upright',
        status: 'service',
        depot: 'Casablanca',
        client: 'Supermarché LabelVie Maârif',
        temperature: 3.5,
        targetTemperature: 4.0,
        humidity: 50,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-10',
        installationDate: '2025-08-01',
        fillLevel: 70,
        powerConsumption: 240,
        driverId: 'DRV-002',
        deliveryDaysCount: 62,
        totalQuantityDeliveredLiters: 2480,
        totalCartonsDelivered: 620,
        lastDeliveryDate: '2026-07-19',
        estimatedRevenueDH: 54560,
        gps: { lat: 33.5780, lng: -7.6320, city: 'Casablanca', address: 'Bd Al Massira Al Khadra, Maârif, Casablanca' }
      },
      {
        id: 'REF-ZH-7503',
        serialNumber: 'ZAHI-CF-750305',
        type: 'chest',
        status: 'service',
        depot: 'Casablanca',
        client: 'Superette Zahi Ain Chock',
        temperature: -18.1,
        targetTemperature: -20.0,
        humidity: 65,
        compressorStatus: 'running',
        lastServiceDate: '2026-06-01',
        installationDate: '2025-10-15',
        fillLevel: 95,
        powerConsumption: 115,
        driverId: 'DRV-001',
        deliveryDaysCount: 45,
        totalQuantityDeliveredLiters: 1800,
        totalCartonsDelivered: 450,
        lastDeliveryDate: '2026-07-22',
        estimatedRevenueDH: 39600,
        isLocationAlert: true,
        alertReason: '⚠️ Déplacement suspect hors périmètre (+3.4 km détecté)',
        alertTimestamp: '2026-07-22 14:15',
        gps: { lat: 33.5380, lng: -7.6000, city: 'Casablanca', address: 'Bd Panoramique, Ain Chock, Casablanca' }
      },
      {
        id: 'REF-ZH-7504',
        serialNumber: 'ZAHI-VD-750441',
        type: 'upright',
        status: 'service',
        depot: 'Marrakech',
        client: 'Supermarché Al-Amri Gueliz',
        temperature: 3.8,
        targetTemperature: 4.0,
        humidity: 52,
        compressorStatus: 'running',
        lastServiceDate: '2026-07-01',
        installationDate: '2025-11-20',
        fillLevel: 80,
        powerConsumption: 230,
        driverId: 'DRV-002',
        deliveryDaysCount: 58,
        totalQuantityDeliveredLiters: 2320,
        totalCartonsDelivered: 580,
        lastDeliveryDate: '2026-07-20',
        estimatedRevenueDH: 51040,
        gps: { lat: 31.6295, lng: -7.9811, city: 'Marrakech', address: 'Avenue Mohammed V, Gueliz, Marrakech' }
      },
      {
        id: 'REF-ZH-7505',
        serialNumber: 'ZAHI-CF-750503',
        type: 'chest',
        status: 'service',
        depot: 'Marrakech',
        client: 'Hôtel Menara Hivernage',
        temperature: -20.2,
        targetTemperature: -21.0,
        humidity: 48,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-18',
        installationDate: '2025-09-05',
        fillLevel: 65,
        powerConsumption: 110,
        driverId: 'DRV-002',
        deliveryDaysCount: 70,
        totalQuantityDeliveredLiters: 2800,
        totalCartonsDelivered: 700,
        lastDeliveryDate: '2026-07-18',
        estimatedRevenueDH: 61600,
        gps: { lat: 31.6210, lng: -7.9950, city: 'Marrakech', address: 'Avenue Menara, Hivernage, Marrakech' }
      },
      {
        id: 'REF-ZH-7506',
        serialNumber: 'ZAHI-CF-750699',
        type: 'chest',
        status: 'service',
        depot: 'Tanger',
        client: 'Glace du Nord Corniche',
        temperature: -17.8,
        targetTemperature: -20.0,
        humidity: 58,
        compressorStatus: 'running',
        lastServiceDate: '2026-06-25',
        installationDate: '2025-07-12',
        fillLevel: 40,
        powerConsumption: 122,
        driverId: 'DRV-003',
        deliveryDaysCount: 92,
        totalQuantityDeliveredLiters: 3680,
        totalCartonsDelivered: 920,
        lastDeliveryDate: '2026-07-21',
        estimatedRevenueDH: 80960,
        gps: { lat: 35.7720, lng: -5.8020, city: 'Tanger', address: 'Corniche de Tanger, Port Tanger' }
      },
      {
        id: 'REF-ZH-7507',
        serialNumber: 'ZAHI-VD-750754',
        type: 'upright',
        status: 'service',
        depot: 'Tanger',
        client: 'Superette Baie Malabata',
        temperature: 4.1,
        targetTemperature: 4.0,
        humidity: 55,
        compressorStatus: 'running',
        lastServiceDate: '2026-04-30',
        installationDate: '2025-12-01',
        fillLevel: 75,
        powerConsumption: 245,
        driverId: 'DRV-003',
        deliveryDaysCount: 50,
        totalQuantityDeliveredLiters: 2000,
        totalCartonsDelivered: 500,
        lastDeliveryDate: '2026-07-20',
        estimatedRevenueDH: 44000,
        gps: { lat: 35.7700, lng: -5.7850, city: 'Tanger', address: 'Baie de Tanger, Malabata' }
      },
      {
        id: 'REF-ZH-7508',
        serialNumber: 'ZAHI-CF-750811',
        type: 'chest',
        status: 'maintenance',
        depot: 'Oujda',
        temperature: -8.5,
        targetTemperature: -18.0,
        humidity: 89,
        compressorStatus: 'defrosting',
        lastServiceDate: '2026-07-01',
        installationDate: '2025-05-15',
        fillLevel: 0,
        powerConsumption: 35,
        driverId: 'DRV-004',
        deliveryDaysCount: 30,
        totalQuantityDeliveredLiters: 1200,
        totalCartonsDelivered: 300,
        lastDeliveryDate: '2026-06-28',
        estimatedRevenueDH: 26400,
        gps: { lat: 34.6814, lng: -1.9086, city: 'Oujda', address: 'Atelier Technique Zahi, Zone Franche Oujda' }
      },
      {
        id: 'REF-ZH-7509',
        serialNumber: 'ZAHI-VD-750903',
        type: 'upright',
        status: 'stock',
        depot: 'Meknès',
        temperature: 12.0,
        targetTemperature: 4.0,
        humidity: 45,
        compressorStatus: 'idle',
        lastServiceDate: '2026-02-18',
        installationDate: '2025-04-10',
        fillLevel: 0,
        powerConsumption: 0,
        driverId: 'DRV-005',
        deliveryDaysCount: 40,
        totalQuantityDeliveredLiters: 1600,
        totalCartonsDelivered: 400,
        lastDeliveryDate: '2026-06-15',
        estimatedRevenueDH: 35200,
        gps: { lat: 33.8935, lng: -5.5473, city: 'Meknès', address: 'Dépôt Régional Hamria, Meknès' }
      },
      {
        id: 'REF-ZH-7510',
        serialNumber: 'ZAHI-CF-751020',
        type: 'chest',
        status: 'service',
        depot: 'Fès',
        client: 'Café Zahi Ville Nouvelle Fès',
        temperature: -19.0,
        targetTemperature: -20.0,
        humidity: 60,
        compressorStatus: 'running',
        lastServiceDate: '2026-06-10',
        installationDate: '2025-08-25',
        fillLevel: 88,
        powerConsumption: 118,
        driverId: 'DRV-005',
        deliveryDaysCount: 75,
        totalQuantityDeliveredLiters: 3000,
        totalCartonsDelivered: 750,
        lastDeliveryDate: '2026-07-21',
        estimatedRevenueDH: 66000,
        gps: { lat: 34.0331, lng: -5.0003, city: 'Fès', address: 'Avenue Hassan II, Fès Ville Nouvelle' }
      },
      {
        id: 'REF-ZH-7511',
        serialNumber: 'ZAHI-CF-751133',
        type: 'chest',
        status: 'service',
        depot: 'Agadir',
        client: 'Hôtel Les Dunes Talborjt',
        temperature: -18.5,
        targetTemperature: -20.0,
        humidity: 55,
        compressorStatus: 'running',
        lastServiceDate: '2026-07-05',
        installationDate: '2025-06-30',
        fillLevel: 65,
        powerConsumption: 125,
        driverId: 'DRV-006',
        deliveryDaysCount: 80,
        totalQuantityDeliveredLiters: 3200,
        totalCartonsDelivered: 800,
        lastDeliveryDate: '2026-07-22',
        estimatedRevenueDH: 70400,
        gps: { lat: 30.4210, lng: -9.5920, city: 'Agadir', address: 'Boulevard Mohammed V, Talborjt, Agadir' }
      },
      {
        id: 'REF-ZH-7512',
        serialNumber: 'ZAHI-VD-751244',
        type: 'upright',
        status: 'stock',
        depot: 'Safi',
        temperature: -21.0,
        targetTemperature: -21.0,
        humidity: 60,
        compressorStatus: 'idle',
        lastServiceDate: '2026-01-30',
        installationDate: '2025-03-20',
        fillLevel: 0,
        powerConsumption: 10,
        driverId: 'DRV-007',
        deliveryDaysCount: 35,
        totalQuantityDeliveredLiters: 1400,
        totalCartonsDelivered: 350,
        lastDeliveryDate: '2026-05-10',
        estimatedRevenueDH: 30800,
        gps: { lat: 32.2920, lng: -9.2320, city: 'Safi', address: 'Dépôt Régional Port, Safi' }
      },
      {
        id: 'REF-ZH-7513',
        serialNumber: 'ZAHI-VD-751355',
        type: 'upright',
        status: 'service',
        depot: 'Rabat',
        client: 'Superette Agdal Hassan',
        temperature: 3.6,
        targetTemperature: 4.0,
        humidity: 48,
        compressorStatus: 'running',
        lastServiceDate: '2026-06-18',
        installationDate: '2025-09-12',
        fillLevel: 90,
        powerConsumption: 228,
        driverId: 'DRV-001',
        deliveryDaysCount: 68,
        totalQuantityDeliveredLiters: 2720,
        totalCartonsDelivered: 680,
        lastDeliveryDate: '2026-07-21',
        estimatedRevenueDH: 59840,
        gps: { lat: 34.0080, lng: -6.8500, city: 'Rabat', address: 'Avenue de France, Agdal, Rabat' }
      },
      {
        id: 'REF-ZH-7514',
        serialNumber: 'ZAHI-VD-751466',
        type: 'upright',
        status: 'service',
        depot: 'Berrechid',
        client: 'Café de la Gare Berrechid',
        temperature: 4.2,
        targetTemperature: 4.0,
        humidity: 52,
        compressorStatus: 'running',
        lastServiceDate: '2026-05-20',
        installationDate: '2025-10-01',
        fillLevel: 60,
        powerConsumption: 235,
        driverId: 'DRV-001',
        deliveryDaysCount: 52,
        totalQuantityDeliveredLiters: 2080,
        totalCartonsDelivered: 520,
        lastDeliveryDate: '2026-07-19',
        estimatedRevenueDH: 45760,
        gps: { lat: 33.2655, lng: -7.5875, city: 'Berrechid', address: 'Café de la Gare, Place Hassan II, Berrechid' }
      },
      {
        id: 'REF-ZH-7515',
        serialNumber: 'ZAHI-CF-751577',
        type: 'chest',
        status: 'service',
        depot: 'Laâyoune',
        client: 'Magasin Sahra Avenue Makkah',
        temperature: -19.8,
        targetTemperature: -22.0,
        humidity: 40,
        compressorStatus: 'running',
        lastServiceDate: '2026-06-28',
        installationDate: '2025-07-20',
        fillLevel: 82,
        powerConsumption: 128,
        driverId: 'DRV-006',
        deliveryDaysCount: 72,
        totalQuantityDeliveredLiters: 2880,
        totalCartonsDelivered: 720,
        lastDeliveryDate: '2026-07-20',
        estimatedRevenueDH: 63360,
        gps: { lat: 27.1450, lng: -13.1900, city: 'Laâyoune', address: 'Avenue Makkah, Laâyoune' }
      }
    ];

    const seenInit = new Set<string>();
    return initialList.filter(f => {
      const s = (f.serialNumber || '').trim().toUpperCase();
      if (!s || seenInit.has(s)) return false;
      seenInit.add(s);
      return true;
    });
  });

  // Maintenance Records State
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_refrigerator_maintenances');
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      {
        id: 'MNT-2026-001',
        refrigeratorId: 'REF-ZH-7504',
        serialNumber: 'ZAHI-CF-750441',
        date: '2026-07-01',
        type: 'Recharge Gaz',
        technician: 'Kamal Mansouri',
        description: 'Diagnostic compresseur & Recharge Gaz Fréon R404a.',
        cost: 850,
        status: 'En cours',
        nextDueDate: '2027-01-01',
        location: 'Dépôt Oujda (Atelier)'
      },
      {
        id: 'MNT-2026-002',
        refrigeratorId: 'REF-ZH-7501',
        serialNumber: 'ZAHI-CF-750109',
        date: '2026-06-15',
        type: 'Préventive',
        technician: 'Youssef Zahi',
        description: 'Entretien préventif semestriel, nettoyage condenseur et calibration thermostat.',
        cost: 350,
        status: 'Terminé',
        nextDueDate: '2026-12-15',
        location: 'Casablanca Tit Mellil'
      },
      {
        id: 'MNT-2026-003',
        refrigeratorId: 'REF-ZH-7502',
        serialNumber: 'ZAHI-VD-750212',
        date: '2026-05-10',
        type: 'Remplacement Pièces',
        technician: 'Mehdi Alami',
        description: 'Changement du joint d\'étanchéité porte vitrée et lampe LED.',
        cost: 420,
        status: 'Terminé',
        nextDueDate: '2026-11-10',
        location: 'Marrakech Gueliz'
      },
      {
        id: 'MNT-2026-004',
        refrigeratorId: 'REF-ZH-7505',
        serialNumber: 'ZAHI-VD-750503',
        date: '2026-08-05',
        type: 'Curative',
        technician: 'Ayoub Chraibi',
        description: 'Révision du moteur compresseur et échangeur thermique.',
        cost: 1200,
        status: 'Programmé',
        nextDueDate: '2027-02-05',
        location: 'Dépôt Meknès'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zahi_refrigerator_maintenances', JSON.stringify(maintenances));
  }, [maintenances]);

  // Maintenance Controls State
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'Programmé' | 'En cours' | 'Terminé'>('all');
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  const [maintenanceViewMode, setMaintenanceViewMode] = useState<'table' | 'cards'>('table');
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState<string>('all');
  const [newMaintenanceForm, setNewMaintenanceForm] = useState<{
    refrigeratorId: string;
    type: 'Préventive' | 'Curative' | 'Recharge Gaz' | 'Remplacement Pièces' | 'Nettoyage & Diagnostic';
    technician: string;
    description: string;
    cost: number;
    status: 'Programmé' | 'En cours' | 'Terminé';
    nextDueDate: string;
  }>({
    refrigeratorId: 'REF-ZH-7501',
    type: 'Préventive',
    technician: '',
    description: '',
    cost: 500,
    status: 'En cours',
    nextDueDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  });

  // Geolocation Controls State
  const [geolocSelectedCity, setGeolocSelectedCity] = useState<string>('all');
  const [geolocSelectedFridgeId, setGeolocSelectedFridgeId] = useState<string | null>('REF-ZH-7501');
  const [geolocFilterStatus, setGeolocFilterStatus] = useState<'all' | 'service' | 'stock' | 'maintenance' | 'alert'>('all');
  const [geolocSearchTerm, setGeolocSearchTerm] = useState<string>('');

  // Selected Refrigerator Serial for specific history filter and PDF generation
  const [selectedMvtFridgeSerial, setSelectedMvtFridgeSerial] = useState<string>('all');
  const [mvtSearchQuery, setMvtSearchQuery] = useState<string>('');
  const [mvtTypeFilter, setMvtTypeFilter] = useState<'all' | 'transfer' | 'client' | 'maintenance'>('all');
  const [mvtDepotFilter, setMvtDepotFilter] = useState<string>('all');
  const [mvtViewMode, setMvtViewMode] = useState<'cards' | 'table'>('cards');

  // Refrigerator Movement Logs State
  const [movements, setMovements] = useState<RefrigeratorMovement[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_refrigerator_movements');
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      {
        id: 'M-75001',
        refrigeratorId: 'REF-ZH-7502',
        serialNumber: 'ZAHI-VD-750212',
        type: 'upright',
        fromStatus: 'stock',
        toStatus: 'service',
        fromLocation: 'Dépôt Marrakech',
        toLocation: 'Supermarché Al-Amri Marrakech',
        driverName: 'Mustapha Ait Ben Haddou',
        date: '2026-06-28 14:30',
        notes: 'Mise en service chez le client. Température stable.'
      },
      {
        id: 'M-75002',
        refrigeratorId: 'REF-ZH-7504',
        serialNumber: 'ZAHI-CF-750441',
        type: 'chest',
        fromStatus: 'service',
        toStatus: 'maintenance',
        fromLocation: 'Supérette de l\'Est Oujda',
        toLocation: 'Dépôt Oujda (Atelier)',
        driverName: 'Yassine Belkhadir',
        date: '2026-07-01 10:15',
        notes: 'Retour d\'un coffre congélateur pour givrage excessif.'
      }
    ];
  });

  // Active filters and views
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'maintenance' | 'geoloc' | 'movements' | 'logistics' | 'bons' | 'historique'>(initialSubTab || 'inventory');
  const [selectedStatsDepot, setSelectedStatsDepot] = useState<string>('all');
  const [depotViewMode, setDepotViewMode] = useState<'grid' | 'table'>('grid');
  const [addFridgeError, setAddFridgeError] = useState<string | null>(null);
  const [fridgeToDelete, setFridgeToDelete] = useState<string | null>(null);
  
  // Bons d'Entrée / Sortie / Prise en Charge / Décharge / Contrat de Dépôt States
  const defaultDepots = ['Casablanca', 'Marrakech', 'Agadir', 'Fès', 'Tanger', 'Oujda', 'Meknès', 'Safi', 'Rabat', 'Laâyoune', 'Berrechid'];
  // Combine depots from global state AND all depots currently assigned to refrigerators
  const stateDepotNames = state?.depots && Object.keys(state.depots).length > 0
    ? Object.values(state.depots).map(d => d.name)
    : defaultDepots;
  const fridgesDepotNames = Array.from(new Set(fridges.map(f => f.depot).filter(Boolean)));
  const regionalDepots = Array.from(new Set([...stateDepotNames, ...fridgesDepotNames]));

  const [bonType, setBonType] = useState<'entry' | 'sortie' | 'livraison' | 'prise_en_charge' | 'decharge' | 'contrat_depot' | 'depot_regional'>('entry');
  const [bonDate, setBonDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bonChefSecteur, setBonChefSecteur] = useState('');
  const [bonNomVendeur, setBonNomVendeur] = useState('');
  const [bonCamionTransfert, setBonCamionTransfert] = useState('');
  const [bonNo, setBonNo] = useState<string>(() => {
    return String(Math.floor(27000 + Math.random() * 70000)).padStart(8, '0');
  });
  const [bonApRows, setBonApRows] = useState<string[]>(() => {
    const seen = new Set<string>();
    const casaAp = fridges.filter(f => f.status === 'stock' && (f.depot || '').toLowerCase().includes('casablanca') && (f.type === 'chest' || f.type === 'AP'));
    const rows = Array(10).fill('');
    let idx = 0;
    casaAp.forEach(f => {
      const s = (f.serialNumber || '').trim().toUpperCase();
      if (s && !seen.has(s) && idx < 10) {
        seen.add(s);
        rows[idx++] = s;
      }
    });
    return rows;
  });
  const [bonAgRows, setBonAgRows] = useState<string[]>(() => {
    const seen = new Set<string>();
    const casaAg = fridges.filter(f => f.status === 'stock' && (f.depot || '').toLowerCase().includes('casablanca') && (f.type === 'upright' || f.type === 'AG'));
    const rows = Array(10).fill('');
    let idx = 0;
    casaAg.forEach(f => {
      const s = (f.serialNumber || '').trim().toUpperCase();
      if (s && !seen.has(s) && idx < 10) {
        seen.add(s);
        rows[idx++] = s;
      }
    });
    return rows;
  });
  const [bonAsRows, setBonAsRows] = useState<string[]>(() => {
    const seen = new Set<string>();
    const casaAs = fridges.filter(f => f.status === 'stock' && (f.depot || '').toLowerCase().includes('casablanca') && f.type === 'AS');
    const rows = Array(10).fill('');
    let idx = 0;
    casaAs.forEach(f => {
      const s = (f.serialNumber || '').trim().toUpperCase();
      if (s && !seen.has(s) && idx < 10) {
        seen.add(s);
        rows[idx++] = s;
      }
    });
    return rows;
  });

  // Prevent duplicate serial numbers across the entire table
  const handleUpdateBonRow = (category: 'AP' | 'AG' | 'AS', index: number, rawVal: string) => {
    const val = rawVal.trim().toUpperCase();
    if (val) {
      // Check if this serial is already anywhere else in the bon table
      const isDuplicate = 
        bonApRows.some((s, idx) => !(category === 'AP' && idx === index) && s.trim().toUpperCase() === val) ||
        bonAgRows.some((s, idx) => !(category === 'AG' && idx === index) && s.trim().toUpperCase() === val) ||
        bonAsRows.some((s, idx) => !(category === 'AS' && idx === index) && s.trim().toUpperCase() === val);

      if (isDuplicate) {
        playBip(400, 0.25);
        setBonToast({
          message: lang === 'fr'
            ? `⚠️ Le congélateur N° "${val}" est déjà présent dans le tableau ! Impossible de sélectionner le même congélateur deux fois.`
            : `⚠️ الثلاجة رقم "${val}" مسجلة مسبقاً في هذا الإذن! لا يمكن تكرار نفس الرقم التسلسلي.`,
          type: 'error'
        });
        return;
      }
    }

    if (category === 'AP') {
      const updated = [...bonApRows];
      updated[index] = val;
      setBonApRows(updated);
    } else if (category === 'AG') {
      const updated = [...bonAgRows];
      updated[index] = val;
      setBonAgRows(updated);
    } else {
      const updated = [...bonAsRows];
      updated[index] = val;
      setBonAsRows(updated);
    }
  };
  const [bonDepot, setBonDepot] = useState('Casablanca');

  // Fields specifically for Bon de Prise en Charge, Décharge & Contrat de Dépôt (matching photo form)
  const [bonHeure, setBonHeure] = useState<string>(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [bonNumOrdre, setBonNumOrdre] = useState<string>('0012/2026');
  const [bonSecteur, setBonSecteur] = useState<string>('Tit Mellil / Casablanca');
  const [bonVille, setBonVille] = useState<string>('المحمدية');
  const [bonAdresseLocal, setBonAdresseLocal] = useState<string>('');
  const [bonActiviteClient, setBonActiviteClient] = useState<string>('');
  const [bonPatenteNo, setBonPatenteNo] = useState<string>('');
  const [bonNomClient, setBonNomClient] = useState<string>('');
  const [bonPrenomClient, setBonPrenomClient] = useState<string>('');
  const [bonCinNo, setBonCinNo] = useState<string>('');
  const [bonAdresseClient, setBonAdresseClient] = useState<string>('');
  const [bonCongelateurMarque, setBonCongelateurMarque] = useState<string>('Zahi Glaces');
  const [bonCongelateurNo, setBonCongelateurNo] = useState<string>('');
  const [bonCongelateurType, setBonCongelateurType] = useState<'AP' | 'AG' | 'AS'>('AP');
  const [bonTelephoneNo, setBonTelephoneNo] = useState<string>('');
  const [bonObservation, setBonObservation] = useState<string>('');
  const [bonNomLivreur, setBonNomLivreur] = useState<string>('');

  const [bonToast, setBonToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [visasSigned, setVisasSigned] = useState<Record<string, string>>({
    vendeur: '',
    chef: '',
    frigoriste: '',
    controle: '',
    responsable: '',
    client: '',
    livreur: ''
  });
  
  const [savedBons, setSavedBons] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_saved_bons');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'B-25901',
        bonNo: '000025901',
        type: 'contrat_depot',
        date: '2026-07-22',
        ville: 'المحمدية',
        congelateurType: 'AP',
        congelateurNo: 'ZAHI-CF-88210',
        nomClient: 'أحمد بناني',
        cinNo: 'BH987654',
        adresseClient: 'حي الوفاء، زنقة 12 رقم 45، المحمدية',
        adresseLocal: 'شارع فلسطين رقم 88، المحمدية',
        telephoneNo: '06 61 23 45 67',
        activiteClient: 'تجارة المواد الغذائية والأنعاش',
        patenteNo: 'PAT-7749201',
        nomLivreur: 'حمزة الموزع',
        visasSigned: { vendeur: 'حمزة الموزع', client: 'أحمد بناني', responsable: 'زاهي كلاص' }
      },
      {
        id: 'B-79751',
        bonNo: '000079751',
        type: 'prise_en_charge',
        date: '2026-07-20',
        heure: '10:15',
        numOrdre: '0012/2026',
        secteur: 'Tit Mellil / Anfa',
        chefSecteur: 'Mustapha Ait Ben Haddou',
        nomVendeur: 'Hamza Chauffeur',
        depot: 'Casablanca',
        activiteClient: 'Alimentation Générale / Epicerie',
        patenteNo: 'PAT-3849102',
        nomClient: 'Benani',
        prenomClient: 'Mohamed',
        cinNo: 'BH456789',
        adresseClient: 'Route Principale N° 142, Tit Mellil, Casablanca',
        congelateurMarque: 'Zahi Glaces',
        congelateurNo: 'ZAHI-CF-750109',
        congelateurType: 'AP',
        telephoneNo: '06 61 98 76 54',
        observation: 'Congélateur livré en parfait état de fonctionnement avec sérigraphie Zahi Glaces.',
        nomLivreur: 'Said Livreur',
        visasSigned: { vendeur: 'Hamza Ch.', client: 'M. Benani', livreur: 'Said L.' }
      },
      {
        id: 'B-65701',
        bonNo: '000065701',
        type: 'decharge',
        date: '2026-07-21',
        heure: '15:40',
        numOrdre: '0018/2026',
        secteur: 'Marrakech - Medina',
        chefSecteur: 'Karim Bennani',
        nomVendeur: 'Yassine Belkhadir',
        depot: 'Marrakech',
        activiteClient: 'Superette Fleurie',
        patenteNo: 'PAT-8923410',
        nomClient: 'Tazi',
        prenomClient: 'Karim',
        cinNo: 'BK123456',
        adresseClient: 'Boulevard Zerktouni, Marrakech',
        congelateurMarque: 'Zahi Glaces / Framec',
        congelateurNo: 'ZAHI-VD-750212',
        congelateurType: 'AG',
        telephoneNo: '06 62 33 44 55',
        observation: 'Congélateur récupéré pour révision technique au dépôt.',
        nomLivreur: 'Rachid Livreur',
        visasSigned: { vendeur: 'Yassine B.', client: 'K. Tazi', livreur: 'Rachid L.' }
      },
      {
        id: 'B-27351',
        bonNo: '000027351',
        type: 'entry',
        date: '2026-07-10',
        chefSecteur: 'Mustapha Ait Ben Haddou',
        nomVendeur: 'Hamza Chauffeur',
        depot: 'Casablanca',
        apRows: ['ZAHI-CF-750109', 'ZAHI-CF-750305', '', '', '', '', '', '', '', ''],
        agRows: ['ZAHI-VD-750212', '', '', '', '', '', '', '', '', ''],
        visasSigned: { vendeur: 'Hamza Ch.', chef: 'Mustapha A.', frigoriste: 'Youssef F.', controle: 'OK-Contrôle', responsable: 'Zahi Glaces' }
      },
      {
        id: 'B-88710',
        bonNo: '000088710',
        type: 'livraison',
        date: '2026-07-25',
        depot: 'Casablanca',
        camionTransfert: 'Scania R450 Streamline (12-A-54321)',
        apRows: ['ZAHI-CF-750109', 'ZAHI-CF-750305', '', '', '', '', '', '', '', ''],
        agRows: ['ZAHI-VD-750212', '', '', '', '', '', '', '', '', ''],
        asRows: ['ZAHI-AS-750601', '', '', '', '', '', '', '', '', ''],
        visasSigned: { vendeur: '', chef: '', frigoriste: 'Youssef F.', controle: 'OK-Contrôle', responsable: 'Zahi Glaces' }
      },
      {
        id: 'B-34801',
        bonNo: '000034801',
        type: 'sortie',
        date: '2026-07-12',
        chefSecteur: 'Karim Bennani',
        nomVendeur: 'Yassine Belkhadir',
        depot: 'Marrakech',
        apRows: ['ZAHI-CF-750441', '', '', '', '', '', '', '', '', ''],
        agRows: ['', '', '', '', '', '', '', '', '', ''],
        visasSigned: { vendeur: 'Yassine B.', chef: 'Karim B.', frigoriste: '', controle: 'OK-Contrôle', responsable: 'Zahi Glaces' }
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zahi_saved_bons', JSON.stringify(savedBons));
    } catch {}
  }, [savedBons]);

  // Ensure any existing localStorage savedBons has at least one Bon de livraison for testing/history
  useEffect(() => {
    setSavedBons(prev => {
      if (!prev.some(b => b.type === 'livraison')) {
        const sampleLivraison = {
          id: 'B-88710',
          bonNo: '000088710',
          type: 'livraison',
          date: '2026-07-25',
          depot: 'Casablanca',
          camionTransfert: 'Scania R450 Streamline (12-A-54321)',
          apRows: ['ZAHI-CF-750109', 'ZAHI-CF-750305', '', '', '', '', '', '', '', ''],
          agRows: ['ZAHI-VD-750212', '', '', '', '', '', '', '', '', ''],
          asRows: ['ZAHI-AS-750601', '', '', '', '', '', '', '', '', ''],
          visasSigned: { vendeur: '', chef: '', frigoriste: 'Youssef F.', controle: 'OK-Contrôle', responsable: 'Zahi Glaces' }
        };
        return [sampleLivraison, ...prev];
      }
      return prev;
    });
  }, []);

  // Bon History Search, Filter & Detail Modal States
  const [bonHistorySearch, setBonHistorySearch] = useState('');
  const [bonHistoryFilter, setBonHistoryFilter] = useState<'all' | 'livraison' | 'entry' | 'sortie' | 'prise_en_charge' | 'decharge' | 'contrat_depot' | 'depot_regional'>('all');
  const [viewingBonModal, setViewingBonModal] = useState<any | null>(null);
  const [expandedBonId, setExpandedBonId] = useState<string | null>(null);
  const [bonHistoryViewMode, setBonHistoryViewMode] = useState<'cards' | 'table'>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stock' | 'service' | 'maintenance'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'AP' | 'AG' | 'AS'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected single Refrigerator for IoT detailed control panel
  const [selectedFridgeId, setSelectedFridgeId] = useState<string | null>(fridges[0]?.id || null);
  const activeFridge = fridges.find(f => f.id === selectedFridgeId);

  // New Refrigerator registration form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newType, setNewType] = useState<'AP' | 'AG' | 'AS'>('AP');
  const [newStatus, setNewStatus] = useState<'stock' | 'service' | 'maintenance'>('stock');
  const [newDepot, setNewDepot] = useState('Casablanca');
  const [newClient, setNewClient] = useState('');
  const [newDriver, setNewDriver] = useState('');

  // New Movement Form state
  const [mvtFridgeId, setMvtFridgeId] = useState('');
  const [mvtToStatus, setMvtToStatus] = useState<'stock' | 'service' | 'maintenance'>('service');
  const [mvtDestination, setMvtDestination] = useState('');
  const [mvtDriverId, setMvtDriverId] = useState('');
  const [mvtNotes, setMvtNotes] = useState('');

  // Revamped Stock Movement System States
  const [mvtType, setMvtType] = useState<'depot_transfer' | 'client_placement' | 'service_return' | 'maintenance_send'>('depot_transfer');
  const [mvtOriginDepot, setMvtOriginDepot] = useState('Casablanca');
  const [mvtDestDepot, setMvtDestDepot] = useState('Marrakech');
  const [mvtDestinationClient, setMvtDestinationClient] = useState('');
  const [mvtSelectedFridgeIds, setMvtSelectedFridgeIds] = useState<string[]>([]);
  const [mvtFridgeSearchQuery, setMvtFridgeSearchQuery] = useState('');
  const [lastRegisteredBatch, setLastRegisteredBatch] = useState<any | null>(null);

  // Driver Assignment multi-selection state
  const [selectedFridgesForDriver, setSelectedFridgesForDriver] = useState<string[]>([]);
  const [bulkDriverId, setBulkDriverId] = useState('');
  const [selectedLogisticsDepot, setSelectedLogisticsDepot] = useState<string>('all');

  const filteredLogisticsFridges = fridges.filter(f => {
    if (selectedLogisticsDepot !== 'all' && f.depot !== selectedLogisticsDepot) {
      return false;
    }
    return true;
  });

  // Scanning barcode simulation animation
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // IoT Diagnostics Simulation
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Smart Video Analytics State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoTime, setVideoTime] = useState(0);

  // Simulated live telemetry overlay on video playback
  const [videoTelemetry, setVideoTelemetry] = useState({
    rpm: 0,
    gridTemp: 0.0,
    efficiency: 100,
    iceCreamCount: 0,
    detectedProduct: 'Aucun'
  });

  // Image load error tracking for dynamic vector freezer fallbacks
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Custom video and uploading states
  const [customVideoUrl, setCustomVideoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('zahi_custom_video_url') || '';
    } catch {
      return '';
    }
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Persist state in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zahi_refrigerators', JSON.stringify(fridges));
    } catch {}
  }, [fridges]);

  useEffect(() => {
    try {
      localStorage.setItem('zahi_refrigerator_movements', JSON.stringify(movements));
    } catch {}
  }, [movements]);

  // Keep video reloaded when source changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(err => console.log("Play error:", err));
      }
    }
  }, [customVideoUrl]);

  // Simulate real-time micro temperature fluctuations on active refrigerators!
  useEffect(() => {
    const interval = setInterval(() => {
      setFridges(prevFridges => 
        prevFridges.map(f => {
          if (f.compressorStatus === 'idle') {
            // Idle fridges slowly warm up towards ambient (around 15 degrees)
            const target = 15.0;
            const diff = target - f.temperature;
            const change = Number((diff * 0.02 + (Math.random() - 0.5) * 0.1).toFixed(1));
            return { ...f, temperature: Number((f.temperature + change).toFixed(1)) };
          } else if (f.compressorStatus === 'running') {
            // Running units cool down toward target or fluctuate slightly
            const diff = f.targetTemperature - f.temperature;
            const change = Number((diff * 0.15 + (Math.random() - 0.5) * 0.2).toFixed(1));
            const newTemp = Number((f.temperature + change).toFixed(1));
            // Power consumption fluctuates with effort
            const powerDiff = Math.abs(diff) > 2 ? 15 : 0;
            const basePower = f.type === 'chest' ? 110 : 220;
            const power = Math.max(10, Math.min(300, Math.floor(basePower + (Math.random() - 0.5) * 10 + powerDiff)));
            return { ...f, temperature: newTemp, powerConsumption: power };
          } else if (f.compressorStatus === 'defrosting') {
            // Defrosting units warm up to 5-10 degrees to melt ice
            const target = 8.0;
            const diff = target - f.temperature;
            const change = Number((diff * 0.2 + (Math.random() - 0.3) * 0.2).toFixed(1));
            return { ...f, temperature: Number((f.temperature + change).toFixed(1)), powerConsumption: 45 };
          }
          return f;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Update video smart overlay telemetry on video time update
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setVideoTime(time);

    // Let's create an elegant telemetry change mapped to the Zahi Glaces commercial video timeline (loops at 9s)
    const cycleTime = time % 9;
    
    let rpm = 0;
    let gridTemp = -22.5;
    let efficiency = 97;
    let detectedProduct = 'Zahi Glaces (Coffre)';
    let confidence = 98;

    if (cycleTime < 2) {
      rpm = 1450;
      gridTemp = -21.4;
      efficiency = 96;
      detectedProduct = 'Zahi Oméga 3 Caramel & Amandes';
    } else if (cycleTime < 4) {
      rpm = 2100;
      gridTemp = -23.8;
      efficiency = 98;
      detectedProduct = 'Bâtonnet Zahi Cobra Choco-Nuts';
    } else if (cycleTime < 6) {
      rpm = 1800;
      gridTemp = -24.2;
      efficiency = 95;
      detectedProduct = 'Cône Glacé Zahi Oméga 3 Fraise';
    } else {
      rpm = 1200;
      gridTemp = -22.0;
      efficiency = 97;
      detectedProduct = 'Gamme Zahi Glaces Premium';
    }

    setVideoTelemetry({
      rpm,
      gridTemp: Number(gridTemp.toFixed(1)),
      efficiency,
      iceCreamCount: Math.floor(250 + Math.sin(time) * 15),
      detectedProduct: `${detectedProduct} (${confidence}%)`
    });
  };

  // Sound Synthesizer function to emit standard scan bip or alert
  const playBip = (freq = 800, duration = 0.08) => {
    try {
      if (typeof window === 'undefined') return;
      
      let AudioCtxClass: any = null;
      try {
        AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      } catch {
        return;
      }
      if (!AudioCtxClass || typeof AudioCtxClass !== 'function') return;

      let audioCtx: any = null;
      try {
        audioCtx = new AudioCtxClass();
      } catch {
        return;
      }

      if (!audioCtx || typeof audioCtx.createOscillator !== 'function' || typeof audioCtx.createGain !== 'function') return;

      try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        if (!oscillator || !gainNode || !audioCtx.destination) return;

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);

        setTimeout(() => {
          try {
            if (audioCtx && audioCtx.state !== 'closed' && typeof audioCtx.close === 'function') {
              audioCtx.close().catch(() => {});
            }
          } catch {}
        }, (duration + 0.1) * 1000);
      } catch {}
    } catch {
      // Audio not supported or restricted in environment
    }
  };

  // Trigger Scan Barcode Simulation
  const triggerBarcodeScan = () => {
    if (!activeFridge) return;
    setIsScanning(true);
    setScanMessage(null);
    playBip(500, 0.05);

    setTimeout(() => {
      playBip(1200, 0.12);
      setIsScanning(false);
      setScanMessage(`${lang === 'fr' ? 'Scanné avec succès !' : 'تم المسح بنجاح!'} [${activeFridge.serialNumber}]`);
    }, 1500);
  };

  // Trigger Diagnostics Simulation
  const runDiagnostics = () => {
    setIsDiagnosing(true);
    setDiagnosticResult(null);

    setTimeout(() => {
      setIsDiagnosing(false);
      setDiagnosticResult(t.iotDiagnosticSuccess);
      playBip(900, 0.1);
    }, 2000);
  };

  // Toggle Video Player
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle Video Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle uploading custom image for a freezer
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fridgeId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: `fridge_${fridgeId}_${file.name}`,
            fileData: base64String
          })
        });

        const data = await response.json();
        if (data.success && data.url) {
          setFridges(prev => prev.map(f => {
            if (f.id === fridgeId) {
              return { ...f, customImage: data.url };
            }
            return f;
          }));
          // Clear any error state for this fridge ID since we now have a custom image
          setImageErrors(prev => ({ ...prev, [fridgeId]: false, ['active-' + fridgeId]: false }));
        } else {
          console.error("Upload failed:", data.error);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle uploading custom video for the cinematic player
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: `video_${Date.now()}_${file.name}`,
            fileData: base64String
          })
        });

        const data = await response.json();
        if (data.success && data.url) {
          setCustomVideoUrl(data.url);
          localStorage.setItem('zahi_custom_video_url', data.url);
        } else {
          console.error("Video upload failed:", data.error);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Video upload error:", err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Handle registration of a new Refrigerator
  const handleRegisterFridge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerial.trim()) return;

    let finalSerial = '';
    const cleanNum = newSerial.replace(/[^0-9]/g, '').slice(0, 6);
    if (newSerial.toUpperCase().startsWith('ZAHI-')) {
      finalSerial = newSerial.toUpperCase().trim();
    } else {
      const prefix = newType === 'AS' ? 'ZAHI-AS-' : newType === 'AG' ? 'ZAHI-AG-' : 'ZAHI-AP-';
      finalSerial = prefix + cleanNum;
    }

    // Check if duplicate serial number exists
    const isDuplicate = fridges.some(f => f.serialNumber.trim().toUpperCase() === finalSerial.trim().toUpperCase());
    if (isDuplicate) {
      setAddFridgeError(
        lang === 'fr'
          ? `Erreur: Le numéro de série "${finalSerial}" existe déjà dans le système !`
          : `خطأ: رقم التسلسل "${finalSerial}" موجود بالفعل في النظام!`
      );
      playBip(400, 0.25);
      return;
    }

    setAddFridgeError(null);

    const isNegative = newType === 'AP' || newType === 'chest' || newType === 'AS';

    const newF: Refrigerator = {
      id: `REF-ZH-${Math.floor(7500 + Math.random() * 500)}`,
      serialNumber: finalSerial,
      type: newType,
      status: newStatus,
      depot: newDepot,
      client: newStatus === 'service' ? newClient || 'Client Supermarché Zahi' : undefined,
      driverId: newDriver || undefined,
      temperature: isNegative ? -19.0 : 3.8,
      targetTemperature: isNegative ? -21.0 : 4.0,
      humidity: isNegative ? 60 : 50,
      compressorStatus: 'idle',
      lastServiceDate: new Date().toISOString().split('T')[0],
      fillLevel: newStatus === 'service' ? 75 : 0,
      powerConsumption: newType === 'AS' ? 320 : newType === 'AG' ? 240 : 120
    };

    setFridges([newF, ...fridges]);
    
    // Add movement log for registration
    const newM: RefrigeratorMovement = {
      id: `M-${Math.floor(75000 + Math.random() * 5000)}`,
      refrigeratorId: newF.id,
      serialNumber: newF.serialNumber,
      type: newF.type,
      fromStatus: 'stock',
      toStatus: newF.status,
      fromLocation: 'Usine de Fabrication',
      toLocation: newStatus === 'service' ? (newClient || 'Client Commerce') : `Dépôt ${newDepot}`,
      driverName: driversList.find(d => d.id === newDriver)?.name || 'Équipe Logistique Zahi',
      date: new Date().toLocaleString(),
      notes: 'Enregistrement initial de l\'appareil dans la base IoT.'
    };

    setMovements([newM, ...movements]);

    // Reset Form
    setNewSerial('');
    setNewClient('');
    setNewDriver('');
    setShowAddForm(false);
    setSelectedFridgeId(newF.id);

    playBip(1500, 0.2);
  };

  const handleDeleteFridge = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFridgeToDelete(id);
    playBip(600, 0.1);
  };

  const confirmDeleteFridge = () => {
    if (!fridgeToDelete) return;
    setFridges(prev => prev.filter(f => f.id !== fridgeToDelete));
    if (selectedFridgeId === fridgeToDelete) {
      setSelectedFridgeId(null);
    }
    setFridgeToDelete(null);
    playBip(450, 0.15);
  };

  // Handle batch / single movement action
  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (mvtSelectedFridgeIds.length === 0) {
      alert(lang === 'fr' ? 'Veuillez sélectionner au moins un réfrigérateur.' : 'يرجى اختيار ثلاجة واحدة على الأقل.');
      return;
    }

    const selectedFridgesObj = fridges.filter(f => mvtSelectedFridgeIds.includes(f.id));
    const driverName = driversList.find(d => d.id === mvtDriverId)?.name || 'Chauffeur Logisticien';
    const dateStr = new Date().toLocaleString();

    let newStatus: 'stock' | 'service' | 'maintenance' = 'stock';
    let newLocationName = '';
    let oldLocationName = '';
    let movementTypeName = '';

    if (mvtType === 'depot_transfer') {
      newStatus = 'stock';
      newLocationName = `Dépôt ${mvtDestDepot}`;
      oldLocationName = `Dépôt ${mvtOriginDepot}`;
      movementTypeName = lang === 'fr' ? 'Transfert entre Dépôts' : 'تحويل بين المستودعات';
    } else if (mvtType === 'client_placement') {
      newStatus = 'service';
      newLocationName = mvtDestinationClient || 'Nouveau Client';
      oldLocationName = `Dépôt ${mvtOriginDepot}`;
      movementTypeName = lang === 'fr' ? 'Placement chez Client' : 'وضع لدى عميل';
    } else if (mvtType === 'service_return') {
      newStatus = 'stock';
      newLocationName = `Dépôt ${mvtDestDepot}`;
      oldLocationName = lang === 'fr' ? 'Commerce en Service' : 'عميل في الخدمة';
      movementTypeName = lang === 'fr' ? 'Retour de Service' : 'إرجاع من الخدمة';
    } else if (mvtType === 'maintenance_send') {
      newStatus = 'maintenance';
      newLocationName = lang === 'fr' ? 'Atelier Maintenance Zahi' : 'ورشة الصيانة زاهي';
      oldLocationName = lang === 'fr' ? 'Emplacement Initial' : 'الموقع الحالي';
      movementTypeName = lang === 'fr' ? 'Envoi en Maintenance' : 'إرسال للصيانة';
    }

    // Update refrigerators list
    setFridges(prev => prev.map(f => {
      if (mvtSelectedFridgeIds.includes(f.id)) {
        return {
          ...f,
          status: newStatus,
          depot: (mvtType === 'depot_transfer' || mvtType === 'service_return') ? mvtDestDepot : f.depot,
          client: mvtType === 'client_placement' ? mvtDestinationClient : undefined,
          driverId: mvtDriverId || f.driverId,
          compressorStatus: newStatus === 'maintenance' ? 'defrosting' : 'running'
        };
      }
      return f;
    }));

    // Register movement logs
    const newLogs: RefrigeratorMovement[] = selectedFridgesObj.map(f => {
      const fOldLocation = f.status === 'service' ? (f.client || 'Client') : `Dépôt ${f.depot}`;
      return {
        id: `M-${Math.floor(75000 + Math.random() * 24000)}`,
        refrigeratorId: f.id,
        serialNumber: f.serialNumber,
        type: f.type,
        fromStatus: f.status,
        toStatus: newStatus,
        fromLocation: mvtType === 'service_return' ? fOldLocation : (mvtType === 'maintenance_send' ? fOldLocation : oldLocationName),
        toLocation: newLocationName,
        driverName: driverName,
        date: dateStr,
        notes: mvtNotes || `${movementTypeName} - Transfert logistique.`
      };
    });

    setMovements(prev => [...newLogs, ...prev]);

    // Keep record of the last batch for direct PDF generation in UI
    const batchId = String(Math.floor(88000 + Math.random() * 11000));
    const batchRecord = {
      id: batchId,
      date: dateStr,
      type: movementTypeName,
      origin: mvtType === 'service_return' ? (selectedFridgesObj[0]?.client || 'Clients') : (mvtType === 'maintenance_send' ? 'Dépôts' : oldLocationName),
      destination: newLocationName,
      driverName: driverName,
      notes: mvtNotes || `${movementTypeName} - Opération logistique.`,
      items: selectedFridgesObj.map((f) => ({
        id: f.id,
        serialNumber: f.serialNumber,
        type: f.type,
        oldStatus: f.status,
        newStatus: newStatus,
        temp: f.temp || -18.5
      }))
    };

    setLastRegisteredBatch(batchRecord);

    // Reset some inputs but keep last registered state visible
    setMvtSelectedFridgeIds([]);
    setMvtFridgeSearchQuery('');
    setMvtNotes('');
    setMvtDestinationClient('');
    playBip(1500, 0.2);
  };

  // Assign driver to selected refrigerators (Multi-select linking)
  const handleBulkAssignDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFridgesForDriver.length === 0 || !bulkDriverId) return;

    const selectedDriverName = driversList.find(d => d.id === bulkDriverId)?.name || 'Chauffeur Zahi';

    setFridges(prev => prev.map(f => {
      if (selectedFridgesForDriver.includes(f.id)) {
        return { ...f, driverId: bulkDriverId };
      }
      return f;
    }));

    // Create movement history notes for each
    const newMvts = selectedFridgesForDriver.map(id => {
      const f = fridges.find(fr => fr.id === id)!;
      return {
        id: `M-${Math.floor(75000 + Math.random() * 5000)}`,
        refrigeratorId: f.id,
        serialNumber: f.serialNumber,
        type: f.type,
        fromStatus: f.status,
        toStatus: f.status,
        fromLocation: f.status === 'service' ? (f.client || 'Client') : `Dépôt ${f.depot}`,
        toLocation: f.status === 'service' ? (f.client || 'Client') : `Dépôt ${f.depot}`,
        driverName: selectedDriverName,
        date: new Date().toLocaleString(),
        notes: `Réaffectation ou liaison de service du réfrigérateur au chauffeur : ${selectedDriverName}.`
      } as RefrigeratorMovement;
    });

    setMovements(prev => [...newMvts, ...prev]);
    setSelectedFridgesForDriver([]);
    setBulkDriverId('');
    playBip(1300, 0.25);
  };

  // Bon d'Entrée / Sortie / Prise en Charge / Décharge / Contrat de Dépôt Helper Functions
  const resetBonForm = () => {
    setBonDate(new Date().toISOString().split('T')[0]);
    setBonHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    setBonNumOrdre('0012/2026');
    setBonSecteur('');
    setBonChefSecteur('');
    setBonNomVendeur('');
    setBonCamionTransfert('');
    setBonNo(String(Math.floor(27000 + Math.random() * 70000)).padStart(8, '0'));
    setBonApRows(Array(10).fill(''));
    setBonAgRows(Array(10).fill(''));
    setBonAsRows(Array(10).fill(''));
    setBonVille('المحمدية');
    setBonAdresseLocal('');
    setBonActiviteClient('');
    setBonPatenteNo('');
    setBonNomClient('');
    setBonPrenomClient('');
    setBonCinNo('');
    setBonAdresseClient('');
    setBonCongelateurMarque('Zahi Glaces');
    setBonCongelateurNo('');
    setBonCongelateurType('AP');
    setBonTelephoneNo('');
    setBonObservation('');
    setBonNomLivreur('');
    setVisasSigned({
      vendeur: '',
      chef: '',
      frigoriste: '',
      controle: '',
      responsable: '',
      client: '',
      livreur: ''
    });
  };

  const handleSaveBon = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const newMvts: RefrigeratorMovement[] = [];

    if (bonType === 'entry' || bonType === 'sortie' || bonType === 'livraison' || bonType === 'depot_regional') {
      const apSerials = bonApRows.filter(s => s.trim() !== '');
      const agSerials = bonAgRows.filter(s => s.trim() !== '');
      const asSerials = bonAsRows.filter(s => s.trim() !== '');
      
      if (apSerials.length === 0 && agSerials.length === 0 && asSerials.length === 0) {
        setBonToast({
          message: lang === 'fr' 
            ? "Veuillez remplir au moins un numéro de série AP, AG ou AS." 
            : "يرجى ملء رقم تسلسلي واحد على الأقل لـ AP أو AG أو AS.",
          type: 'error'
        });
        playBip(400, 0.25);
        return;
      }
      
      if (bonType === 'entry' || bonType === 'livraison' || bonType === 'depot_regional') {
        const allSerialsToCheck = [...apSerials, ...agSerials, ...asSerials].map(s => s.trim().toUpperCase());
        
        // Check for duplicate serials inside the form rows
        const uniqueFormSerials = new Set(allSerialsToCheck);
        if (uniqueFormSerials.size !== allSerialsToCheck.length) {
          setBonToast({
            message: lang === 'fr' 
              ? "Erreur : Des numéros de série en double ont été saisis dans ce bon !" 
              : "خطأ: تم إدخال أرقام تسلسلية مكررة في هذا الإذن!",
            type: 'error'
          });
          playBip(400, 0.25);
          return;
        }

        // Target depot: for Bon de Livraison, always Dépôt Casablanca. For Bon d'Entrée, destination depot.
        const targetDepot = bonType === 'livraison' ? 'Casablanca' : bonDepot;
        const fromLoc = bonType === 'livraison' ? 'Usine Centrale / Fournisseur' : 'Dépôt Casablanca';

        if (bonType === 'livraison') {
          // Check if any serial already exists in the refrigerators state
          const existingDuplicate = fridges.find(f => 
            allSerialsToCheck.includes(f.serialNumber.trim().toUpperCase())
          );

          if (existingDuplicate) {
            setBonToast({
              message: lang === 'fr' 
                ? `Erreur : Le numéro de série "${existingDuplicate.serialNumber}" existe déjà dans la base de données !` 
                : `خطأ: رقم التسلسل "${existingDuplicate.serialNumber}" موجود بالفعل في قاعدة البيانات!`,
              type: 'error'
            });
            playBip(400, 0.25);
            return;
          }

          // Add new AP refrigerators to stock in Casablanca
          const newFridges: Refrigerator[] = [];
          apSerials.forEach((serial) => {
            const id = `REF-ZH-AP-${Math.floor(1000 + Math.random() * 9000)}`;
            newFridges.push({
              id,
              serialNumber: serial,
              type: 'AP',
              status: 'stock',
              depot: 'Casablanca',
              temperature: -19.0,
              targetTemperature: -22.0,
              humidity: 62,
              compressorStatus: 'idle',
              lastServiceDate: bonDate,
              fillLevel: 0,
              powerConsumption: 0
            });
            
            newMvts.push({
              id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
              refrigeratorId: id,
              serialNumber: serial,
              type: 'AP',
              fromStatus: 'stock',
              toStatus: 'stock',
              fromLocation: 'Usine Centrale / Fournisseur',
              toLocation: 'Dépôt Casablanca',
              driverName: 'Logistique Usine',
              date: new Date().toLocaleString(),
              notes: `Bon de Livraison N° ${bonNo}${bonCamionTransfert ? ` (${bonCamionTransfert})` : ''}`
            });
          });
          
          // Add new AG refrigerators to stock in Casablanca
          agSerials.forEach((serial) => {
            const id = `REF-ZH-AG-${Math.floor(1000 + Math.random() * 9000)}`;
            newFridges.push({
              id,
              serialNumber: serial,
              type: 'AG',
              status: 'stock',
              depot: 'Casablanca',
              temperature: 4.0,
              targetTemperature: 4.0,
              humidity: 50,
              compressorStatus: 'idle',
              lastServiceDate: bonDate,
              fillLevel: 0,
              powerConsumption: 0
            });
            
            newMvts.push({
              id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
              refrigeratorId: id,
              serialNumber: serial,
              type: 'AG',
              fromStatus: 'stock',
              toStatus: 'stock',
              fromLocation: 'Usine Centrale / Fournisseur',
              toLocation: 'Dépôt Casablanca',
              driverName: 'Logistique Usine',
              date: new Date().toLocaleString(),
              notes: `Bon de Livraison N° ${bonNo}${bonCamionTransfert ? ` (${bonCamionTransfert})` : ''}`
            });
          });

          // Add new AS refrigerators to stock in Casablanca
          asSerials.forEach((serial) => {
            const id = `REF-ZH-AS-${Math.floor(1000 + Math.random() * 9000)}`;
            newFridges.push({
              id,
              serialNumber: serial,
              type: 'AS',
              status: 'stock',
              depot: 'Casablanca',
              temperature: -18.0,
              targetTemperature: -20.0,
              humidity: 55,
              compressorStatus: 'idle',
              lastServiceDate: bonDate,
              fillLevel: 0,
              powerConsumption: 0
            });
            
            newMvts.push({
              id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
              refrigeratorId: id,
              serialNumber: serial,
              type: 'AS',
              fromStatus: 'stock',
              toStatus: 'stock',
              fromLocation: 'Usine Centrale / Fournisseur',
              toLocation: 'Dépôt Casablanca',
              driverName: 'Logistique Usine',
              date: new Date().toLocaleString(),
              notes: `Bon de Livraison N° ${bonNo}${bonCamionTransfert ? ` (${bonCamionTransfert})` : ''}`
            });
          });
          
          setFridges(prev => [...newFridges, ...prev]);
        } else {
          // Bon d'Entrée (Transfer from Casablanca to destination depot):
          // Update existing refrigerators in Casablanca to the new regional depot
          const transferredSerials = new Set(allSerialsToCheck);
          const newlyAdded: Refrigerator[] = [];

          setFridges(prev => {
            const updated = prev.map(f => {
              if (transferredSerials.has(f.serialNumber.trim().toUpperCase())) {
                transferredSerials.delete(f.serialNumber.trim().toUpperCase());
                newMvts.push({
                  id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
                  refrigeratorId: f.id,
                  serialNumber: f.serialNumber,
                  type: f.type,
                  fromStatus: 'stock',
                  toStatus: 'stock',
                  fromLocation: `Dépôt ${f.depot || 'Casablanca'}`,
                  toLocation: `Dépôt ${targetDepot}`,
                  driverName: bonNomVendeur || bonChefSecteur || 'Logistique Zahi',
                  date: new Date().toLocaleString(),
                  notes: `Bon d'Entrée Congélateurs N° ${bonNo}${bonCamionTransfert ? ` (${bonCamionTransfert})` : ''}`
                });
                return {
                  ...f,
                  depot: targetDepot,
                  status: 'stock',
                  lastServiceDate: bonDate
                };
              }
              return f;
            });

            // If any serials were manually typed and not yet in state, initialize them in target depot
            transferredSerials.forEach(s => {
              const guessedType = s.includes('AG') || s.includes('VD') ? 'AG' : s.includes('AS') ? 'AS' : 'AP';
              const id = `REF-ZH-${guessedType}-${Math.floor(1000 + Math.random() * 9000)}`;
              newlyAdded.push({
                id,
                serialNumber: s,
                type: guessedType as any,
                status: 'stock',
                depot: targetDepot,
                temperature: guessedType === 'AG' ? 4.0 : -19.0,
                targetTemperature: guessedType === 'AG' ? 4.0 : -22.0,
                humidity: 55,
                compressorStatus: 'idle',
                lastServiceDate: bonDate,
                fillLevel: 0,
                powerConsumption: 0
              });
              newMvts.push({
                id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
                refrigeratorId: id,
                serialNumber: s,
                type: guessedType,
                fromStatus: 'stock',
                toStatus: 'stock',
                fromLocation: 'Dépôt Casablanca',
                toLocation: `Dépôt ${targetDepot}`,
                driverName: bonNomVendeur || bonChefSecteur || 'Logistique Zahi',
                date: new Date().toLocaleString(),
                notes: `Bon d'Entrée Congélateurs N° ${bonNo}${bonCamionTransfert ? ` (${bonCamionTransfert})` : ''}`
              });
            });

            return [...newlyAdded, ...updated];
          });
        }
        
        const bonTitleLabel = bonType === 'livraison' 
          ? 'de Livraison' 
          : bonType === 'depot_regional' 
          ? 'de Dépôt Régional' 
          : "d'Entrée";
        const bonTitleLabelAr = bonType === 'livraison' 
          ? 'تسليم (Livraison)' 
          : bonType === 'depot_regional' 
          ? 'المستودع الجهوي' 
          : 'الدخول';

        const affectedCount = bonType === 'livraison' ? allSerialsToCheck.length : allSerialsToCheck.length;
        setBonToast({
          message: lang === 'fr' 
            ? `Bon ${bonTitleLabel} N° ${bonNo} enregistré ! ${affectedCount} congélateurs affectés au Dépôt ${targetDepot}.`
            : `تم تسجيل إذن ${bonTitleLabelAr} رقم ${bonNo} بنجاح! تم حفظ ${affectedCount} ثلاجة لمستودع ${targetDepot}.`,
          type: 'success'
        });
      } else {
        // Bon de Sortie: Subtract from stock / Move to service
        const allSerials = [...apSerials, ...agSerials];
        
        setFridges(prev => prev.map(f => {
          const hasSerial = allSerials.some(s => s.toLowerCase() === f.serialNumber.toLowerCase());
          if (hasSerial && f.status === 'stock') {
            newMvts.push({
              id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
              refrigeratorId: f.id,
              serialNumber: f.serialNumber,
              type: f.type,
              fromStatus: 'stock',
              toStatus: 'service',
              fromLocation: `Dépôt ${bonDepot}`,
              toLocation: `Client / Vendeur: ${bonNomVendeur || 'Zahi Glaces'}`,
              driverName: bonNomVendeur || bonChefSecteur || 'Logistique Zahi',
              date: new Date().toLocaleString(),
              notes: `Bon de Sortie Congélateurs N° ${bonNo}`
            });
            
            return {
              ...f,
              status: 'service',
              client: bonNomVendeur || 'Client Vendeur Glaces'
            };
          }
          return f;
        }));
        
        // Also automatically create newly typed exiting serials if they don't exist in stock (to prevent blocks)
        const autoCreatedExits: Refrigerator[] = [];
        apSerials.forEach(serial => {
          const alreadyExists = fridges.some(f => f.serialNumber.toLowerCase() === serial.toLowerCase());
          if (!alreadyExists) {
            const id = `REF-ZH-AP-${Math.floor(1000 + Math.random() * 9000)}`;
            autoCreatedExits.push({
              id,
              serialNumber: serial,
              type: 'AP',
              status: 'service',
              client: bonNomVendeur || 'Client Vendeur Glaces',
              depot: bonDepot,
              temperature: -18.5,
              targetTemperature: -22.0,
              humidity: 60,
              compressorStatus: 'running',
              lastServiceDate: bonDate,
              fillLevel: 50,
              powerConsumption: 120
            });
            newMvts.push({
              id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
              refrigeratorId: id,
              serialNumber: serial,
              type: 'AP',
              fromStatus: 'stock',
              toStatus: 'service',
              fromLocation: `Dépôt ${bonDepot}`,
              toLocation: `Client / Vendeur: ${bonNomVendeur || 'Zahi Glaces'}`,
              driverName: bonNomVendeur || bonChefSecteur || 'Logistique Zahi',
              date: new Date().toLocaleString(),
              notes: `Bon de Sortie Direct N° ${bonNo}`
            });
          }
        });
        
        agSerials.forEach(serial => {
          const alreadyExists = fridges.some(f => f.serialNumber.toLowerCase() === serial.toLowerCase());
          if (!alreadyExists) {
            const id = `REF-ZH-AG-${Math.floor(1000 + Math.random() * 9000)}`;
            autoCreatedExits.push({
              id,
              serialNumber: serial,
              type: 'AG',
              status: 'service',
              client: bonNomVendeur || 'Client Vendeur Glaces',
              depot: bonDepot,
              temperature: 4.0,
              targetTemperature: 4.0,
              humidity: 50,
              compressorStatus: 'running',
              lastServiceDate: bonDate,
              fillLevel: 50,
              powerConsumption: 240
            });
            newMvts.push({
              id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
              refrigeratorId: id,
              serialNumber: serial,
              type: 'AG',
              fromStatus: 'stock',
              toStatus: 'service',
              fromLocation: `Dépôt ${bonDepot}`,
              toLocation: `Client / Vendeur: ${bonNomVendeur || 'Zahi Glaces'}`,
              driverName: bonNomVendeur || bonChefSecteur || 'Logistique Zahi',
              date: new Date().toLocaleString(),
              notes: `Bon de Sortie Direct N° ${bonNo}`
            });
          }
        });
        
        if (autoCreatedExits.length > 0) {
          setFridges(prev => [...autoCreatedExits, ...prev]);
        }
        
        setBonToast({
          message: lang === 'fr' 
            ? `Bon de Sortie N° ${bonNo} enregistré ! ${allSerials.length} congélateurs sortis ou assignés.`
            : `تم تسجيل إذن خروج رقم ${bonNo} بنجاح! تم إخراج ${allSerials.length} ثلاجة من المخزون.`,
          type: 'success'
        });
      }
      setMovements(prev => [...newMvts, ...prev]);
    } else if (bonType === 'contrat_depot') {
      const clientFullName = `${bonNomClient} ${bonPrenomClient}`.trim() || 'الزبون';
      const serial = bonCongelateurNo.trim().toUpperCase();

      if (serial) {
        let found = false;
        setFridges(prev => prev.map(f => {
          if (f.serialNumber.toLowerCase() === serial.toLowerCase()) {
            found = true;
            return {
              ...f,
              status: 'service',
              client: clientFullName
            };
          }
          return f;
        }));

        if (!found) {
          const newF: Refrigerator = {
            id: `REF-ZH-${bonCongelateurType}-${Math.floor(1000 + Math.random() * 9000)}`,
            serialNumber: serial,
            type: bonCongelateurType,
            status: 'service',
            client: clientFullName,
            depot: bonVille || 'المحمدية',
            temperature: (bonCongelateurType === 'AP' || bonCongelateurType === 'AS') ? -18.5 : 4.0,
            targetTemperature: (bonCongelateurType === 'AP' || bonCongelateurType === 'AS') ? -22.0 : 4.0,
            humidity: 60,
            compressorStatus: 'running',
            lastServiceDate: bonDate,
            fillLevel: 50,
            powerConsumption: 180
          };
          setFridges(prev => [newF, ...prev]);
        }

        setMovements(prev => [{
          id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
          refrigeratorId: serial,
          serialNumber: serial,
          type: bonCongelateurType,
          fromStatus: 'stock',
          toStatus: 'service',
          fromLocation: `Dépôt Zahi Glaces (${bonVille})`,
          toLocation: `الزبون: ${clientFullName} (${bonAdresseLocal || 'محل الإيداع'})`,
          driverName: bonNomLivreur || 'موزع شركة زاهي كلاص',
          date: new Date().toLocaleString(),
          notes: `عقد إيداع ثلاجة مجمدة (كونجيلاتور) N° ${bonNo}`
        }, ...prev]);
      }

      setBonToast({
        message: `تم حفظ عقد إيداع الثلاجة رقم ${bonNo} بنجاح في التطبيق!`,
        type: 'success'
      });
    } else {
      // bonType === 'prise_en_charge' || bonType === 'decharge'
      const clientFullName = `${bonNomClient} ${bonPrenomClient}`.trim() || bonActiviteClient || 'Client';
      
      if (bonCongelateurNo.trim()) {
        const serial = bonCongelateurNo.trim().toUpperCase();
        let found = false;
        setFridges(prev => prev.map(f => {
          if (f.serialNumber.toLowerCase() === serial.toLowerCase()) {
            found = true;
            return {
              ...f,
              status: bonType === 'prise_en_charge' ? 'service' : 'stock',
              client: bonType === 'prise_en_charge' ? clientFullName : ''
            };
          }
          return f;
        }));

        if (!found && bonType === 'prise_en_charge') {
          const newF: Refrigerator = {
            id: `REF-ZH-${bonCongelateurType}-${Math.floor(1000 + Math.random() * 9000)}`,
            serialNumber: serial,
            type: bonCongelateurType,
            status: 'service',
            client: clientFullName,
            depot: bonDepot,
            temperature: (bonCongelateurType === 'AP' || bonCongelateurType === 'AS') ? -18.5 : 4.0,
            targetTemperature: (bonCongelateurType === 'AP' || bonCongelateurType === 'AS') ? -22.0 : 4.0,
            humidity: 60,
            compressorStatus: 'running',
            lastServiceDate: bonDate,
            fillLevel: 50,
            powerConsumption: 180
          };
          setFridges(prev => [newF, ...prev]);
        }

        setMovements(prev => [{
          id: `M-BON-${Math.floor(10000 + Math.random() * 90000)}`,
          refrigeratorId: serial,
          serialNumber: serial,
          type: bonCongelateurType,
          fromStatus: bonType === 'prise_en_charge' ? 'stock' : 'service',
          toStatus: bonType === 'prise_en_charge' ? 'service' : 'stock',
          fromLocation: bonType === 'prise_en_charge' ? `Dépôt ${bonDepot}` : `Client: ${clientFullName}`,
          toLocation: bonType === 'prise_en_charge' ? `Client: ${clientFullName}` : `Dépôt ${bonDepot}`,
          driverName: bonNomLivreur || bonNomVendeur || 'Equipe Zahi',
          date: new Date().toLocaleString(),
          notes: `${bonType === 'prise_en_charge' ? 'Bon de Prise en Charge' : 'Bon de Décharge'} N° ${bonNo}`
        }, ...prev]);
      }

      setBonToast({
        message: bonType === 'prise_en_charge'
          ? `Bon de Prise en Charge N° ${bonNo} enregistré dans l'application !`
          : `Bon de Décharge N° ${bonNo} enregistré dans l'application !`,
        type: 'success'
      });
    }

    // Add to savedBons history
    const newBon = {
      id: `B-SAV-${Date.now()}`,
      bonNo,
      type: bonType,
      date: bonDate,
      heure: bonHeure,
      ville: bonVille,
      numOrdre: bonNumOrdre,
      secteur: bonSecteur,
      chefSecteur: bonChefSecteur || 'Equipe Zahi',
      nomVendeur: bonNomVendeur || 'Chauffeur Vendeur',
      camionTransfert: bonCamionTransfert,
      depot: bonDepot,
      activiteClient: bonActiviteClient,
      patenteNo: bonPatenteNo,
      nomClient: bonNomClient,
      prenomClient: bonPrenomClient,
      cinNo: bonCinNo,
      adresseClient: bonAdresseClient,
      adresseLocal: bonAdresseLocal,
      congelateurMarque: bonCongelateurMarque,
      congelateurNo: bonCongelateurNo,
      congelateurType: bonCongelateurType,
      telephoneNo: bonTelephoneNo,
      observation: bonObservation,
      nomLivreur: bonNomLivreur,
      apRows: [...bonApRows],
      agRows: [...bonAgRows],
      asRows: [...bonAsRows],
      visasSigned: { ...visasSigned }
    };
    
    setSavedBons(prev => [newBon, ...prev]);

    // Sync with Listing Vendeurs (zahi_refrigerator_listing in localStorage)
    try {
      const INITIAL_LISTING_RECORDS = [
        { id: '1', vendeur: 'ABDERAHIM', conge: '961 AG', sortieUnite: 0, priseEnCharge: '74625', bonSortie: '22776', dateBonPc: '21/04/2025', clientName: 'AHMED SAMAKI', adresse: 'OULAD GHANAM', telephone: '06 14 77 68 99', cin: 'M150802', status: 'ACTIF' },
        { id: '2', vendeur: 'ABDERAHIM', conge: '306-25AG', sortieUnite: 1, priseEnCharge: '77941', bonSortie: '23656', dateBonPc: '27/02/2026', clientName: 'BADER HAMSI', adresse: 'BVR CHOHDA', telephone: '06 63 05 63 80', cin: 'M376143', status: 'ACTIF' },
        { id: '3', vendeur: 'ABDERAHIM', conge: '130-25AG', sortieUnite: 1, priseEnCharge: '77115', bonSortie: '22787', dateBonPc: '16/07/2025', clientName: 'ABDELAH AHLAL', adresse: 'SIDI BOUZID SAKA', telephone: '06 78 78 24 17', cin: 'BE792726', status: 'ACTIF' },
        { id: '4', vendeur: 'ABDERAHIM', conge: '983AG', sortieUnite: 0, priseEnCharge: '35635', bonSortie: '12659', dateBonPc: '28/02/2022', clientName: 'ABDELKARIM LGALIL', adresse: 'EL JADIDA', telephone: '06 38 48 88 28', cin: 'M536493', status: 'ACTIF' },
        { id: '5', vendeur: 'ABDERAHIM', conge: '408-21AG', sortieUnite: 1, priseEnCharge: '48058', bonSortie: '16704', dateBonPc: '05/02/2024', clientName: 'FATIMA EANZI', adresse: 'SIDI ALI AZMOUR', telephone: '06 18 38 94 86', cin: 'M708909', status: 'ACTIF' },
        { id: '6', vendeur: 'ABDERAHIM', conge: '847-24AS', sortieUnite: 1, priseEnCharge: '68617', bonSortie: '16729', dateBonPc: '29/04/2024', clientName: 'IMAD AKHARZ (mouad)', adresse: 'OULAD GHANEM', telephone: '06 14 80 33 25', cin: 'JC801140', status: 'ACTIF' },
        { id: '7', vendeur: 'ABDERAHIM', conge: '173AG', sortieUnite: 1, priseEnCharge: '40620', bonSortie: '', dateBonPc: '21/02/2023', clientName: 'SAYS HOSNI', adresse: 'DWAR ZAWIA', telephone: '06 20 19 15 00', cin: 'M546115', status: 'ACTIF' },
        { id: '8', vendeur: 'ABDERAHIM', conge: '599-20AG', sortieUnite: 1, priseEnCharge: '48066', bonSortie: '', dateBonPc: '20/02/2024', clientName: 'MOUNIR KHALOUN', adresse: 'OULAD GHANEM', telephone: '06 07 78 80 15', cin: 'M519208', status: 'ACTIF' },
        { id: '9', vendeur: 'ABDERAHIM', conge: '851-21AG', sortieUnite: 1, priseEnCharge: '48093', bonSortie: '', dateBonPc: '04/04/2024', clientName: 'ABDELHAK AAROUSSI', adresse: 'HAY SINAEI', telephone: '06 16 18 20 22', cin: 'MA63685', status: 'ACTIF' },
        { id: '10', vendeur: 'ABDERAHIM', conge: '19-19AG', sortieUnite: 1, priseEnCharge: '77102', bonSortie: '22784', dateBonPc: '28/05/2025', clientName: 'ABDENABI BARICHH', adresse: 'ROUTE MARRAKECH', telephone: '06 62 62 88 17', cin: 'M185042', status: 'ACTIF' },
        { id: '11', vendeur: 'ABDERAHIM', conge: '5984-25AG', sortieUnite: 1, priseEnCharge: '74845', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'JAMILA TAHAR', adresse: 'MALAH MADINA', telephone: '06 16 15 80 22', cin: 'M54807', status: 'ACTIF' },
        { id: '12', vendeur: 'ABDERAHIM', conge: '5700-25AG', sortieUnite: 1, priseEnCharge: '74848', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'BRAHIM WAZNI', adresse: 'ROUTE DOUAR ISSA', telephone: '06 42 95 71 72', cin: 'JE293785', status: 'ACTIF' },
        { id: '13', vendeur: 'ABDERAHIM', conge: '5699-25AG', sortieUnite: 1, priseEnCharge: '74847', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'MOHAMED BAHAMOU', adresse: 'BVR MOHAMED 5 EN FACE MAHTA', telephone: '06 30 80 95 32', cin: 'BK3811', status: 'ACTIF' },
        { id: '14', vendeur: 'ABDERAHIM', conge: '1053AG', sortieUnite: 1, priseEnCharge: '74467', bonSortie: '22755', dateBonPc: '17/06/2025', clientName: 'MOHAMED HANZAZ', adresse: 'MOULAY ABDELAH', telephone: '06 10 02 09 88', cin: 'M873420', status: 'ACTIF' },
        { id: '15', vendeur: 'ABDERAHIM', conge: '5763-25AG', sortieUnite: 1, priseEnCharge: '74844', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'ABDERAHMAN HAYANI', adresse: 'BVR NAKHIL', telephone: '06 66 63 80 45', cin: 'JE160022', status: 'ACTIF' },
        { id: '16', vendeur: 'ABDERAHIM', conge: '1567-26AG', sortieUnite: 1, priseEnCharge: '79012', bonSortie: '23661', dateBonPc: '04/04/2026', clientName: 'ABDELAH SAMIH', adresse: 'EN FACE MAHTA AZMOUR', telephone: '06 61 45 00 78', cin: 'M507400', status: 'ACTIF' },
        { id: '17', vendeur: 'ABDERAHIM', conge: '223AP', sortieUnite: 1, priseEnCharge: '74460', bonSortie: '22755', dateBonPc: '05/02/2025', clientName: 'AHMED RABAH', adresse: 'SIDI ABED', telephone: '06 10 12 18 00', cin: 'M490837', status: 'ACTIF' },
        { id: '18', vendeur: 'ABDERAHIM', conge: '547-25AG', sortieUnite: 1, priseEnCharge: '77908', bonSortie: '23656', dateBonPc: '27/02/2026', clientName: 'MOHAMED BOU HADOU', adresse: 'FACULTE DES SCIENCES', telephone: '06 68 22 25 74', cin: 'MA508702', status: 'ACTIF' },
        { id: '19', vendeur: 'ABDERAHIM', conge: '502-25AG', sortieUnite: 1, priseEnCharge: '72179', bonSortie: '23656', dateBonPc: '27/02/2026', clientName: 'DRISS OUKAZMAT', adresse: 'HAY MATAR MARJANE', telephone: '06 16 33 55 70', cin: 'MA504702', status: 'ACTIF' },
        { id: '20', vendeur: 'ABDERAHIM', conge: '236-20AG', sortieUnite: 1, priseEnCharge: '74487', bonSortie: '22763', dateBonPc: '27/02/2025', clientName: 'ABDENABI HAKIM', adresse: 'BOUCHRIT MOHAMED 5', telephone: '06 94 82 63 02', cin: 'MA64251', status: 'ACTIF' },
        { id: '21', vendeur: 'RACHIDI', conge: '2564AG', sortieUnite: 0, priseEnCharge: '77956', bonSortie: '23652', dateBonPc: '12/02/2026', clientName: 'BRAHIM HANNAOUI', adresse: 'MOULAY ABDELAH', telephone: '06 10 46 42 12', cin: 'MA15887', status: 'NON ACTIF' },
        { id: '22', vendeur: 'RACHIDI', conge: '5172AG', sortieUnite: 0, priseEnCharge: '77901', bonSortie: '23651', dateBonPc: '10/02/2026', clientName: 'ABDERAHIM RAFIK', adresse: 'TNIN CITOUKA', telephone: '06 18 40 24 35', cin: 'MC701918', status: 'NON ACTIF' },
        { id: '23', vendeur: 'RACHIDI', conge: '5277AG', sortieUnite: 0, priseEnCharge: '77955', bonSortie: '23652', dateBonPc: '12/02/2026', clientName: 'ZAHRA BEL HAMDOUN', adresse: 'MOULAY ABDELAH', telephone: '06 18 22 30 77', cin: 'MA15802', status: 'NON ACTIF' },
        { id: '24', vendeur: 'RACHIDI', conge: '716-23AG', sortieUnite: 0, priseEnCharge: '77903', bonSortie: '23653', dateBonPc: '18/02/2026', clientName: 'JILALI BELAFQIH', adresse: 'SIDI ALI AZMOUR', telephone: '06 18 22 40 15', cin: 'MA75085', status: 'PROBLEME' },
        { id: '25', vendeur: 'RACHIDI', conge: '4182AG', sortieUnite: 0, priseEnCharge: '77954', bonSortie: '23652', dateBonPc: '12/02/2026', clientName: 'YAZID BOUZAOUI', adresse: 'ROUTE HAOUZIA VILLE AZEMMOUR', telephone: '06 61 18 13 00', cin: 'MA62363', status: 'NON ACTIF' },
        { id: '26', vendeur: 'RACHIDI', conge: '291-23AG', sortieUnite: 0, priseEnCharge: '74628', bonSortie: '', dateBonPc: '24/04/2025', clientName: 'MOHAMED BEN SAFIYA', adresse: 'QAMRA AZMOUR', telephone: '06 64 74 02 25', cin: 'MA28941', status: 'PROBLEME' },
        { id: '27', vendeur: 'RACHIDI', conge: '729-21AG', sortieUnite: 0, priseEnCharge: '74640', bonSortie: '', dateBonPc: '16/05/2025', clientName: 'MOSTAPHA ZAROUQ', adresse: 'ROUTE WALIDIA', telephone: '07 18 50 73 31', cin: 'M701580', status: 'NON ACTIF' },
        { id: '28', vendeur: 'RACHIDI', conge: '5597AG', sortieUnite: 1, priseEnCharge: '48100', bonSortie: '', dateBonPc: '08/04/2024', clientName: 'ABDELAH', adresse: 'JAMAT HAOUZIA', telephone: '06 61 80 91 45', cin: 'MA507411', status: 'ACTIF' },
        { id: '29', vendeur: 'RACHIDI', conge: '1743-26AG', sortieUnite: 1, priseEnCharge: '85760', bonSortie: '23660', dateBonPc: '04/04/2026', clientName: 'BOUCHAIB ZHOURI', adresse: 'ROUTE MAHYOULA OULAD FREJ', telephone: '06 16 40 52 30', cin: 'MA271178', status: 'ACTIF' },
        { id: '30', vendeur: 'RACHIDI', conge: '1570-26AG', sortieUnite: 1, priseEnCharge: '85776', bonSortie: '23661', dateBonPc: '04/04/2026', clientName: 'ABDELADIM ZETOUNI', adresse: 'HAY MATAR', telephone: '06 33 27 69 91', cin: 'MA527518', status: 'ACTIF' },
        { id: '31', vendeur: 'RACHIDI', conge: '1554-26AG', sortieUnite: 1, priseEnCharge: '79009', bonSortie: '23661', dateBonPc: '04/04/2026', clientName: 'ABDELKADER AALAOUI', adresse: 'STATION CENTRE JADIDA', telephone: '06 16 42 13 46', cin: 'MA128546', status: 'ACTIF' },
        { id: '32', vendeur: 'RACHIDI', conge: '660-19AS', sortieUnite: 1, priseEnCharge: '40649', bonSortie: '10973', dateBonPc: '07/04/2023', clientName: 'ABDELAH SAMIH', adresse: '8 DARB BARNIS AZAMOUR', telephone: '06 62 40 77 32', cin: 'M97523', status: 'ACTIF' }
      ];

      const savedListingStr = localStorage.getItem('zahi_refrigerator_listing');
      let listing: any[] = [];
      if (savedListingStr) {
        listing = JSON.parse(savedListingStr);
      } else {
        listing = [...INITIAL_LISTING_RECORDS];
      }

      const formatDateFr = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
      };

      const sellerName = (bonNomVendeur || 'Hamza Ch.').trim().toUpperCase();

      if (bonType === 'prise_en_charge') {
        const serial = (bonCongelateurNo || '').trim().toUpperCase();
        if (serial) {
          const existingIdx = listing.findIndex(r => r.conge.toUpperCase() === serial);
          const clientFullName = `${bonNomClient} ${bonPrenomClient}`.trim() || bonActiviteClient || 'Client';

          const newRec = {
            id: existingIdx >= 0 ? listing[existingIdx].id : `R-REC-${Date.now()}`,
            vendeur: sellerName,
            conge: serial,
            sortieUnite: 1,
            priseEnCharge: bonNo || '',
            bonSortie: bonNumOrdre || '',
            dateBonPc: formatDateFr(bonDate),
            clientName: clientFullName,
            adresse: bonAdresseClient || '',
            telephone: bonTelephoneNo || '',
            cin: bonCinNo || '',
            status: 'ACTIF'
          };

          if (existingIdx >= 0) {
            listing[existingIdx] = newRec;
          } else {
            listing.unshift(newRec);
          }
        }
      } else if (bonType === 'decharge') {
        const serial = (bonCongelateurNo || '').trim().toUpperCase();
        if (serial) {
          const existingIdx = listing.findIndex(r => r.conge.toUpperCase() === serial);
          const clientFullName = `${bonNomClient} ${bonPrenomClient}`.trim() || bonActiviteClient || 'Client';

          if (existingIdx >= 0) {
            listing[existingIdx] = {
              ...listing[existingIdx],
              vendeur: sellerName,
              sortieUnite: 0,
              status: 'NON ACTIF',
              dateBonPc: formatDateFr(bonDate),
              clientName: clientFullName,
              adresse: bonAdresseClient || '',
              telephone: bonTelephoneNo || '',
              cin: bonCinNo || ''
            };
          } else {
            const newRec = {
              id: `R-REC-${Date.now()}`,
              vendeur: sellerName,
              conge: serial,
              sortieUnite: 0,
              priseEnCharge: '',
              bonSortie: bonNumOrdre || '',
              dateBonPc: formatDateFr(bonDate),
              clientName: clientFullName,
              adresse: bonAdresseClient || '',
              telephone: bonTelephoneNo || '',
              cin: bonCinNo || '',
              status: 'NON ACTIF'
            };
            listing.unshift(newRec);
          }
        }
      } else if (bonType === 'sortie') {
        const apSerials = bonApRows.filter(s => s.trim() !== '');
        const agSerials = bonAgRows.filter(s => s.trim() !== '');
        const allSerials = [...apSerials, ...agSerials];

        allSerials.forEach((serial, idx) => {
          const s = serial.trim().toUpperCase();
          const existingIdx = listing.findIndex(r => r.conge.toUpperCase() === s);

          if (existingIdx >= 0) {
            listing[existingIdx] = {
              ...listing[existingIdx],
              vendeur: sellerName,
              bonSortie: bonNo,
              dateBonPc: formatDateFr(bonDate),
              sortieUnite: 1,
              status: 'ACTIF'
            };
          } else {
            const newRec = {
              id: `R-REC-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
              vendeur: sellerName,
              conge: s,
              sortieUnite: 1,
              priseEnCharge: '',
              bonSortie: bonNo,
              dateBonPc: formatDateFr(bonDate),
              clientName: 'Client Vendeur',
              adresse: bonAdresseLocal || '',
              telephone: '',
              cin: '',
              status: 'ACTIF'
            };
            listing.unshift(newRec);
          }
        });
      }

      localStorage.setItem('zahi_refrigerator_listing', JSON.stringify(listing));
    } catch (err) {
      console.error("Failed to sync listing records:", err);
    }
    playBip(1300, 0.2);
    
    setTimeout(() => {
      setBonToast(null);
    }, 4000);
  };

  const handleDeleteBon = (id: string) => {
    setSavedBons(prev => prev.filter(b => b.id !== id));
    playBip(500, 0.15);
  };

  const loadSavedBon = (bon: any) => {
    setBonType(bon.type);
    setBonDate(bon.date || new Date().toISOString().split('T')[0]);
    setBonHeure(bon.heure || '10:00');
    setBonVille(bon.ville || 'المحمدية');
    setBonNumOrdre(bon.numOrdre || '');
    setBonSecteur(bon.secteur || '');
    setBonChefSecteur(bon.chefSecteur || '');
    setBonNomVendeur(bon.nomVendeur || '');
    setBonCamionTransfert(bon.camionTransfert || '');
    setBonNo(bon.bonNo);
    setBonActiviteClient(bon.activiteClient || '');
    setBonPatenteNo(bon.patenteNo || '');
    setBonNomClient(bon.nomClient || '');
    setBonPrenomClient(bon.prenomClient || '');
    setBonCinNo(bon.cinNo || '');
    setBonAdresseClient(bon.adresseClient || '');
    setBonAdresseLocal(bon.adresseLocal || '');
    setBonCongelateurMarque(bon.congelateurMarque || 'Zahi Glaces');
    setBonCongelateurNo(bon.congelateurNo || '');
    setBonCongelateurType(bon.congelateurType || 'AP');
    setBonTelephoneNo(bon.telephoneNo || '');
    setBonObservation(bon.observation || '');
    setBonNomLivreur(bon.nomLivreur || '');
    
    const ap = Array.isArray(bon.apRows) ? bon.apRows : [];
    const ag = Array.isArray(bon.agRows) ? bon.agRows : [];
    const as = Array.isArray(bon.asRows) ? bon.asRows : [];
    
    const fullAp = Array(10).fill('');
    ap.forEach((val: string, i: number) => { if (i < 10) fullAp[i] = val; });
    
    const fullAg = Array(10).fill('');
    ag.forEach((val: string, i: number) => { if (i < 10) fullAg[i] = val; });

    const fullAs = Array(10).fill('');
    as.forEach((val: string, i: number) => { if (i < 10) fullAs[i] = val; });
    
    setBonApRows(fullAp);
    setBonAgRows(fullAg);
    setBonAsRows(fullAs);
    setBonDepot(bon.depot || 'Casablanca');
    setVisasSigned({ ...bon.visasSigned });
    setActiveSubTab('bons');
    playBip(1000, 0.08);
  };

  const handlePrintSavedBon = (bon: any) => {
    loadSavedBon(bon);
    playBip(1200, 0.1);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const signVisa = (role: string) => {
    let name = '';
    if (role === 'vendeur') name = bonNomVendeur || 'Hamza Ch.';
    else if (role === 'client') name = `${bonNomClient} ${bonPrenomClient}`.trim() || 'Client Signé';
    else if (role === 'livreur') name = bonNomLivreur || 'Livreur Zahi';
    else if (role === 'chef') name = bonChefSecteur || 'Mustapha Ait';
    else if (role === 'frigoriste') name = 'Youssef El-Frig';
    else if (role === 'controle') name = 'Agent Contrôle';
    else if (role === 'responsable') name = 'Responsable Zahi';
    
    setVisasSigned(prev => ({
      ...prev,
      [role]: prev[role] ? '' : name
    }));
    playBip(1100, 0.05);
  };

  // Toggle Thermostat status
  const toggleCompressorStatus = (newMode: 'running' | 'idle' | 'defrosting') => {
    if (!activeFridge) return;
    setFridges(prev => prev.map(f => {
      if (f.id === activeFridge.id) {
        return { ...f, compressorStatus: newMode };
      }
      return f;
    }));
    playBip(1000, 0.08);
  };

  // Change Thermostat Target Slider
  const handleTargetTempChange = (newTarget: number) => {
    if (!activeFridge) return;
    setFridges(prev => prev.map(f => {
      if (f.id === activeFridge.id) {
        return { ...f, targetTemperature: newTarget };
      }
      return f;
    }));
  };

  // Filters application
  const filteredFridges = fridges.filter(f => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    
    let matchesCategory = true;
    if (categoryFilter === 'AP') {
      matchesCategory = f.type === 'AP' || f.type === 'chest';
    } else if (categoryFilter === 'AG') {
      matchesCategory = f.type === 'AG' || f.type === 'upright';
    } else if (categoryFilter === 'AS') {
      matchesCategory = f.type === 'AS';
    }

    const matchesDepot = selectedStatsDepot === 'all' || f.depot.toLowerCase() === selectedStatsDepot.toLowerCase();

    const matchesSearch = f.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (f.client && f.client.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          f.depot.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesDepot && matchesSearch;
  });

  const displayTitle = standalone 
    ? (activeSubTab === 'logistics' 
        ? (lang === 'fr' ? 'Logistique & Affectation Chauffeurs' : 'اللوجستيات وتعيين السائقين')
        : (lang === 'fr' ? 'Géolocalisation GPS' : 'التتبع الجغرافي GPS'))
    : t.title;

  const displaySubtitle = standalone 
    ? (activeSubTab === 'logistics' 
        ? (lang === 'fr' ? 'Affectation des réfrigérateurs aux camions et chauffeurs pour livraison et maintenance' : 'ربط وتعيين مجموعة من الثلاجات بشاحنات السائقين للتسليم أو الصيانة')
        : (lang === 'fr' ? 'Suivi en temps réel de la position de nos réfrigérateurs connectés' : 'تتبع مواقع ثلاجات العرض الذكية المتصلة في الوقت الفعلي'))
    : t.subtitle;

  return (
    <div id="refrigerator-module" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      
      {/* Module Header Block with dynamic color palette */}
      <div className="p-6 bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 dark:from-sky-950 dark:to-indigo-950 text-white relative">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Snowflake className="h-40 w-40 animate-spin-slow text-white" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-xl">
                <Snowflake className="h-6 w-6 text-sky-100" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{displayTitle}</h2>
            </div>
            <p className="text-xs text-sky-100/85">{displaySubtitle}</p>
          </div>
          
          {!standalone && (
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => { setActiveSubTab('inventory'); playBip(800, 0.05); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === 'inventory' 
                    ? 'bg-white text-sky-900 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {lang === 'fr' ? 'Parc Réfrigérateurs' : 'ثلاجات العرض'}
              </button>
              <button 
                onClick={() => { setActiveSubTab('maintenance'); playBip(800, 0.05); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'maintenance' 
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{lang === 'fr' ? 'Maintenance' : 'الصيانة'}</span>
                <span className="px-1.5 py-0.2 bg-amber-950/20 text-slate-900 dark:text-amber-200 text-[10px] rounded-full font-mono font-bold">
                  {maintenances.filter(m => m.status === 'En cours').length}
                </span>
              </button>
              <button 
                onClick={() => { setActiveSubTab('geoloc'); playBip(800, 0.05); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'geoloc' 
                    ? 'bg-emerald-400 text-slate-950 shadow-md font-black' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{lang === 'fr' ? 'Géolocalisation GPS' : 'التتبع الجغرافي'}</span>
              </button>
              <button 
                onClick={() => { setActiveSubTab('movements'); playBip(800, 0.05); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === 'movements' 
                    ? 'bg-white text-sky-900 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {lang === 'fr' ? 'Mouvements de Stock' : 'حركة المخزون'}
              </button>
              <button 
                onClick={() => { setActiveSubTab('bons'); playBip(800, 0.05); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'bons' 
                    ? 'bg-white text-sky-900 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {lang === 'fr' ? "Formulaire des Bons" : "تعبئة الأذونات والسنادت"}
              </button>
              <button 
                onClick={() => { setActiveSubTab('historique'); playBip(800, 0.05); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'historique' 
                    ? 'bg-white text-sky-900 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <History className="h-3.5 w-3.5 text-amber-300" />
                <span>{lang === 'fr' ? 'Historique des Bons' : 'سجل الأذونات'}</span>
                <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-200 text-[10px] rounded-full font-mono">
                  {savedBons.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: INVENTORY & DETAILED CONTROLS */}
      {activeSubTab === 'inventory' && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List panel (left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Quick stats ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{lang === 'fr' ? 'Total Appareils' : 'مجموع الثلاجات'}</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{fridges.length}</span>
              </div>
              <div className="bg-green-500/5 p-3 rounded-2xl border border-green-500/10">
                <span className="text-[10px] text-green-500 font-bold block uppercase">{t.inService}</span>
                <span className="text-xl font-black text-green-600 dark:text-green-400">{fridges.filter(f => f.status === 'service').length}</span>
              </div>
              <div className="bg-sky-500/5 p-3 rounded-2xl border border-sky-500/10">
                <span className="text-[10px] text-sky-500 font-bold block uppercase">{t.inStock}</span>
                <span className="text-xl font-black text-sky-600 dark:text-sky-400">{fridges.filter(f => f.status === 'stock').length}</span>
              </div>
              <div className="bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10">
                <span className="text-[10px] text-amber-500 font-bold block uppercase">{lang === 'fr' ? 'En Atelier / Maintenance' : 'قيد الصيانة'}</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">{fridges.filter(f => f.status === 'maintenance').length}</span>
              </div>
            </div>

            {/* Depot Selector & Statistics Dashboard 2026 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              
              {/* Dashboard Header with 2026 Toggle Style */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>{lang === 'fr' ? 'Tableau de Bord Régional des Dépôts' : 'لوحة القيادة الإقليمية للمستودعات'}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'fr' 
                        ? 'Supervision globale, répartition en temps réel et filtres d\'analyse instantanés.' 
                        : 'إشراف عام، توزيع فوري مع خاصية الفرز والتحليل المباشر.'}
                    </p>
                  </div>
                </div>

                {/* View switcher & filter cleaner */}
                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
                  {selectedStatsDepot !== 'all' && (
                    <button
                      type="button"
                      onClick={() => { setSelectedStatsDepot('all'); playBip(750, 0.05); }}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black transition-all uppercase flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <X className="h-3 w-3" />
                      <span>{lang === 'fr' ? 'Réinitialiser filtre' : 'إعادة تعيين'}</span>
                    </button>
                  )}

                  <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/20">
                    <button
                      type="button"
                      onClick={() => { setDepotViewMode('grid'); playBip(800, 0.04); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        depotViewMode === 'grid'
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {lang === 'fr' ? 'Bento' : 'بطاقات'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDepotViewMode('table'); playBip(800, 0.04); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        depotViewMode === 'table'
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {lang === 'fr' ? 'Tableau' : 'جدول'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid View (Bento Depot Cards 2026) */}
              {depotViewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
                  {/* Option "Tous les dépôts" Card first */}
                  <div
                    onClick={() => { setSelectedStatsDepot('all'); playBip(900, 0.05); }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden group ${
                      selectedStatsDepot === 'all'
                        ? 'bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-900/40 border-sky-500 shadow ring-1 ring-sky-500/20'
                        : 'bg-slate-50/55 dark:bg-slate-850 hover:bg-slate-50 hover:border-slate-300 dark:hover:border-slate-800 border-slate-100 dark:border-slate-850/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1.5 rounded-lg ${selectedStatsDepot === 'all' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500'}`}>
                          <Globe className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white text-xs font-sans">
                          {lang === 'fr' ? 'Tous les dépôts' : 'جميع المستودعات'}
                        </span>
                      </div>
                      {selectedStatsDepot === 'all' && (
                        <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping absolute top-3.5 right-3.5" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white font-mono">
                        {fridges.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {lang === 'fr' ? 'Appareils' : 'أجهزة'}
                      </span>
                    </div>

                    {/* Simple segment progress indicator */}
                    <div className="w-full space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(fridges.filter(f => f.status === 'service').length / fridges.length) * 100}%` }} className="bg-emerald-500" />
                        <div style={{ width: `${(fridges.filter(f => f.status === 'stock').length / fridges.length) * 100}%` }} className="bg-sky-500" />
                        <div style={{ width: `${(fridges.filter(f => f.status === 'maintenance').length / fridges.length) * 100}%` }} className="bg-amber-500" />
                      </div>
                      <div className="grid grid-cols-3 gap-0.5 text-[8.5px] font-bold text-slate-400 uppercase font-mono text-center">
                        <div>
                          <span className="text-emerald-500 font-black">{(fridges.filter(f => f.status === 'service').length)}</span> {lang === 'fr' ? 'Svc' : 'خدمة'}
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-800">
                          <span className="text-sky-500 font-black">{(fridges.filter(f => f.status === 'stock').length)}</span> {lang === 'fr' ? 'Stk' : 'مخزن'}
                        </div>
                        <div>
                          <span className="text-amber-500 font-black">{(fridges.filter(f => f.status === 'maintenance').length)}</span> {lang === 'fr' ? 'Mnt' : 'صيانة'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Individual regional depots */}
                  {regionalDepots.map(depot => {
                    const depotFridges = fridges.filter(f => f.depot.toLowerCase() === depot.toLowerCase());
                    const total = depotFridges.length;
                    const service = depotFridges.filter(f => f.status === 'service').length;
                    const stock = depotFridges.filter(f => f.status === 'stock').length;
                    const maint = depotFridges.filter(f => f.status === 'maintenance').length;
                    const isSelected = selectedStatsDepot.toLowerCase() === depot.toLowerCase();

                    // Activity ratio
                    const actRatio = total > 0 ? Math.round((service / total) * 100) : 0;

                    return (
                      <div
                        key={depot}
                        onClick={() => { setSelectedStatsDepot(isSelected ? 'all' : depot); playBip(900, 0.05); }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md ${
                          isSelected
                            ? 'bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-900/40 border-sky-500 shadow ring-1 ring-sky-500/20'
                            : 'bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 border-slate-100 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              <Warehouse className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs truncate font-sans">
                              {depot}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping absolute top-3.5 right-3.5" />
                          )}
                        </div>

                        {/* Middle metrics section */}
                        <div className="flex items-baseline justify-between mt-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white font-mono">
                              {total}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {lang === 'fr' ? 'Appareils' : 'أجهزة'}
                            </span>
                          </div>

                          {/* Act Ratio Badge */}
                          {total > 0 && (
                            <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-lg font-mono" title={lang === 'fr' ? "Taux d'utilisation actif" : "معدل التشغيل والنشاط"}>
                              {actRatio}% ACTIF
                            </div>
                          )}
                        </div>

                        {/* Multi-segment Horizontal Progress Bar for Zahi 2026 Style */}
                        <div className="w-full space-y-1.5">
                          {total > 0 ? (
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                              <div style={{ width: `${(service / total) * 100}%` }} className="bg-emerald-500" title={`Service: ${service}`} />
                              <div style={{ width: `${(stock / total) * 100}%` }} className="bg-sky-500" title={`Stock: ${stock}`} />
                              <div style={{ width: `${(maint / total) * 100}%` }} className="bg-amber-500" title={`Maintenance: ${maint}`} />
                            </div>
                          ) : (
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                          )}

                          {/* Status Details counters */}
                          <div className="grid grid-cols-3 gap-0.5 text-[8.5px] font-bold text-slate-400 uppercase font-mono text-center">
                            <div className="hover:text-emerald-600 transition-colors">
                              <span className="text-emerald-500 font-black">{service}</span> {lang === 'fr' ? 'Svc' : 'خدمة'}
                            </div>
                            <div className="border-x border-slate-200 dark:border-slate-800 hover:text-sky-600 transition-colors">
                              <span className="text-sky-500 font-black">{stock}</span> {lang === 'fr' ? 'Stk' : 'مخزن'}
                            </div>
                            <div className="hover:text-amber-600 transition-colors">
                              <span className="text-amber-500 font-black">{maint}</span> {lang === 'fr' ? 'Mnt' : 'صيانة'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interactive Table View (Tableau Interactif 2026) */}
              {depotViewMode === 'table' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9.5px] border-b border-slate-200/80 dark:border-slate-800/80">
                      <tr>
                        <th className="p-3">{lang === 'fr' ? 'Dépôt Régional' : 'المستودع الإقليمي'}</th>
                        <th className="p-3 text-center">{lang === 'fr' ? 'Total Appareils' : 'إجمالي الأجهزة'}</th>
                        <th className="p-3 text-center">{lang === 'fr' ? 'En Service (Commerces)' : 'في الخدمة (متاجر)'}</th>
                        <th className="p-3 text-center">{lang === 'fr' ? 'En Stock (Dépôt)' : 'في المخزون (مستودع)'}</th>
                        <th className="p-3 text-center">{lang === 'fr' ? 'En Atelier / Maintenance' : 'في الصيانة (ورشة)'}</th>
                        <th className="p-3 text-center">{lang === 'fr' ? 'Taux d\'Utilisation' : 'معدل الاستخدام'}</th>
                        <th className="p-3 text-right">{lang === 'fr' ? 'Filtre' : 'الفرز'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-medium text-slate-700 dark:text-slate-200">
                      {/* All depots summarized row */}
                      <tr
                        onClick={() => { setSelectedStatsDepot('all'); playBip(900, 0.05); }}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors ${
                          selectedStatsDepot === 'all' ? 'bg-sky-500/5 dark:bg-sky-500/10' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                          <Globe className="h-4 w-4 shrink-0" />
                          <span>{lang === 'fr' ? 'Tous les Dépôts Réunis' : 'جميع الفروع مجتمعة'}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900 dark:text-white text-sm">
                          {fridges.length}
                        </td>
                        <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {fridges.filter(f => f.status === 'service').length}
                        </td>
                        <td className="p-3 text-center font-mono text-sky-600 dark:text-sky-400 font-bold">
                          {fridges.filter(f => f.status === 'stock').length}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {fridges.filter(f => f.status === 'maintenance').length}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{ width: `${Math.round((fridges.filter(f => f.status === 'service').length / fridges.length) * 100) || 0}%` }}
                                className="bg-emerald-500 h-full rounded-full"
                              />
                            </div>
                            <span className="font-mono font-bold text-[10px]">
                              {Math.round((fridges.filter(f => f.status === 'service').length / fridges.length) * 100) || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                            selectedStatsDepot === 'all' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {selectedStatsDepot === 'all' ? (lang === 'fr' ? 'Actif' : 'نشط') : (lang === 'fr' ? 'Activer' : 'تفعيل')}
                          </span>
                        </td>
                      </tr>

                      {regionalDepots.map(depot => {
                        const depotFridges = fridges.filter(f => f.depot.toLowerCase() === depot.toLowerCase());
                        const total = depotFridges.length;
                        const service = depotFridges.filter(f => f.status === 'service').length;
                        const stock = depotFridges.filter(f => f.status === 'stock').length;
                        const maint = depotFridges.filter(f => f.status === 'maintenance').length;
                        const isSelected = selectedStatsDepot.toLowerCase() === depot.toLowerCase();
                        const usageRatio = total > 0 ? Math.round((service / total) * 100) : 0;

                        return (
                          <tr
                            key={depot}
                            onClick={() => { setSelectedStatsDepot(isSelected ? 'all' : depot); playBip(900, 0.05); }}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors ${
                              isSelected ? 'bg-sky-500/5 dark:bg-sky-500/10' : ''
                            }`}
                          >
                            <td className="p-3 font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                              <Warehouse className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>{depot}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-black text-slate-800 dark:text-white">
                              {total}
                            </td>
                            <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                              {service}
                            </td>
                            <td className="p-3 text-center font-mono text-sky-600 dark:text-sky-400">
                              {stock}
                            </td>
                            <td className="p-3 text-center font-mono text-amber-500 dark:text-amber-400">
                              {maint}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div style={{ width: `${usageRatio}%` }} className="bg-emerald-500 h-full rounded-full" />
                                </div>
                                <span className="font-mono font-bold text-[10px]">{usageRatio}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                                isSelected ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {isSelected ? (lang === 'fr' ? 'Actif' : 'نشط') : (lang === 'fr' ? 'Filtrer' : 'تصفية')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Filter and search bar */}
            <div className="flex flex-col space-y-3">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Category filter pills (AP: 300L, AG: 400L, AS: 500L) */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl space-x-1 overflow-x-auto">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryFilter === 'all' 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {lang === 'fr' ? 'Toutes Catégories' : 'جميع الأصناف'}
                  </button>
                  <button
                    onClick={() => setCategoryFilter('AP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      categoryFilter === 'AP' 
                        ? 'bg-sky-600 text-white shadow-sm' 
                        : 'text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-300" />
                    {lang === 'fr' ? 'AP : 300 L (Coffre)' : 'صنف AP : 300L (صندوق)'}
                  </button>
                  <button
                    onClick={() => setCategoryFilter('AG')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      categoryFilter === 'AG' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                    {lang === 'fr' ? 'AG : 400 L (Coffre)' : 'صنف AG : 400L (صندوق)'}
                  </button>
                  <button
                    onClick={() => setCategoryFilter('AS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      categoryFilter === 'AS' 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-300" />
                    {lang === 'fr' ? 'AS : 500 L (Coffre)' : 'صنف AS : 500L (صندوق)'}
                  </button>
                </div>

                {/* Status filter pills */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl space-x-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'all' 
                        ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {lang === 'fr' ? 'Tous Équipements' : 'كل الحالات'}
                  </button>
                  <button
                    onClick={() => setStatusFilter('stock')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'stock' 
                        ? 'bg-sky-500 text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {lang === 'fr' ? 'Stock' : 'المستودع'}
                  </button>
                  <button
                    onClick={() => setStatusFilter('service')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'service' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {lang === 'fr' ? 'En Service' : 'في الخدمة'}
                  </button>
                  <button
                    onClick={() => setStatusFilter('maintenance')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'maintenance' 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {lang === 'fr' ? 'Maintenance' : 'الصيانة'}
                  </button>
                </div>

                {/* Search field and Add button */}
                <div className="flex items-center gap-2 flex-1 md:max-w-xs">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === 'fr' ? "N° série, client, dépôt..." : "ابحث برقم السلسلة، العميل..."}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  
                  <button
                    onClick={() => { setShowAddForm(!showAddForm); setAddFridgeError(null); playBip(850, 0.08); }}
                    className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Ajouter un Réfrigérateur"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{lang === 'fr' ? 'Nouveau' : 'جديد'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* ADD FRIDGE COLLAPSIBLE FORM */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleRegisterFridge}
                  className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 overflow-hidden text-xs"
                >
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-sky-500" />
                    {t.addFridge}
                  </h3>

                  {addFridgeError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs">
                      {addFridgeError}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.serial} (6 chiffres)</label>
                      <input 
                        type="text"
                        required
                        placeholder="750912"
                        value={newSerial}
                        onChange={(e) => setNewSerial(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.type}</label>
                      <select 
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      >
                        <option value="AP">صنف AP : 300 L - ثلاجة أفقية (Coffre Horizontal Zahi)</option>
                        <option value="AG">صنف AG : 400 L - ثلاجة أفقية (Coffre Horizontal Zahi)</option>
                        <option value="AS">صنف AS : 500 L - ثلاجة أفقية (Coffre Horizontal Zahi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.status}</label>
                      <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      >
                        <option value="stock">{t.inStock}</option>
                        <option value="service">{t.inService}</option>
                        <option value="maintenance">{t.maintenance}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.location} régional</label>
                      <select 
                        value={newDepot}
                        onChange={(e) => setNewDepot(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      >
                        {['Casablanca', 'Marrakech', 'Oujda', 'Tanger', 'Meknès', 'Agadir', 'Safi', 'Berrechid'].map(d => (
                          <option key={d} value={d}>Dépôt {d}</option>
                        ))}
                      </select>
                    </div>
                    
                    {newStatus === 'service' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.clientName}</label>
                        <input 
                          type="text"
                          required
                          placeholder="Ex: Epicerie Nour Casa"
                          value={newClient}
                          onChange={(e) => setNewClient(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.assignDriver}</label>
                      <select 
                        value={newDriver}
                        onChange={(e) => setNewDriver(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                      >
                        <option value="">-- {lang === 'fr' ? 'Laisser non-assigné' : 'غير معين'} --</option>
                        {driversList.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setShowAddForm(false); setAddFridgeError(null); }}
                      className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-all shadow"
                    >
                      {t.add}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* REFRIGERATORS GRID WITH FRAMER MOTION ANIMATION */}
            {filteredFridges.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Snowflake className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400 font-medium mt-2">{t.noFridges}</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredFridges.map(f => {
                    const isSelected = selectedFridgeId === f.id;
                    const isAP = f.type === 'chest' || f.type === 'AP';
                    const isAS = f.type === 'AS';

                    return (
                      <motion.div
                        key={f.id}
                        layoutId={f.id}
                        onClick={() => { setSelectedFridgeId(f.id); playBip(700, 0.04); }}
                        whileHover={{ y: -2 }}
                        className={`p-4 rounded-2xl border cursor-pointer relative overflow-hidden transition-all flex flex-col justify-between gap-3 ${
                          isSelected 
                            ? 'bg-gradient-to-b from-sky-50/90 via-white to-sky-50/30 dark:from-slate-800 dark:to-slate-900 border-sky-500 shadow-lg ring-2 ring-sky-500/30' 
                            : 'bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* TOP BADGES ROW */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          {/* Category Badge with Volume (300L / 400L / 500L) */}
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black font-mono border flex items-center gap-1 ${
                              isAP 
                                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' 
                                : isAS
                                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              <Snowflake className="h-3 w-3" />
                              {isAP ? 'AP : 300 L' : isAS ? 'AS : 500 L' : 'AG : 400 L'}
                            </span>
                            
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">
                              (Coffre)
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            f.status === 'service' 
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                              : f.status === 'stock'
                                ? 'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50'
                                : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              f.status === 'service' ? 'bg-emerald-500 animate-pulse' : f.status === 'stock' ? 'bg-sky-500' : 'bg-amber-500 animate-ping'
                            }`} />
                            {f.status === 'service' ? (lang === 'fr' ? 'En Service' : 'في الخدمة') : f.status === 'stock' ? (lang === 'fr' ? 'Dépôt' : 'في المستودع') : (lang === 'fr' ? 'Maintenance' : 'صيانة')}
                          </span>
                        </div>

                        {/* CARD BODY CONTENT */}
                        <div className="flex gap-3.5 items-center">
                          
                          {/* Fridge Visual Representation with ZAHI GLACES Logo */}
                          <div className="h-22 w-16 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex-shrink-0 flex items-center justify-center relative shadow-inner overflow-hidden">
                            <FreezerVector type={f.type} className="h-full w-full" />
                          </div>

                          {/* Info & Metrics */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Serial Number & Location */}
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight truncate">
                                  {f.serialNumber}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono font-bold shrink-0">
                                  {f.id}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 dark:text-slate-200 font-bold truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                {f.status === 'service' ? (f.client || 'Client Commerce Zahi') : `Dépôt ${f.depot}`}
                              </p>
                            </div>

                            {/* Metrics Row: PDF, Stock, GPS */}
                            <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[10px]">
                              {/* PDF Action */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateFridgePdfReport(f);
                                  playBip(900, 0.05);
                                }}
                                className="flex flex-col items-center justify-center text-center hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg p-1 transition-all cursor-pointer group active:scale-95"
                                title="Télécharger Rapport PDF (Design 2026)"
                              >
                                <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-0.5 group-hover:text-red-500">
                                  <FileText className="h-2.5 w-2.5 text-red-500" />
                                  PDF
                                </span>
                                <span className="font-mono font-black text-[10px] text-red-600 dark:text-red-400 uppercase">
                                  Rapport
                                </span>
                              </button>

                              {/* Stock Level */}
                              <div className="flex flex-col items-center justify-center text-center border-x border-slate-200 dark:border-slate-800 px-1">
                                <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-0.5">
                                  <Activity className="h-2.5 w-2.5 text-emerald-500" />
                                  Stock
                                </span>
                                <span className="font-mono font-black text-[11px] text-emerald-600 dark:text-emerald-400">
                                  {f.fillLevel ?? 85}%
                                </span>
                              </div>

                              {/* GPS Action */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFridgeId(f.id);
                                  setActiveSubTab('geoloc');
                                  playBip(900, 0.05);
                                }}
                                className="flex flex-col items-center justify-center text-center hover:bg-sky-500/10 dark:hover:bg-sky-500/20 rounded-lg p-1 transition-all cursor-pointer group active:scale-95"
                                title="Géolocaliser sur la carte OpenStreetMap"
                              >
                                <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-0.5 group-hover:text-sky-500">
                                  <MapPin className="h-2.5 w-2.5 text-sky-500" />
                                  GPS
                                </span>
                                <span className="font-mono font-black text-[10px] text-sky-600 dark:text-sky-400 uppercase truncate max-w-[65px]">
                                  {f.gps?.city || 'Localiser'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* CARD FOOTER & QUICK ACTIONS */}
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between gap-2 text-[10px]">
                          {/* Driver info */}
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[70%]">
                            <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {f.driverId ? (
                                <b className="text-slate-700 dark:text-slate-200">
                                  {driversList.find(d => d.id === f.driverId)?.name.split(' (')[0] || 'Chauffeur Zahi'}
                                </b>
                              ) : (
                                <span className="italic text-slate-400">{lang === 'fr' ? 'Non assigné' : 'غير معين'}</span>
                              )}
                            </span>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFridge(f.id, e)}
                            className="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all font-bold shrink-0 cursor-pointer active:scale-95"
                            title={lang === 'fr' ? "Supprimer le réfrigérateur" : "حذف الثلاجة"}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            <span>{lang === 'fr' ? 'Supprimer' : 'حذف'}</span>
                          </button>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

          </div>

          {/* Detailed IoT Control Panel (right 1 col) */}
          <div className="space-y-4">
            {activeFridge ? (
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 sticky top-6 space-y-4">
                
                {/* Visual Status Header */}
                <div className="text-center space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="h-20 w-14 rounded-xl bg-white dark:bg-slate-900 border p-0 mx-auto flex items-center justify-center shadow-inner relative overflow-hidden">
                    {activeFridge.customImage ? (
                      <img 
                        src={activeFridge.customImage} 
                        alt="Active Freezer" 
                        referrerPolicy="no-referrer"
                        className="h-full object-contain max-w-full p-1 drop-shadow"
                      />
                    ) : (imageErrors['active-' + activeFridge.id] || imageErrors[activeFridge.id]) ? (
                      <FreezerVector type={activeFridge.type} className="h-full w-full" />
                    ) : (
                      <img 
                        src={activeFridge.type === 'chest' ? '/assets/input_file_0.png' : '/assets/input_file_1.png'} 
                        alt="Active Freezer" 
                        referrerPolicy="no-referrer"
                        className="h-full object-contain max-w-full p-1 drop-shadow"
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, ['active-' + activeFridge.id]: true }));
                        }}
                      />
                    )}
                    
                    {/* Pulsing indicator of active link */}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-mono font-black text-slate-800 dark:text-white text-sm">{activeFridge.serialNumber}</h4>
                    <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase">
                      {activeFridge.type === 'AS' 
                        ? 'Catégorie AS (Coffre Horizontal 500 L)' 
                        : (activeFridge.type === 'chest' || activeFridge.type === 'AP') 
                          ? 'Catégorie AP (Coffre Horizontal 300 L)' 
                          : 'Catégorie AG (Coffre Horizontal 400 L)'}
                    </p>
                  </div>

                  {/* Smart Image Upload Input */}
                  <div className="pt-1 flex justify-center">
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-all select-none">
                      <Camera className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
                      {isUploadingImage ? t.uploading : t.uploadPhoto}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, activeFridge.id)} 
                        className="hidden" 
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Digital IoT Status Display */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Statut de l'Appareil</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold rounded-full">
                      Capteur IoT Connecté
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-0.5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Stock Glaces</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white text-sm">{activeFridge.fillLevel}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        generateFridgePdfReport(activeFridge, lang);
                        playBip(900, 0.05);
                      }}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl space-y-0.5 text-left transition-all cursor-pointer group active:scale-95 border border-transparent hover:border-sky-500/25 flex flex-col justify-center"
                      title={lang === 'fr' ? "Télécharger le rapport PDF" : "تحميل تقرير PDF"}
                    >
                      <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        <FileText className="h-2.5 w-2.5 text-red-500" />
                        Rapport
                      </span>
                      <span className="font-sans font-black text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs block leading-tight truncate">
                        Dépôt {activeFridge.depot}
                      </span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Affectation</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {activeFridge.status === 'service' ? activeFridge.client : `Dépôt ${activeFridge.depot}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Catégorie</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {activeFridge.type === 'chest' || activeFridge.type === 'AP' 
                          ? 'Congélateur AP (Coffre)' 
                          : activeFridge.type === 'AS' 
                            ? 'Congélateur AS (Coffre)' 
                            : 'Congélateur AG (Coffre)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical data table */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-400 font-medium">
                  <div className="flex justify-between">
                    <span>{t.lastService}</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">{activeFridge.lastServiceDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.driverName}</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {driversList.find(d => d.id === activeFridge.driverId)?.name.split(' (')[0] || t.unassigned}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed text-slate-400">
                <p className="text-xs">{lang === 'fr' ? 'Sélectionnez un appareil pour voir ses capteurs.' : 'اختر ثلاجة لعرض حساساتها.'}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB: MAINTENANCE ET ENTRETIEN DU PARC REFRIGERATEURS */}
      {activeSubTab === 'maintenance' && (
        <div className="p-6 space-y-6 w-full max-w-full">
          
          {(() => {
            const totalInterventions = maintenances.length;
            const inProgressCount = maintenances.filter(m => m.status === 'En cours').length;
            const scheduledCount = maintenances.filter(m => m.status === 'Programmé').length;
            const completedCount = maintenances.filter(m => m.status === 'Terminé').length;
            const totalCostMad = maintenances.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

            const filteredMaintenances = maintenances.filter(m => {
              if (maintenanceFilter !== 'all' && m.status !== maintenanceFilter) return false;
              if (maintenanceTypeFilter !== 'all' && m.type !== maintenanceTypeFilter) return false;
              if (maintenanceSearch.trim()) {
                const q = maintenanceSearch.trim().toLowerCase();
                const match = (m.serialNumber || '').toLowerCase().includes(q) ||
                              (m.technician || '').toLowerCase().includes(q) ||
                              (m.description || '').toLowerCase().includes(q) ||
                              (m.location || '').toLowerCase().includes(q) ||
                              (m.type || '').toLowerCase().includes(q);
                if (!match) return false;
              }
              return true;
            });

            const isFilterActive = maintenanceFilter !== 'all' || maintenanceTypeFilter !== 'all' || maintenanceSearch.trim() !== '';

            return (
              <>
                {/* 1. HEADER BANNER */}
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-orange-500/10 p-5 rounded-3xl border border-amber-200/70 dark:border-amber-900/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20">
                      <Wrench className="h-6 w-6 text-slate-950" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        {lang === 'fr' 
                          ? 'Gestion & Suivi de la Maintenance Technique' 
                          : 'إدارة ومتابعة الصيانة التقنية للثلاجات'}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                          {filteredMaintenances.length} / {totalInterventions}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {lang === 'fr'
                          ? 'Suivi des révisions, interventions curatives/préventives et maîtrise des coûts du parc frigorifique.'
                          : 'متابعة الفحوصات الدورية، التدخلات التصحيحية والوقائية وضبط تكاليف صيانة أسطول التبريد.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isFilterActive && (
                      <button
                        onClick={() => {
                          setMaintenanceFilter('all');
                          setMaintenanceTypeFilter('all');
                          setMaintenanceSearch('');
                          playBip(600, 0.05);
                        }}
                        className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold uppercase flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{lang === 'fr' ? 'Réinitialiser' : 'إعادة تعيين'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setShowAddMaintenanceModal(true); playBip(850, 0.06); }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 uppercase tracking-wider"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                      <span>{lang === 'fr' ? 'Nouvelle Intervention' : 'إضافة عملية صيانة'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. KPI METRICS RIBBON */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Total */}
                  <div
                    onClick={() => { setMaintenanceFilter('all'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      maintenanceFilter === 'all'
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Total Interventions' : 'إجمالي العمليات'}
                      </span>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Wrench className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
                      {totalInterventions}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Toutes catégories' : 'كافة السجلات المسجلة'}
                    </div>
                  </div>

                  {/* En cours */}
                  <div
                    onClick={() => { setMaintenanceFilter(maintenanceFilter === 'En cours' ? 'all' : 'En cours'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      maintenanceFilter === 'En cours'
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'En Cours d\'Atelier' : 'قيد الصيانة والتصليح'}
                      </span>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Activity className="h-4 w-4 animate-pulse" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                      {inProgressCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Interventions actives' : 'تدخلات نشطة حالياً'}
                    </div>
                  </div>

                  {/* Programmé */}
                  <div
                    onClick={() => { setMaintenanceFilter(maintenanceFilter === 'Programmé' ? 'all' : 'Programmé'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      maintenanceFilter === 'Programmé'
                        ? 'bg-sky-500/10 border-sky-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-sky-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Programmées' : 'عمليات مبرمجة'}
                      </span>
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400 font-mono tracking-tight">
                      {scheduledCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'À planifier / À venir' : 'مجدولة للمستقبل'}
                    </div>
                  </div>

                  {/* Terminé */}
                  <div
                    onClick={() => { setMaintenanceFilter(maintenanceFilter === 'Terminé' ? 'all' : 'Terminé'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      maintenanceFilter === 'Terminé'
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Terminées & Validées' : 'عمليات منتهية ومؤكدة'}
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                      {completedCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Appareils rétablis' : 'أجهزة تم إصلاحها'}
                    </div>
                  </div>

                  {/* Coût Total */}
                  <div className="p-4 rounded-2xl border bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Coût Total' : 'إجمالي التكاليف'}
                      </span>
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-xl font-black text-slate-800 dark:text-white font-mono tracking-tight truncate">
                      {totalCostMad.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-bold">MAD</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Factures et pièces' : 'قطع الغيار والخدمات'}
                    </div>
                  </div>
                </div>

                {/* 3. CONTROLS & FILTER TOOLBAR */}
                <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    
                    {/* Left: Status Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                      {[
                        { id: 'all', labelFr: 'Toutes', labelAr: 'الكل', count: totalInterventions },
                        { id: 'En cours', labelFr: 'En cours', labelAr: 'قيد التنفيذ', count: inProgressCount },
                        { id: 'Programmé', labelFr: 'Programmées', labelAr: 'مبرمجة', count: scheduledCount },
                        { id: 'Terminé', labelFr: 'Terminées', labelAr: 'منتهية', count: completedCount }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => { setMaintenanceFilter(tab.id as any); playBip(750, 0.04); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            maintenanceFilter === tab.id
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <span>{lang === 'fr' ? tab.labelFr : tab.labelAr}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                            maintenanceFilter === tab.id
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black'
                              : 'bg-slate-200/60 dark:bg-slate-800/80 text-slate-500'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Middle: Type filter dropdown */}
                    <div className="flex-1 max-w-xs">
                      <select
                        value={maintenanceTypeFilter}
                        onChange={(e) => { setMaintenanceTypeFilter(e.target.value); playBip(700, 0.04); }}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl focus:border-amber-500 outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-bold shadow-sm"
                      >
                        <option value="all">{lang === 'fr' ? 'Tous les types d\'intervention' : 'كافة أنواع التدخلات'}</option>
                        <option value="Préventive">{lang === 'fr' ? 'Préventive' : 'وقائية'}</option>
                        <option value="Curative">{lang === 'fr' ? 'Curative' : 'تصحيحية / إصلاح'}</option>
                        <option value="Recharge Gaz">{lang === 'fr' ? 'Recharge Gaz Fréon' : 'شحن غاز التبريد'}</option>
                        <option value="Remplacement Pièces">{lang === 'fr' ? 'Remplacement Pièces' : 'تبديل قطع الغيار'}</option>
                        <option value="Nettoyage & Diagnostic">{lang === 'fr' ? 'Nettoyage & Diagnostic' : 'تنظيف وفحص شامل'}</option>
                      </select>
                    </div>

                    {/* Right: Search input & View switcher */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={maintenanceSearch}
                          onChange={(e) => setMaintenanceSearch(e.target.value)}
                          placeholder={lang === 'fr' ? 'Rechercher S/N, technicien...' : 'ابحث برقم التسلسل، الفني...'}
                          className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 font-bold shadow-sm"
                        />
                        {maintenanceSearch && (
                          <button
                            onClick={() => setMaintenanceSearch('')}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* View switcher */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => { setMaintenanceViewMode('table'); playBip(600, 0.04); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            maintenanceViewMode === 'table'
                              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <List className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{lang === 'fr' ? 'Tableau' : 'جدول'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMaintenanceViewMode('cards'); playBip(600, 0.04); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            maintenanceViewMode === 'cards'
                              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{lang === 'fr' ? 'Cartes' : 'بطاقات'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. MAINTENANCE DISPLAY (Table vs Cards) */}
                <AnimatePresence mode="popLayout">
                  {filteredMaintenances.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-slate-850 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3"
                    >
                      <Wrench className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto animate-pulse" />
                      <h4 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase">
                        {lang === 'fr' ? 'Aucune intervention correspondante trouvée' : 'لم يتم العثور على أي عمليات صيانة مطابقة'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {lang === 'fr'
                          ? 'Modifiez vos critères de recherche ou réinitialisez les filtres pour afficher l\'ensemble des interventions.'
                          : 'يرجى تعديل معايير البحث أو إلغاء تفعيل الفلاتر لعرض كافة عمليات الصيانة.'}
                      </p>
                      {isFilterActive && (
                        <button
                          onClick={() => {
                            setMaintenanceFilter('all');
                            setMaintenanceTypeFilter('all');
                            setMaintenanceSearch('');
                            playBip(600, 0.05);
                          }}
                          className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase"
                        >
                          {lang === 'fr' ? 'Réinitialiser Tous les Filtres' : 'إعادة ضبط كافة الفلاتر'}
                        </button>
                      )}
                    </motion.div>
                  ) : maintenanceViewMode === 'table' ? (

                    /* ===== TABLE VIEW ===== */
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              <th className="p-3.5">{lang === 'fr' ? 'Réfrigérateur' : 'الثلاجة (S/N)'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Type Intervention' : 'نوع التدخل'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Emplacement / Dépôt' : 'الموقع / المستودع'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Technicien' : 'الفني المسؤول'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Description & Travaux' : 'تفاصيل العمل'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Coût (MAD)' : 'التكلفة'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Statut' : 'الحالة'}</th>
                              <th className="p-3.5 text-right">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {filteredMaintenances.map(m => (
                              <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                                      <Snowflake className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <span className="font-mono font-black text-slate-900 dark:text-white block text-xs">
                                        {m.serialNumber}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono block">
                                        {m.date}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-block ${
                                    m.type === 'Préventive' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' :
                                    m.type === 'Curative' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' :
                                    m.type === 'Recharge Gaz' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' :
                                    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {m.type}
                                  </span>
                                </td>

                                <td className="p-3.5 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                                  {m.location}
                                </td>

                                <td className="p-3.5 text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                                  {m.technician}
                                </td>

                                <td className="p-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate font-normal">
                                  {m.description}
                                </td>

                                <td className="p-3.5 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                                  {m.cost.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">MAD</span>
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                                    m.status === 'Terminé'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                      : m.status === 'En cours'
                                        ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                        : 'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
                                  }`}>
                                    {m.status}
                                  </span>
                                </td>

                                <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                                  {m.status !== 'Terminé' && (
                                    <button
                                      onClick={() => {
                                        setMaintenances(prev => prev.map(item => item.id === m.id ? { ...item, status: 'Terminé' } : item));
                                        setFridges(prev => prev.map(f => f.id === m.refrigeratorId ? { ...f, status: 'service' } : f));
                                        playBip(1100, 0.05);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg transition-all shadow-sm cursor-pointer uppercase"
                                      title={lang === 'fr' ? 'Valider la fin de maintenance' : 'تأكيد انتهاء الصيانة'}
                                    >
                                      {lang === 'fr' ? 'Valider Fin' : 'تأكيد'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setMaintenances(prev => prev.filter(item => item.id !== m.id));
                                      playBip(600, 0.05);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                    title={lang === 'fr' ? 'Supprimer la fiche' : 'حذف السجل'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  ) : (

                    /* ===== CARDS VIEW ===== */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                      {filteredMaintenances.map((m, index) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.3) }}
                          className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-4 group"
                        >
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                                <Snowflake className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-mono font-black text-slate-900 dark:text-white text-sm block">
                                  {m.serialNumber}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {m.date}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              m.status === 'Terminé'
                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : m.status === 'En cours'
                                  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                  : 'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
                            }`}>
                              {m.status}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                {lang === 'fr' ? 'Type d\'intervention :' : 'النوع :'}
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {m.type}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                {lang === 'fr' ? 'Emplacement :' : 'الموقع :'}
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {m.location}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">
                                {lang === 'fr' ? 'Technicien :' : 'الفني :'}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-white">
                                {m.technician}
                              </span>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                              {m.description}
                            </div>
                          </div>

                          {/* Card Bottom: Cost & Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">
                                {lang === 'fr' ? 'Coût Intervention' : 'التكلفة'}
                              </span>
                              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                                {m.cost.toLocaleString()} MAD
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {m.status !== 'Terminé' && (
                                <button
                                  onClick={() => {
                                    setMaintenances(prev => prev.map(item => item.id === m.id ? { ...item, status: 'Terminé' } : item));
                                    setFridges(prev => prev.map(f => f.id === m.refrigeratorId ? { ...f, status: 'service' } : f));
                                    playBip(1100, 0.05);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl transition-all shadow-sm cursor-pointer uppercase"
                                >
                                  {lang === 'fr' ? 'Valider Fin' : 'تأكيد'}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setMaintenances(prev => prev.filter(item => item.id !== m.id));
                                  playBip(600, 0.05);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {/* 5. MODAL: AJOUTER INTERVENTION */}
                <AnimatePresence>
                  {showAddMaintenanceModal && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-base">
                            <Wrench className="h-5 w-5 text-amber-500" />
                            {lang === 'fr' ? 'Programmer une Intervention Maintenance' : 'إضافة وتوثيق عملية صيانة جديدة'}
                          </h3>
                          <button 
                            onClick={() => setShowAddMaintenanceModal(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const selectedFridge = fridges.find(f => f.id === newMaintenanceForm.refrigeratorId);
                            const newRec: MaintenanceRecord = {
                              id: `MNT-2026-${String(maintenances.length + 1).padStart(3, '0')}`,
                              refrigeratorId: newMaintenanceForm.refrigeratorId,
                              serialNumber: selectedFridge?.serialNumber || 'ZAHI-REF',
                              date: new Date().toISOString().split('T')[0],
                              type: newMaintenanceForm.type,
                              technician: newMaintenanceForm.technician || 'Technicien Zahi',
                              description: newMaintenanceForm.description || 'Intervention technique de révision',
                              cost: Number(newMaintenanceForm.cost) || 0,
                              status: newMaintenanceForm.status,
                              nextDueDate: newMaintenanceForm.nextDueDate,
                              location: selectedFridge ? (selectedFridge.status === 'service' ? (selectedFridge.client || selectedFridge.depot) : `Dépôt ${selectedFridge.depot}`) : 'Casablanca'
                            };

                            setMaintenances(prev => [newRec, ...prev]);

                            if (newMaintenanceForm.status === 'En cours') {
                              setFridges(prev => prev.map(f => f.id === newMaintenanceForm.refrigeratorId ? { ...f, status: 'maintenance' } : f));
                            }

                            setShowAddMaintenanceModal(false);
                            playBip(950, 0.08);
                          }}
                          className="space-y-4 text-xs"
                        >
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              {lang === 'fr' ? 'Sélectionner le Réfrigérateur' : 'اختر الثلاجة المعنية'}
                            </label>
                            <select
                              value={newMaintenanceForm.refrigeratorId}
                              onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, refrigeratorId: e.target.value }))}
                              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 dark:text-white font-bold"
                            >
                              {fridges.map(f => (
                                <option key={f.id} value={f.id}>
                                  {f.serialNumber} — {f.client || `Dépôt ${f.depot}`} ({f.status})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {lang === 'fr' ? 'Type d\'Intervention' : 'نوع التدخل'}
                              </label>
                              <select
                                value={newMaintenanceForm.type}
                                onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, type: e.target.value as any }))}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 dark:text-white font-bold"
                              >
                                <option value="Préventive">{lang === 'fr' ? 'Préventive' : 'وقائية'}</option>
                                <option value="Curative">{lang === 'fr' ? 'Curative' : 'تصحيحية / إصلاح'}</option>
                                <option value="Recharge Gaz">{lang === 'fr' ? 'Recharge Gaz Fréon' : 'شحن غاز التبريد'}</option>
                                <option value="Remplacement Pièces">{lang === 'fr' ? 'Remplacement Pièces' : 'تبديل قطع الغيار'}</option>
                                <option value="Nettoyage & Diagnostic">{lang === 'fr' ? 'Nettoyage & Diagnostic' : 'تنظيف وفحص شامل'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {lang === 'fr' ? 'Statut Initial' : 'الحالة الأولية'}
                              </label>
                              <select
                                value={newMaintenanceForm.status}
                                onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, status: e.target.value as any }))}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 dark:text-white font-bold"
                              >
                                <option value="En cours">{lang === 'fr' ? 'En cours (Atelier)' : 'قيد الصيانة'}</option>
                                <option value="Programmé">{lang === 'fr' ? 'Programmé' : 'مبرمجة'}</option>
                                <option value="Terminé">{lang === 'fr' ? 'Terminé' : 'منتهية'}</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {lang === 'fr' ? 'Nom du Technicien' : 'اسم الفني المسؤول'}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Kamal Mansouri"
                                value={newMaintenanceForm.technician}
                                onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, technician: e.target.value }))}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 dark:text-white font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {lang === 'fr' ? 'Coût Estimé (MAD)' : 'التكلفة المقدرة (درهم)'}
                              </label>
                              <input
                                type="number"
                                required
                                value={newMaintenanceForm.cost}
                                onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 dark:text-white font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              {lang === 'fr' ? 'Description & Travaux Effectués' : 'وصف التدخل والأعمال المنجزة'}
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder={lang === 'fr' ? "Précisez les pièces remplacées, pressions de gaz..." : "اذكر القطع المستبدلة، ضغط الغاز..."}
                              value={newMaintenanceForm.description}
                              onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-850 dark:text-white resize-none font-medium"
                            />
                          </div>

                          <div className="pt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddMaintenanceModal(false)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase text-xs"
                            >
                              {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md uppercase text-xs cursor-pointer"
                            >
                              {lang === 'fr' ? 'Enregistrer L\'Intervention' : 'حفظ عملية الصيانة'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            );
          })()}

        </div>
      )}

      {/* SUB-TAB: GEOLOCALISATION GPS SUR CARTE DU MAROC */}
      {activeSubTab === 'geoloc' && (
        <div className="p-6 space-y-6 w-full max-w-full">
          
          {(() => {
            const totalGeolocated = fridges.length;
            const inServiceCount = fridges.filter(f => f.status === 'service').length;
            const inStockCount = fridges.filter(f => f.status === 'stock').length;
            const inMaintenanceCount = fridges.filter(f => f.status === 'maintenance').length;
            const alertCount = fridges.filter(f => f.isLocationAlert).length;
            const citiesCovered = Array.from(new Set(fridges.map(f => f.depot))).length;

            const isFilterActive = geolocSelectedCity !== 'all' || geolocFilterStatus !== 'all' || geolocSearchTerm.trim() !== '';

            return (
              <>
                {/* 1. HEADER BANNER */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/15 dark:via-teal-500/10 p-5 rounded-3xl border border-emerald-200/70 dark:border-emerald-900/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        {lang === 'fr' 
                          ? 'Supervision Cartographique & Télémétrie GPS' 
                          : 'المراقبة الجغرافية والتتبع المباشر لأسطول الثلاجات'}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          {totalGeolocated} {lang === 'fr' ? 'Appareils' : 'ثلاجة'}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {lang === 'fr'
                          ? 'Localisation GPS en temps réel sur carte Leaflet interactive, contrôle de périmètre et couverture nationale.'
                          : 'تحديد المواقع المباشر، خريطة تفاعلية للمملكة، رصد الحركة خارج النطاق وتتبع انتشار الأجهزة في نقاط البيع.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Live GPS Telemetry Status */}
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{lang === 'fr' ? '100% Signal GPS Actif & Connecté' : 'إشارة GPS متصلة ومباشرة'}</span>
                    </div>

                    {isFilterActive && (
                      <button
                        onClick={() => {
                          setGeolocSelectedCity('all');
                          setGeolocFilterStatus('all');
                          setGeolocSearchTerm('');
                          playBip(600, 0.05);
                        }}
                        className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold uppercase flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{lang === 'fr' ? 'Réinitialiser' : 'إعادة ضبط'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. KPI METRICS RIBBON */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Flotte Géolocalisée */}
                  <div
                    onClick={() => { setGeolocSelectedCity('all'); setGeolocFilterStatus('all'); playBip(700, 0.04); }}
                    className="p-4 rounded-2xl border bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Total Géolocalisés' : 'إجمالي المتتبعة'}
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Globe className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
                      {totalGeolocated}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {citiesCovered} {lang === 'fr' ? 'Villes couvertes' : 'مدينة مغطاة بالمغرب'}
                    </div>
                  </div>

                  {/* Appareils Livrés (Chez les Clients) */}
                  <div
                    onClick={() => { setGeolocFilterStatus(geolocFilterStatus === 'service' ? 'all' : 'service'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      geolocFilterStatus === 'service'
                        ? 'bg-green-500/10 border-green-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Appareils Livrés' : 'أجهزة مسلّمة'}
                      </span>
                      <div className="p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-green-600 dark:text-green-400 font-mono tracking-tight">
                      {inServiceCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Livrés chez les clients' : 'مسلّمة ومثبتة لدى العملاء'}
                    </div>
                  </div>

                  {/* Non Livrés (En Stock Dépôts) */}
                  <div
                    onClick={() => { setGeolocFilterStatus(geolocFilterStatus === 'stock' ? 'all' : 'stock'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      geolocFilterStatus === 'stock'
                        ? 'bg-orange-500/10 border-orange-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-orange-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Non Livrés (Stock)' : 'غير مسلّمة (مستودع)'}
                      </span>
                      <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Warehouse className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400 font-mono tracking-tight">
                      {inStockCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'En réserve dans les dépôts' : 'بالمستودعات لم تسلم بعد'}
                    </div>
                  </div>

                  {/* En Maintenance */}
                  <div
                    onClick={() => { setGeolocFilterStatus(geolocFilterStatus === 'maintenance' ? 'all' : 'maintenance'); playBip(700, 0.04); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      geolocFilterStatus === 'maintenance'
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Atelier & Révision' : 'ورشة الصيانة'}
                      </span>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Wrench className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                      {inMaintenanceCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'En cours de diagnostic' : 'خاضعة للإصلاح والفحص'}
                    </div>
                  </div>

                  {/* Alertes Périmètre GPS */}
                  <div
                    onClick={() => {
                      const next = geolocFilterStatus === 'alert' ? 'all' : 'alert';
                      setGeolocFilterStatus(next);
                      setGeolocSelectedCity('all');
                      setGeolocSearchTerm('');
                      playBip(700, 0.04);
                      if (next === 'alert') {
                        let alertFridge = fridges.find(f => f.isLocationAlert);
                        if (!alertFridge) {
                          setFridges(prev => {
                            const updated = prev.map(f => {
                              if (f.id === 'REF-ZH-7503' || f.serialNumber === 'ZAHI-CF-750305') {
                                return {
                                  ...f,
                                  isLocationAlert: true,
                                  alertReason: '⚠️ Déplacement suspect hors périmètre (+3.4 km détecté)',
                                  alertTimestamp: '2026-07-22 14:15',
                                  gps: f.gps || { lat: 33.5380, lng: -7.6000, city: 'Casablanca', address: 'Bd Panoramique, Ain Chock, Casablanca' }
                                };
                              }
                              return f;
                            });
                            try {
                              localStorage.setItem('zahi_refrigerators', JSON.stringify(updated));
                            } catch {}
                            return updated;
                          });
                          setGeolocSelectedFridgeId('REF-ZH-7503');
                        } else {
                          setGeolocSelectedFridgeId(alertFridge.id);
                        }
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      geolocFilterStatus === 'alert'
                        ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
                        : alertCount > 0
                          ? 'bg-rose-500/10 border-rose-500/40 hover:border-rose-500/60 shadow-sm'
                          : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Alertes GPS' : 'تنبيهات الموقع'}
                      </span>
                      <div className={`p-2 rounded-xl ${alertCount > 0 ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-bounce' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <BellRing className="h-4 w-4" />
                      </div>
                    </div>
                    <div className={`mt-2 text-2xl font-black font-mono tracking-tight ${alertCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                      {alertCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {alertCount > 0 ? (lang === 'fr' ? 'Déplacement suspect' : 'تحرك مشبوه مسجل') : (lang === 'fr' ? 'Aucune anomalie' : 'كل الأجهزة في مواقعها')}
                    </div>
                  </div>
                </div>

                {/* 3. CONTROLS & FILTER TOOLBAR */}
                <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    
                    {/* Ville / Dépôt Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{lang === 'fr' ? 'Filtrer par Ville / Dépôt :' : 'تصفية حسب المدينة / المستودع :'}</span>
                      </label>
                      <select
                        value={geolocSelectedCity}
                        onChange={(e) => { setGeolocSelectedCity(e.target.value); playBip(700, 0.04); }}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                      >
                        <option value="all">{lang === 'fr' ? 'Toutes les villes & dépôts (Vue globale)' : 'كافة المدن والمستودعات (عرض شامل)'}</option>
                        {Object.keys(MOROCCO_CITY_COORDS).map(city => {
                          const countInCity = fridges.filter(f => f.depot === city).length;
                          return (
                            <option key={city} value={city}>
                              {city} ({countInCity} {lang === 'fr' ? 'réfrigérateurs' : 'ثلاجة'})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Statut Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{lang === 'fr' ? 'Statut Opérationnel :' : 'الحالة التشغيلية :'}</span>
                      </label>
                      <select
                        value={geolocFilterStatus}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setGeolocFilterStatus(val);
                          playBip(700, 0.04);
                          if (val === 'alert') {
                            setGeolocSelectedCity('all');
                            setGeolocSearchTerm('');
                            const alertFridge = fridges.find(f => f.isLocationAlert);
                            if (alertFridge) {
                              setGeolocSelectedFridgeId(alertFridge.id);
                            }
                          }
                        }}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
                      >
                        <option value="all">{lang === 'fr' ? 'Tous les statuts' : 'كافة الحالات'}</option>
                        <option value="service">{lang === 'fr' ? 'Livré (Chez le Client)' : 'مسلّمة (لدى العميل)'}</option>
                        <option value="stock">{lang === 'fr' ? 'Non livré (En Stock / Dépôt)' : 'غير مسلّمة (في المستودع)'}</option>
                        <option value="maintenance">{lang === 'fr' ? 'En Maintenance (Atelier R&M)' : 'في الصيانة (الورشة)'}</option>
                        <option value="alert">{lang === 'fr' ? '🚨 Alertes GPS (Hors périmètre)' : '🚨 تنبيهات الخروج من النطاق GPS'}</option>
                      </select>
                    </div>

                    {/* Real-time Search */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{lang === 'fr' ? 'Recherche Appareil (S/N, Client) :' : 'بحث مباشر (الرقم، العميل) :'}</span>
                      </label>
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={geolocSearchTerm}
                          onChange={(e) => setGeolocSearchTerm(e.target.value)}
                          placeholder={lang === 'fr' ? "N° série, client, adresse..." : "ابحث برقم التسلسل، العميل، العنوان..."}
                          className="w-full pl-9 pr-8 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold outline-none focus:border-emerald-500 shadow-sm"
                        />
                        {geolocSearchTerm && (
                          <button
                            onClick={() => setGeolocSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. INTERACTIVE MAP & TELEMETRY GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left 2 Cols: High-Tech OpenStreetMap Interactive Leaflet Map */}
                  <div className="lg:col-span-2 min-h-[520px] bg-white dark:bg-slate-850 p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-100 dark:border-slate-800 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Compass className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-black uppercase text-slate-800 dark:text-white">
                          {lang === 'fr' ? 'Carte Interactive du Maroc (Leaflet OSM)' : 'خريطة المغرب التفاعلية (OSM)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>{geolocSelectedCity === 'all' ? (lang === 'fr' ? 'Vue Nationale' : 'النطاق الوطني') : `Focus: ${geolocSelectedCity}`}</span>
                      </div>
                    </div>

                    <div className="flex-1 rounded-2xl overflow-hidden min-h-[460px]">
                      <OpenStreetMapGeoloc 
                        fridges={fridges}
                        selectedCity={geolocSelectedCity}
                        filterStatus={geolocFilterStatus}
                        searchTerm={geolocSearchTerm}
                        selectedFridgeId={geolocSelectedFridgeId}
                        onSelectFridge={(id) => {
                          setGeolocSelectedFridgeId(id);
                          playBip(800, 0.05);
                        }}
                        lang={lang}
                        moroccoCityCoords={MOROCCO_CITY_COORDS}
                      />
                    </div>
                  </div>

                  {/* Right 1 Col: Selected Fridge GPS Telemetry Details Card */}
                  <div className="space-y-4">
                    {(() => {
                      const selectedFridge = fridges.find(f => f.id === geolocSelectedFridgeId);

                      if (!selectedFridge) {
                        return (
                          <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-center shadow-sm">
                            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-inner">
                              <MapPin className="h-7 w-7 animate-bounce" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase">
                                {lang === 'fr' ? 'Sélectionnez un appareil sur la carte' : 'اختر ثلاجة من الخريطة'}
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {lang === 'fr' 
                                  ? 'Cliquez sur n\'importe quel marqueur sur la carte ou dans la liste ci-dessous pour afficher sa position GPS exacte, télémétrie et données de livraison.'
                                  : 'انقر على أي ثلاجة في الخريطة أو القائمة لعرض إحداثياتها الدقيقة، بيانات التوزيع، وتفاصيل التتبع المباشر.'}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-left text-xs">
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">{lang === 'fr' ? 'Total Flotte' : 'الأسطول'}</span>
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">{totalGeolocated}</span>
                              </div>
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">{lang === 'fr' ? 'Villes' : 'المدن'}</span>
                                <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-base">{citiesCovered}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const cityInfo = MOROCCO_CITY_COORDS[selectedFridge.depot] || MOROCCO_CITY_COORDS['Casablanca'];
                      const distanceKm = (cityInfo.lat && cityInfo.lng) ? Math.round(Math.hypot((cityInfo.lat - 33.5731) * 111, (cityInfo.lng - (-7.5898)) * 111)) : 0;

                      return (
                        <div className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm relative animate-in fade-in">
                          
                          {/* Header with Hide button */}
                          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-2xl flex items-center justify-center ${selectedFridge.isLocationAlert ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                <MapPin className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-mono font-black text-slate-900 dark:text-white text-sm">{selectedFridge.serialNumber}</h4>
                                  {selectedFridge.isLocationAlert && (
                                    <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded uppercase animate-bounce">
                                      ALERTE GPS
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] font-black rounded-full uppercase inline-block">
                                    {selectedFridge.type === 'chest' || selectedFridge.type === 'AP' ? 'Coffre / AP' : 'Vitrine / AG'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                                    selectedFridge.status === 'service' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                                    selectedFridge.status === 'stock' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400' :
                                    'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                  }`}>
                                    {selectedFridge.status === 'service' ? (lang === 'fr' ? 'Livré' : 'مسلّمة') : selectedFridge.status === 'stock' ? (lang === 'fr' ? 'Non livré' : 'غير مسلّمة') : (lang === 'fr' ? 'Maintenance' : 'صيانة')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setGeolocSelectedFridgeId(null)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title={lang === 'fr' ? 'Masquer cette fiche' : 'إخفاء'}
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>{lang === 'fr' ? 'Masquer' : 'إخفاء'}</span>
                            </button>
                          </div>

                          {/* GPS Movement Alert Action Box */}
                          {selectedFridge.isLocationAlert ? (
                            <div className="p-4 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl space-y-3">
                              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs">
                                <BellRing className="h-4 w-4 animate-bounce shrink-0" />
                                <span>{selectedFridge.alertReason || '⚠️ Déplacement suspect hors périmètre (+3.4 km détecté)'}</span>
                              </div>
                              
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2.5 text-[11px]">
                                <div>
                                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase block">
                                    📍 {lang === 'fr' ? "Emplacement d'origine / Client agréé :" : "الموقع الأصلي المعتمد للعميل :"}
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-white">
                                    {selectedFridge.client || `Dépôt Régional ${selectedFridge.depot}`} ({selectedFridge.depot})
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">
                                    🚨 {lang === 'fr' ? "Position actuelle détectée hors zone :" : "الموقع الحالي المرصود خارج النطاق :"}
                                  </span>
                                  <span className="font-bold text-rose-700 dark:text-rose-300">
                                    {selectedFridge.gps?.address || `${selectedFridge.depot}, Maroc`} (+3.4 km détecté)
                                  </span>
                                  <div className="font-mono text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    GPS: {selectedFridge.gps && typeof selectedFridge.gps.lat === 'number' && !isNaN(selectedFridge.gps.lat) 
                                      ? `${selectedFridge.gps.lat.toFixed(4)}, ${selectedFridge.gps.lng.toFixed(4)}` 
                                      : `${cityInfo?.lat ?? 33.5731}, ${cityInfo?.lng ?? -7.5898}`}
                                  </div>
                                </div>
                              </div>

                              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                <span>{lang === 'fr' ? 'Dernier signal balise : ' : 'آخر إشارة : '}{selectedFridge.alertTimestamp || '2026-07-22 14:15'}</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">Signal IoT 100%</span>
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  setFridges(prev => prev.map(f => f.id === selectedFridge.id ? { ...f, isLocationAlert: false, alertReason: undefined } : f));
                                  playBip(800, 0.05);
                                }}
                                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>{lang === 'fr' ? 'Résoudre l\'Alerte & Valider Emplacement' : 'تأكيد الموقع وإلغاء التنبيه'}</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setFridges(prev => prev.map(f => f.id === selectedFridge.id ? {
                                  ...f,
                                  isLocationAlert: true,
                                  alertReason: '⚠️ Déplacement suspect hors périmètre (+3.4 km détecté)',
                                  alertTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
                                } : f));
                                playBip(700, 0.05);
                              }}
                              className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>{lang === 'fr' ? 'Simuler Alerte Déplacement GPS' : 'تجربة تنبيه تغيير الموقع (+3.4 km)'}</span>
                            </button>
                          )}

                          {/* Technical & Operational Telemetry Grid */}
                          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">{lang === 'fr' ? 'Ville / Dépôt' : 'المدينة / المستودع'}</span>
                              <span className="font-bold text-slate-800 dark:text-white">{selectedFridge.depot}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">{lang === 'fr' ? 'Emplacement Actuel' : 'الموقع الحالي'}</span>
                              <span className="font-bold text-sky-600 dark:text-sky-400 truncate max-w-[160px]">
                                {selectedFridge.status === 'service' ? selectedFridge.client : `Dépôt ${selectedFridge.depot}`}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">{lang === 'fr' ? 'Chauffeur Attribué' : 'السائق المخصص'}</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {driversList.find(d => d.id === selectedFridge.driverId)?.name.split(' (')[0] || (lang === 'fr' ? 'Non assigné' : 'غير معين')}
                              </span>
                            </div>

                            <div className="flex justify-between font-mono">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">{lang === 'fr' ? 'Coordonnées GPS' : 'إحداثيات GPS'}</span>
                              <span className="text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                                {selectedFridge.gps && typeof selectedFridge.gps.lat === 'number' && !isNaN(selectedFridge.gps.lat) 
                                  ? `${selectedFridge.gps.lat.toFixed(4)}, ${selectedFridge.gps.lng.toFixed(4)}` 
                                  : `${cityInfo?.lat ?? 33.5731}, ${cityInfo?.lng ?? -7.5898}`}
                              </span>
                            </div>

                            <div className="flex justify-between font-mono">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">{lang === 'fr' ? 'Distance de Tit Mellil' : 'المسافة من تيط مليل'}</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {distanceKm} Km
                              </span>
                            </div>
                          </div>

                          {/* Delivery Stats Highlights */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'fr' ? 'Jours de Livraison' : 'أيام التسليم'}</span>
                              <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm">{selectedFridge.deliveryDaysCount || 64} {lang === 'fr' ? 'Jours' : 'يوم'}</span>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'fr' ? 'Quantité Livrée' : 'الكمية المسلمة'}</span>
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{(selectedFridge.totalCartonsDelivered || 612).toLocaleString()} {lang === 'fr' ? 'Cartons' : 'علبة'}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-1">
                            <button
                              type="button"
                              onClick={() => generateFridgePdfReport(selectedFridge, lang)}
                              className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 uppercase tracking-wide"
                            >
                              <Download className="h-4 w-4" />
                              <span>{lang === 'fr' ? 'Télécharger Rapport PDF (2026)' : 'تحميل تقرير PDF (2026)'}</span>
                            </button>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${selectedFridge.gps ? selectedFridge.gps.lat : cityInfo.lat},${selectedFridge.gps ? selectedFridge.gps.lng : cityInfo.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all block text-center"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>{lang === 'fr' ? 'Ouvrir dans Google Maps' : 'فتح الموقع على الخريطة'}</span>
                            </a>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* 5. FULL GEOLOCATED FLEET CARDS GRID */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span>{lang === 'fr' ? 'Liste Complète du Parc Géolocalisé' : 'قائمة الأجهزة المحددة جغرافياً'}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {fridges
                        .filter(f => geolocSelectedCity === 'all' || f.depot === geolocSelectedCity)
                        .filter(f => geolocFilterStatus === 'all' ? true : geolocFilterStatus === 'alert' ? !!f.isLocationAlert : f.status === geolocFilterStatus)
                        .filter(f => !geolocSearchTerm.trim() || f.serialNumber.toLowerCase().includes(geolocSearchTerm.toLowerCase()) || (f.client || '').toLowerCase().includes(geolocSearchTerm.toLowerCase())).length} {lang === 'fr' ? 'Appareils visibles' : 'جهاز مرئي'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fridges
                      .filter(f => geolocSelectedCity === 'all' || f.depot === geolocSelectedCity)
                      .filter(f => geolocFilterStatus === 'all' ? true : geolocFilterStatus === 'alert' ? !!f.isLocationAlert : f.status === geolocFilterStatus)
                      .filter(f => !geolocSearchTerm.trim() || f.serialNumber.toLowerCase().includes(geolocSearchTerm.toLowerCase()) || (f.client || '').toLowerCase().includes(geolocSearchTerm.toLowerCase()))
                      .map(f => {
                        const isSelected = f.id === geolocSelectedFridgeId;

                        return (
                          <div
                            key={f.id}
                            onClick={() => { setGeolocSelectedFridgeId(f.id); playBip(700, 0.04); }}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                              isSelected
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                                : 'bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-xs text-slate-900 dark:text-white">{f.serialNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                f.status === 'service' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                                f.status === 'stock' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              }`}>
                                {f.status === 'service' ? (lang === 'fr' ? 'Livré' : 'مسلّمة') : f.status === 'stock' ? (lang === 'fr' ? 'Non livré' : 'غير مسلّمة') : (lang === 'fr' ? 'Maintenance' : 'صيانة')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                              {f.status === 'service' ? (f.client || (lang === 'fr' ? 'Livré' : 'مسلّمة')) : `Dépôt ${f.depot} (${lang === 'fr' ? 'Non livré' : 'غير مسلّمة'})`}
                            </p>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                              <span>Dépôt {f.depot}</span>
                              {f.isLocationAlert ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGeolocFilterStatus('alert');
                                    setGeolocSelectedCity('all');
                                    setGeolocSelectedFridgeId(f.id);
                                    playBip(800, 0.05);
                                  }}
                                  className="text-rose-600 dark:text-rose-400 font-black animate-pulse hover:underline cursor-pointer"
                                  title={lang === 'fr' ? 'Afficher cette alerte' : 'عرض هذا التنبيه'}
                                >
                                  🚨 Alerte GPS
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  GPS Connecté
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      )}
      {activeSubTab === 'movements' && (
        <div className="p-6 space-y-6 w-full max-w-full">
          
          {/* Printable Page Inline CSS Rules for exact history printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-refrigerator-history, #printable-refrigerator-history * {
                visibility: visible !important;
              }
              #printable-refrigerator-history {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 1.5cm !important;
                box-shadow: none !important;
                background-color: white !important;
                color: black !important;
                font-family: Arial, sans-serif !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {(() => {
            // Metrics computation
            const totalMovements = movements.length;
            const uniqueFridgesCount = new Set(movements.map(m => (m.serialNumber || '').trim().toUpperCase())).size;
            const interDepotCount = movements.filter(m => {
              const from = (m.fromLocation || '').toLowerCase();
              const to = (m.toLocation || '').toLowerCase();
              return (from.includes('dépôt') && to.includes('dépôt')) || (m.fromStatus === 'stock' && m.toStatus === 'stock');
            }).length;
            const clientPlacementCount = movements.filter(m => {
              const to = (m.toLocation || '').toLowerCase();
              return m.toStatus === 'service' || (!to.includes('dépôt') && !to.includes('atelier'));
            }).length;
            const maintenanceCount = movements.filter(m => {
              const from = (m.fromLocation || '').toLowerCase();
              const to = (m.toLocation || '').toLowerCase();
              return m.toStatus === 'maintenance' || to.includes('atelier') || to.includes('maintenance') || m.fromStatus === 'maintenance' || from.includes('atelier');
            }).length;

            // Group movements by serial number to calculate accurate stay durations for each spot
            const movementsBySerial: Record<string, typeof movements> = {};
            movements.forEach(m => {
              const sn = (m.serialNumber || '').trim().toUpperCase();
              if (!movementsBySerial[sn]) movementsBySerial[sn] = [];
              movementsBySerial[sn].push(m);
            });

            const durationLookup: Record<string, { duration: string; isCurrent: boolean }> = {};
            Object.values(movementsBySerial).forEach(list => {
              const sorted = [...list].sort((a, b) => parseMovementDate(a.date).getTime() - parseMovementDate(b.date).getTime());
              sorted.forEach((m, idx) => {
                const nextM = sorted[idx + 1];
                durationLookup[m.id] = {
                  duration: calculateDuration(m.date, nextM?.date),
                  isCurrent: !nextM
                };
              });
            });

            // Filter movements according to active criteria
            let displayList = movements.filter(m => {
              const sn = (m.serialNumber || '').toUpperCase();
              const fromLoc = (m.fromLocation || '').toLowerCase();
              const toLoc = (m.toLocation || '').toLowerCase();
              const driver = (m.driverName || '').toLowerCase();
              const notes = (m.notes || '').toLowerCase();

              // Fridge serial filter
              if (selectedMvtFridgeSerial !== 'all') {
                if (!sn.includes(selectedMvtFridgeSerial.trim().toUpperCase())) return false;
              }

              // Search query
              if (mvtSearchQuery.trim()) {
                const query = mvtSearchQuery.trim().toLowerCase();
                const matches = sn.toLowerCase().includes(query) ||
                                fromLoc.includes(query) ||
                                toLoc.includes(query) ||
                                driver.includes(query) ||
                                notes.includes(query);
                if (!matches) return false;
              }

              // Movement Type filter
              if (mvtTypeFilter === 'transfer') {
                const isInterDepot = (fromLoc.includes('dépôt') && toLoc.includes('dépôt')) || (m.fromStatus === 'stock' && m.toStatus === 'stock');
                if (!isInterDepot) return false;
              } else if (mvtTypeFilter === 'client') {
                const isClient = m.toStatus === 'service' || (!toLoc.includes('dépôt') && !toLoc.includes('atelier'));
                if (!isClient) return false;
              } else if (mvtTypeFilter === 'maintenance') {
                const isMaint = m.toStatus === 'maintenance' || toLoc.includes('atelier') || toLoc.includes('maintenance') || m.fromStatus === 'maintenance';
                if (!isMaint) return false;
              }

              // Depot filter
              if (mvtDepotFilter !== 'all') {
                const dep = mvtDepotFilter.toLowerCase();
                if (!fromLoc.includes(dep) && !toLoc.includes(dep)) return false;
              }

              return true;
            });

            // If a specific fridge is selected, sort newest first
            if (selectedMvtFridgeSerial !== 'all') {
              displayList = [...displayList].sort((a, b) => parseMovementDate(b.date).getTime() - parseMovementDate(a.date).getTime());
            }

            const currentDetails = selectedMvtFridgeSerial !== 'all' 
              ? fridges.find(f => f.serialNumber.trim().toUpperCase() === selectedMvtFridgeSerial.trim().toUpperCase())
              : null;

            const isFilterActive = selectedMvtFridgeSerial !== 'all' || mvtSearchQuery !== '' || mvtTypeFilter !== 'all' || mvtDepotFilter !== 'all';

            return (
              <div className="space-y-6">
                
                {/* 1. TOP HEADER & CONTROLS BANNER */}
                <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent dark:from-sky-500/15 dark:via-indigo-500/10 p-5 rounded-3xl border border-sky-100 dark:border-sky-900/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-sky-500/20">
                      <History className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        {lang === 'fr' 
                          ? 'Historique & Traçabilité des Mouvements de Réfrigérateurs' 
                          : 'سجل وتتبع حركة وتنقلات الثلاجات'}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
                          {displayList.length} / {totalMovements}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {lang === 'fr'
                          ? 'Surveillance complète des transferts inter-dépôts, affectations clients et durées de séjour.'
                          : 'متابعة شاملة لتنقلات الأجهزة بين المستودعات ولدى العملاء مع احتساب دقيق لمدد الإقامة.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Reset all filters button */}
                    {isFilterActive && (
                      <button
                        onClick={() => {
                          setSelectedMvtFridgeSerial('all');
                          setMvtSearchQuery('');
                          setMvtTypeFilter('all');
                          setMvtDepotFilter('all');
                          playBip(600, 0.05);
                        }}
                        className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold uppercase flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{lang === 'fr' ? 'Réinitialiser Filtres' : 'إعادة ضبط الفلاتر'}</span>
                      </button>
                    )}

                    {/* PDF Download if specific fridge */}
                    {selectedMvtFridgeSerial !== 'all' && (
                      <button
                        onClick={() => {
                          playBip(1300, 0.1);
                          generateFridgeMovementHistoryPdf(selectedMvtFridgeSerial, movements, currentDetails, lang);
                        }}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-sky-500/20 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{lang === 'fr' ? 'Exporter PDF' : 'تصدير PDF'}</span>
                      </button>
                    )}

                    {/* Print Report */}
                    {selectedMvtFridgeSerial !== 'all' && (
                      <button
                        onClick={() => {
                          playBip(1300, 0.1);
                          setTimeout(() => window.print(), 250);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>{lang === 'fr' ? 'Imprimer' : 'طباعة'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. MODERN KPI METRICS RIBBON */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Total Movements */}
                  <div 
                    onClick={() => { setMvtTypeFilter('all'); playBip(700, 0.05); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      mvtTypeFilter === 'all'
                        ? 'bg-sky-500/10 border-sky-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-sky-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Total Mouvements' : 'إجمالي التحركات'}
                      </span>
                      <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
                      {totalMovements}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Toutes opérations' : 'كافة العمليات المسجلة'}
                    </div>
                  </div>

                  {/* Unique Refrigerators */}
                  <div 
                    onClick={() => { setSelectedMvtFridgeSerial('all'); playBip(700, 0.05); }}
                    className="p-4 rounded-2xl border bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Appareils Suivis' : 'الأجهزة المتبوعة'}
                      </span>
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Snowflake className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                      {uniqueFridgesCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Numéros de série' : 'أرقام تسلسل فريدة'}
                    </div>
                  </div>

                  {/* Inter-Depot Transfers */}
                  <div 
                    onClick={() => { setMvtTypeFilter(mvtTypeFilter === 'transfer' ? 'all' : 'transfer'); playBip(700, 0.05); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      mvtTypeFilter === 'transfer'
                        ? 'bg-blue-500/10 border-blue-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Inter-Dépôts' : 'بين المستودعات'}
                      </span>
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Warehouse className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                      {interDepotCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Transferts logistiques' : 'تحويلات لوجستية'}
                    </div>
                  </div>

                  {/* Client Placements */}
                  <div 
                    onClick={() => { setMvtTypeFilter(mvtTypeFilter === 'client' ? 'all' : 'client'); playBip(700, 0.05); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      mvtTypeFilter === 'client'
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Placements Clients' : 'توزيع لدى العملاء'}
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                      {clientPlacementCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Commerces & Points de vente' : 'نقاط بيع ومتاجر'}
                    </div>
                  </div>

                  {/* Maintenance & Returns */}
                  <div 
                    onClick={() => { setMvtTypeFilter(mvtTypeFilter === 'maintenance' ? 'all' : 'maintenance'); playBip(700, 0.05); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      mvtTypeFilter === 'maintenance'
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {lang === 'fr' ? 'Maintenance' : 'ورشات وصيانة'}
                      </span>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Wrench className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                      {maintenanceCount}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' ? 'Atelier & Réparation' : 'ورشة وتصليح'}
                    </div>
                  </div>
                </div>

                {/* 3. TECHNICAL SPECIFICATION SHEET (When a fridge is focused) */}
                {selectedMvtFridgeSerial !== 'all' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-sky-500/5 via-slate-50 to-indigo-500/5 dark:from-sky-950/20 dark:via-slate-850 dark:to-indigo-950/20 p-5 sm:p-6 rounded-3xl border border-sky-200/70 dark:border-sky-900/40 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-sky-500 text-white rounded-2xl shadow-md">
                          <Snowflake className="h-5 w-5 animate-spin-slow" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                              {lang === 'fr' ? 'Fiche Technique d\'Appareil' : 'البطاقة التقنية للجهاز'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-black">
                              {displayList.length} {lang === 'fr' ? 'Transfert(s)' : 'حركة مسجلة'}
                            </span>
                          </div>
                          <h3 className="font-mono font-black text-slate-900 dark:text-white text-base sm:text-lg">
                            {selectedMvtFridgeSerial}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMvtFridgeSerial('all');
                            setMvtSearchQuery('');
                            playBip(500, 0.05);
                          }}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors uppercase"
                        >
                          {lang === 'fr' ? 'Voir Tous les Réfrigérateurs' : 'عرض كافة الثلاجات'}
                        </button>
                      </div>
                    </div>

                    {currentDetails ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                        <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <span className="block mb-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            {lang === 'fr' ? 'Type d\'équipement' : 'نوع الثلاجة'}
                          </span>
                          <b className="text-slate-800 dark:text-white text-xs sm:text-sm font-black">
                            {currentDetails.type === 'chest' || currentDetails.type === 'AP'
                              ? (lang === 'fr' ? 'CONGÉLATEUR COFFRE (AP)' : 'مجمّد أفقي (AP)') 
                              : (lang === 'fr' ? 'VITRINE VERTICALE (AG)' : 'ثلاجة عرض عمودية (AG)')}
                          </b>
                        </div>

                        <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <span className="block mb-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            {lang === 'fr' ? 'Statut Opérationnel' : 'الحالة التشغيلية'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-block ${
                            currentDetails.status === 'service' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' :
                            currentDetails.status === 'maintenance' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}>
                            {currentDetails.status === 'service' ? (lang === 'fr' ? 'EN SERVICE' : 'في الخدمة') :
                             currentDetails.status === 'maintenance' ? (lang === 'fr' ? 'ATELIER R&M' : 'صيانة وإصلاح') :
                             (lang === 'fr' ? 'EN DÉPÔT' : 'في المستودع')}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <span className="block mb-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            {lang === 'fr' ? 'Emplacement / Détenteur Actuel' : 'الموقع / الحائز الحالي'}
                          </span>
                          <b className="text-slate-800 dark:text-white text-xs sm:text-sm truncate block font-black">
                            {currentDetails.status === 'service' ? (currentDetails.client || 'Client') : `Dépôt ${currentDetails.depot}`}
                          </b>
                        </div>

                        <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                          <span className="block mb-1 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            {lang === 'fr' ? 'Durée dans l\'emplacement actuel' : 'مدة الإقامة في الموقع الحالي'}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400 font-mono block">
                            {displayList[0] ? (durationLookup[displayList[0].id]?.duration || (lang === 'fr' ? 'En cours' : 'قيد الاستخدام')) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-bold text-amber-700 dark:text-amber-300">
                        {lang === 'fr' 
                          ? 'Appareil historique archivé (non répertorié dans le stock actif actuel, mouvements conservés).' 
                          : 'ثلاجة أرشيفية (غير مسجلة في المخزن النشط حالياً، تم الاحتفاظ بسجل التحركات).'}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. ADVANCED FILTER & SEARCH TOOLBAR */}
                <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    
                    {/* Left: Refrigerator Selector Dropdown & Live Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                      
                      {/* Refrigerator Dropdown */}
                      <div className="relative w-full sm:w-64 shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                          <Filter className="h-3.5 w-3.5 text-sky-500" />
                          <span>{lang === 'fr' ? 'Sélectionner Réfrigérateur :' : 'اختيار الثلاجة :'}</span>
                        </div>
                        <select
                          value={selectedMvtFridgeSerial}
                          onChange={(e) => {
                            setSelectedMvtFridgeSerial(e.target.value);
                            setMvtSearchQuery(e.target.value === 'all' ? '' : e.target.value);
                            playBip(800, 0.08);
                          }}
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl focus:border-sky-500 outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-bold shadow-sm"
                        >
                          <option value="all">{lang === 'fr' ? 'Tous les mouvements (Tout voir)' : 'جميع التحركات (عرض الكل)'}</option>
                          {fridges.map(f => (
                            <option key={f.id} value={f.serialNumber}>
                              {f.serialNumber} — ({f.status === 'service' ? f.client : `Dépôt ${f.depot}`})
                            </option>
                          ))}
                          {Array.from(new Set(movements.map(m => m.serialNumber as string)))
                            .filter(sn => sn && !fridges.some(f => f.serialNumber === sn))
                            .map(sn => (
                              <option key={sn} value={sn}>{sn} ({lang === 'fr' ? 'Historique' : 'أرشيف'})</option>
                            ))
                          }
                        </select>
                      </div>

                      {/* Real-time Search Input with clear button */}
                      <div className="relative flex-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5 text-sky-500" />
                          <span>{lang === 'fr' ? 'Recherche Rapide (S/N, Chauffeur, Lieu) :' : 'بحث فوري (رقم، سائق، موقع) :'}</span>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            placeholder={lang === 'fr' ? "Rechercher par S/N, destination, chauffeur..." : "ابحث برقم التسلسل، الوجهة، السائق..."}
                            value={mvtSearchQuery}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMvtSearchQuery(val);
                              if (val === '') {
                                setSelectedMvtFridgeSerial('all');
                              } else {
                                const exactMatch = fridges.find(f => f.serialNumber.toLowerCase() === val.toLowerCase()) ||
                                                   movements.find(m => m.serialNumber.toLowerCase() === val.toLowerCase());
                                if (exactMatch) {
                                  setSelectedMvtFridgeSerial(exactMatch.serialNumber);
                                }
                              }
                            }}
                            className="w-full text-xs pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl focus:border-sky-500 outline-none text-slate-800 dark:text-slate-100 font-bold shadow-sm"
                          />
                          {mvtSearchQuery && (
                            <button
                              onClick={() => {
                                setMvtSearchQuery('');
                                setSelectedMvtFridgeSerial('all');
                              }}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Autocomplete suggestion pills when typing */}
                        {mvtSearchQuery && !fridges.some(f => f.serialNumber.toLowerCase() === mvtSearchQuery.toLowerCase()) && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                            {fridges
                              .filter(f => f.serialNumber.toLowerCase().includes(mvtSearchQuery.toLowerCase()))
                              .map(f => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    setMvtSearchQuery(f.serialNumber);
                                    setSelectedMvtFridgeSerial(f.serialNumber);
                                    playBip(800, 0.08);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-bold flex justify-between items-center transition-colors"
                                >
                                  <span className="font-mono text-sky-600 dark:text-sky-400">{f.serialNumber}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    {f.status === 'service' ? f.client : `Dépôt ${f.depot}`}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Depot Filter Select */}
                      <div className="relative w-full sm:w-48 shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                          <Warehouse className="h-3.5 w-3.5 text-sky-500" />
                          <span>{lang === 'fr' ? 'Par Dépôt :' : 'حسب المستودع :'}</span>
                        </div>
                        <select
                          value={mvtDepotFilter}
                          onChange={(e) => {
                            setMvtDepotFilter(e.target.value);
                            playBip(700, 0.05);
                          }}
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700/80 rounded-xl focus:border-sky-500 outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-bold shadow-sm"
                        >
                          <option value="all">{lang === 'fr' ? 'Tous les dépôts' : 'كافة المستودعات'}</option>
                          {regionalDepots.map(depot => (
                            <option key={depot} value={depot}>Dépôt {depot}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Right: View Mode Switcher (Cards vs Table) */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400 hidden sm:block">
                        {lang === 'fr' ? 'Affichage :' : 'العرض :'}
                      </div>
                      <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => { setMvtViewMode('cards'); playBip(600, 0.04); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mvtViewMode === 'cards'
                              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          <span>{lang === 'fr' ? 'Cartes' : 'بطاقات'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMvtViewMode('table'); playBip(600, 0.04); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mvtViewMode === 'table'
                              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <List className="h-3.5 w-3.5" />
                          <span>{lang === 'fr' ? 'Tableau' : 'جدول'}</span>
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Filter chips / quick tabs */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      {lang === 'fr' ? 'Type :' : 'النوع :'}
                    </span>

                    {[
                      { id: 'all', labelFr: 'Tous les Mouvements', labelAr: 'كافة التحركات', count: totalMovements },
                      { id: 'transfer', labelFr: 'Inter-Dépôts', labelAr: 'بين المستودعات', count: interDepotCount },
                      { id: 'client', labelFr: 'Placements Clients', labelAr: 'توزيع لدى العملاء', count: clientPlacementCount },
                      { id: 'maintenance', labelFr: 'Maintenance & Atelier', labelAr: 'ورشات وصيانة', count: maintenanceCount }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setMvtTypeFilter(tab.id as any);
                          playBip(700, 0.04);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          mvtTypeFilter === tab.id
                            ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{lang === 'fr' ? tab.labelFr : tab.labelAr}</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                          mvtTypeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. MOVEMENTS DISPLAY (Cards View vs Table View) */}
                <AnimatePresence mode="popLayout">
                  {displayList.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-slate-850 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3"
                    >
                      <History className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto animate-pulse" />
                      <h4 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase">
                        {lang === 'fr' ? 'Aucun mouvement correspondant trouvé' : 'لم يتم العثور على أي تحركات مطابقة'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {lang === 'fr'
                          ? 'Modifiez vos critères de recherche ou réinitialisez les filtres pour afficher l\'ensemble de l\'historique.'
                          : 'يرجى تعديل معايير البحث أو إلغاء تفعيل الفلاتر لعرض كافة سجل التحركات.'}
                      </p>
                      {isFilterActive && (
                        <button
                          onClick={() => {
                            setSelectedMvtFridgeSerial('all');
                            setMvtSearchQuery('');
                            setMvtTypeFilter('all');
                            setMvtDepotFilter('all');
                            playBip(600, 0.05);
                          }}
                          className="mt-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-colors uppercase"
                        >
                          {lang === 'fr' ? 'Réinitialiser Tous les Filtres' : 'إعادة ضبط كافة الفلاتر'}
                        </button>
                      )}
                    </motion.div>
                  ) : mvtViewMode === 'cards' ? (
                    
                    /* ===== CARDS VIEW ===== */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                      {displayList.map((log, index) => {
                        const durInfo = durationLookup[log.id] || { 
                          duration: calculateDuration(log.date), 
                          isCurrent: false 
                        };
                        const isInterDepot = (log.fromLocation || '').toLowerCase().includes('dépôt') && (log.toLocation || '').toLowerCase().includes('dépôt');
                        const isClient = log.toStatus === 'service' || (!(log.toLocation || '').toLowerCase().includes('dépôt') && !(log.toLocation || '').toLowerCase().includes('atelier'));
                        const isMaint = log.toStatus === 'maintenance' || (log.toLocation || '').toLowerCase().includes('atelier');

                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.02, 0.3) }}
                            className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-500/30 transition-all flex flex-col justify-between space-y-4 group"
                          >
                            {/* Card Top: S/N + Fridge Type + Date */}
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedMvtFridgeSerial(log.serialNumber);
                                      setMvtSearchQuery(log.serialNumber);
                                      playBip(800, 0.08);
                                    }}
                                    className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm hover:underline tracking-tight cursor-pointer"
                                    title={lang === 'fr' ? 'Cliquer pour filtrer uniquement cet appareil' : 'انقر للتصفية حسب هذا الجهاز فقط'}
                                  >
                                    {log.serialNumber}
                                  </button>
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase">
                                    {log.type === 'chest' || log.type === 'AP' 
                                      ? (lang === 'fr' ? 'Coffre / AP' : 'مجمّد أفقي') 
                                      : (lang === 'fr' ? 'Vitrine / AG' : 'عرض عمودي')}
                                  </span>
                                </div>
                                <span className={`text-[9px] font-extrabold uppercase mt-1 inline-block ${
                                  isInterDepot ? 'text-blue-500' :
                                  isClient ? 'text-emerald-500' :
                                  isMaint ? 'text-amber-500' : 'text-slate-400'
                                }`}>
                                  {isInterDepot ? (lang === 'fr' ? '● Transfert Inter-Dépôts' : '● تحويل بين المستودعات') :
                                   isClient ? (lang === 'fr' ? '● Placement Chez Client' : '● تسليم لدى عميل') :
                                   isMaint ? (lang === 'fr' ? '● Envoi en Maintenance' : '● إرسال للصيانة') :
                                   (lang === 'fr' ? '● Mouvement Logistique' : '● عملية لوجستية')}
                                </span>
                              </div>

                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                                <Calendar className="h-3 w-3 text-sky-500" />
                                <span>{log.date}</span>
                              </span>
                            </div>

                            {/* Card Body: Route Journey Visual */}
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex-1 min-w-0 pr-2">
                                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-black">
                                    {lang === 'fr' ? 'Provenance (De)' : 'المصدر (من)'}
                                  </span>
                                  <b className="text-slate-700 dark:text-slate-300 text-xs truncate block font-bold" title={log.fromLocation}>
                                    {log.fromLocation}
                                  </b>
                                </div>

                                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0 shadow-sm">
                                  <ArrowRightLeft className="h-4 w-4" />
                                </div>

                                <div className="flex-1 min-w-0 pl-2 text-right">
                                  <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-black">
                                    {lang === 'fr' ? 'Destination (Vers)' : 'الوجهة (إلى)'}
                                  </span>
                                  <b className="text-slate-900 dark:text-white text-xs truncate block font-black" title={log.toLocation}>
                                    {log.toLocation}
                                  </b>
                                </div>
                              </div>
                            </div>

                            {/* Card Bottom: Duration & Driver & Notes */}
                            <div className="space-y-2.5 pt-1">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                {/* Stay duration */}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-sky-500" />
                                  <span className="text-[9px] uppercase font-bold text-slate-400">
                                    {lang === 'fr' ? 'Séjour :' : 'الإقامة :'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black ${
                                    durInfo.isCurrent
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                  }`}>
                                    {durInfo.duration} {durInfo.isCurrent && (lang === 'fr' ? '(Actuel)' : '(حالي)')}
                                  </span>
                                </div>

                                {/* Driver */}
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                  <Truck className="h-3 w-3 text-slate-400" />
                                  <b className="text-slate-700 dark:text-slate-300 truncate max-w-[120px] font-bold">
                                    {log.driverName}
                                  </b>
                                </div>
                              </div>

                              {log.notes && (
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800 line-clamp-2">
                                  "{log.notes}"
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (

                    /* ===== TABLE VIEW ===== */
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                              <th className="p-3.5 text-center w-12">#</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Date & Heure' : 'التاريخ والوقت'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'N° de Série' : 'الرقم التسلسلي'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Type' : 'النوع'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Provenance (De)' : 'المصدر (من)'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Destination (Vers)' : 'الوجهة (إلى)'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Durée Séjour' : 'مدة الإقامة'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Chauffeur' : 'السائق الناقل'}</th>
                              <th className="p-3.5">{lang === 'fr' ? 'Observations' : 'ملاحظات'}</th>
                              <th className="p-3.5 text-center">{lang === 'fr' ? 'Fiche' : 'البطاقة'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {displayList.map((log, idx) => {
                              const durInfo = durationLookup[log.id] || { 
                                duration: calculateDuration(log.date), 
                                isCurrent: false 
                              };

                              return (
                                <tr 
                                  key={log.id}
                                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  <td className="p-3.5 text-center font-mono text-[10px] text-slate-400 font-bold">
                                    {idx + 1}
                                  </td>
                                  <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {log.date}
                                  </td>
                                  <td className="p-3.5 font-mono font-black text-sky-600 dark:text-sky-400 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMvtFridgeSerial(log.serialNumber);
                                        setMvtSearchQuery(log.serialNumber);
                                        playBip(800, 0.08);
                                      }}
                                      className="hover:underline cursor-pointer"
                                    >
                                      {log.serialNumber}
                                    </button>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black uppercase text-slate-500">
                                      {log.type === 'chest' || log.type === 'AP' ? 'Coffre' : 'Vitrine'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                                    {log.fromLocation}
                                  </td>
                                  <td className="p-3.5 font-black text-slate-900 dark:text-white uppercase text-[11px]">
                                    {log.toLocation}
                                  </td>
                                  <td className="p-3.5 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black ${
                                      durInfo.isCurrent
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {durInfo.duration} {durInfo.isCurrent && '(Actuel)'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                                    {log.driverName}
                                  </td>
                                  <td className="p-3.5 text-slate-500 dark:text-slate-400 italic text-[11px] max-w-xs truncate">
                                    {log.notes || '—'}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMvtFridgeSerial(log.serialNumber);
                                        setMvtSearchQuery(log.serialNumber);
                                        playBip(800, 0.08);
                                      }}
                                      className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition-all"
                                      title={lang === 'fr' ? 'Voir la fiche complète' : 'عرض البطاقة الكاملة'}
                                    >
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })()}

          {/* PRINTABLE WORKSPACE (Only visible on paper / printer dialog) */}
          {selectedMvtFridgeSerial !== 'all' && (() => {
            const currentDetails = fridges.find(f => f.serialNumber.toUpperCase() === selectedMvtFridgeSerial.toUpperCase());
            const filtered = movements.filter(m => m.serialNumber.toUpperCase().includes(selectedMvtFridgeSerial.toUpperCase()));
            const sorted = [...filtered].sort((a, b) => parseMovementDate(a.date).getTime() - parseMovementDate(b.date).getTime());
            const computedMvts = sorted.map((m, idx) => {
              const nextM = sorted[idx + 1];
              const duration = calculateDuration(m.date, nextM?.date);
              return {
                ...m,
                duration,
                isCurrent: !nextM
              };
            }).reverse();

            return (
              <div id="printable-refrigerator-history" className="hidden print:block bg-white text-black p-8 font-sans">
                {/* Report Header Logo & Branding */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">ZAHI GLACES S.A.R.L.</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      INDUSTRIE ALIMENTAIRE & LOGISTIQUE DE FROID
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Rabat - Casablanca - Marrakech - Agadir
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono text-[9px] font-black rounded-md inline-block mb-1">
                      RAPPORT DE MOUVEMENT LOGISTIQUE
                    </span>
                    <p className="text-[10px] text-slate-600 font-bold">
                      Généré le: {new Date().toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Title Section */}
                <div className="text-center bg-slate-50 border border-slate-200 p-3 rounded-lg mb-6">
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    Historique Complet des Transferts de Matériel
                  </h2>
                  <p className="text-xs font-mono font-bold text-sky-600 mt-1">
                    N° de Série Requis: {selectedMvtFridgeSerial}
                  </p>
                </div>

                {/* Refrigerator Technical Specifications Table */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-l-4 border-slate-800 pl-2">
                    1. Spécifications Techniques de l'Appareil
                  </h3>
                  <table className="w-full text-[11px] border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 font-bold text-slate-500 w-1/4">Numéro de Série :</td>
                        <td className="py-2 font-mono font-bold text-slate-800">{selectedMvtFridgeSerial}</td>
                        <td className="py-2 font-bold text-slate-500 w-1/4">Type d'Équipement :</td>
                        <td className="py-2 font-bold text-slate-800 uppercase">
                          {currentDetails ? (currentDetails.type === 'chest' ? 'CONGÉLATEUR COFFRE (AP)' : 'VITRINE VERTICALE (AG)') : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 font-bold text-slate-500">Statut Opérationnel :</td>
                        <td className="py-2 font-bold text-slate-800 uppercase">
                          {currentDetails ? currentDetails.status : 'N/A'}
                        </td>
                        <td className="py-2 font-bold text-slate-500">Emplacement Actuel :</td>
                        <td className="py-2 font-bold text-slate-800">
                          {currentDetails ? (currentDetails.status === 'service' ? currentDetails.client : `Dépôt ${currentDetails.depot}`) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2 font-bold text-slate-500">Date de Mise en Service :</td>
                        <td className="py-2 font-bold text-slate-800">
                          {currentDetails?.installationDate || 'N/A'}
                        </td>
                        <td className="py-2 font-bold text-slate-500">Dernière Maintenance :</td>
                        <td className="py-2 font-bold text-slate-800">
                          {currentDetails?.lastServiceDate || 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Chronological Movements Log Table */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-l-4 border-slate-800 pl-2">
                    2. Journal Historique des Transferts & Placements
                  </h3>
                  <table className="w-full text-[10px] border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="p-2 text-left border-r border-slate-300 font-black uppercase">N°</th>
                        <th className="p-2 text-left border-r border-slate-300 font-black uppercase">Date transfert</th>
                        <th className="p-2 text-left border-r border-slate-300 font-black uppercase">Provenance (De)</th>
                        <th className="p-2 text-left border-r border-slate-300 font-black uppercase">Destination (Vers)</th>
                        <th className="p-2 text-left border-r border-slate-300 font-black uppercase">Durée de Séjour</th>
                        <th className="p-2 text-left border-r border-slate-300 font-black uppercase">Vendeur / Chauffeur</th>
                        <th className="p-2 text-left font-black uppercase">Observations / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computedMvts.map((m, i) => (
                        <tr key={m.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-500">{computedMvts.length - i}</td>
                          <td className="p-2 border-r border-slate-200 font-bold font-mono text-slate-800">{m.date}</td>
                          <td className="p-2 border-r border-slate-200 uppercase font-bold text-slate-600">{m.fromLocation}</td>
                          <td className="p-2 border-r border-slate-200 uppercase font-black text-slate-900">{m.toLocation}</td>
                          <td className="p-2 border-r border-slate-200 font-black font-mono text-emerald-700 bg-slate-50">
                            {m.duration} {m.isCurrent && '(En cours)'}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-700">{m.driverName}</td>
                          <td className="p-2 italic text-slate-500 font-medium">{m.notes || 'N/A'}</td>
                        </tr>
                      ))}
                      {computedMvts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 font-bold italic">
                            Aucun mouvement enregistré pour cet appareil.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signature Blocks */}
                <div className="mt-12 grid grid-cols-2 gap-8 text-center text-[10px] font-bold uppercase tracking-wide">
                  <div>
                    <p className="text-slate-400 mb-12">Le Responsable Logistique & Transport</p>
                    <div className="w-36 h-0.5 bg-slate-300 mx-auto mb-2"></div>
                    <p className="text-slate-800">Mustapha Ait Ben Haddou</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-12 font-bold">Direction d'Exploitation (Visa & Cachet)</p>
                    <div className="w-36 h-0.5 bg-slate-300 mx-auto mb-2"></div>
                    <p className="text-slate-800">Zahi Glaces S.A.R.L.</p>
                  </div>
                </div>

                {/* PDF Footer Disclaimer */}
                <div className="mt-16 border-t border-slate-200 pt-3 text-center text-[8px] text-slate-400">
                  Ce rapport logistique est généré automatiquement par le Système Connecté de Supervision Zahi Glaces.
                  <br />
                  ID Traceur: {selectedMvtFridgeSerial}-LOG-TRANSIT-2026
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* SUB-TAB 3: DRIVER BULK LINKING & LOGISTICS MAP */}
      {activeSubTab === 'logistics' && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Select list (left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase">
                <Truck className="h-4.5 w-4.5 text-sky-500 animate-bounce" />
                {t.driverLinking}
              </h3>
              
              {selectedFridgesForDriver.length > 0 && (
                <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px]">
                  {selectedFridgesForDriver.length} Sélectionné(s)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'fr' 
                ? 'Sélectionnez un dépôt ci-dessous pour filtrer les appareils, puis cochez les réfrigérateurs à lier à un chauffeur à droite.'
                : 'اختر المستودع لتصفية الأجهزة، ثم حدد الثلاجات لربطها بالسائق المناسب على اليمين.'}
            </p>

            {/* Depot Selector for Logistics */}
            <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg">
                  <Truck className="h-4 w-4" />
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {lang === 'fr' ? 'Sélectionner le dépôt' : 'اختر المستودع (Dépôt)'}
                </span>
              </div>
              <select
                value={selectedLogisticsDepot}
                onChange={(e) => {
                  setSelectedLogisticsDepot(e.target.value);
                  setSelectedFridgesForDriver([]); // Reset multi-selection when depot changes
                  playBip(800, 0.05);
                }}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-750 outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer w-full sm:w-auto min-w-[180px]"
              >
                <option value="all">{lang === 'fr' ? 'Tous les dépôts' : 'جميع المستودعات'}</option>
                {regionalDepots.map(depot => (
                  <option key={depot} value={depot}>{depot}</option>
                ))}
              </select>
            </div>

            {filteredLogisticsFridges.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-400 font-bold">
                  {lang === 'fr' ? 'Aucun réfrigérateur trouvé dans ce dépôt.' : 'لم يتم العثور على أي ثلاجة في هذا المستودع.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredLogisticsFridges.map(f => {
                  const isChecked = selectedFridgesForDriver.includes(f.id);
                  const assignedDriver = driversList.find(d => d.id === f.driverId);

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFridgesForDriver(prev => 
                          prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                        );
                        playBip(650, 0.05);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isChecked 
                          ? 'bg-sky-500/5 dark:bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/20' 
                          : 'bg-white dark:bg-slate-850 hover:bg-slate-50 border-slate-100 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="accent-sky-600 h-4 w-4 shrink-0 rounded"
                      />
                      
                      <div className="flex-1 min-w-0 space-y-0.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-black text-slate-800 dark:text-white">{f.serialNumber}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{f.type === 'chest' ? 'Coffre' : 'Vitrine'}</span>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {f.status === 'service' ? `Client : ${f.client}` : `Dépôt : ${f.depot}`}
                        </p>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                          <span className="text-slate-400">{t.driverName} :</span>
                          {assignedDriver ? (
                            <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold rounded">
                              {assignedDriver.name.split(' (')[0]}
                            </span>
                          ) : (
                            <span className="italic text-slate-300">{t.unassigned}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bulk assign submit panel (right 1 col) */}
          <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <form onSubmit={handleBulkAssignDriver} className="space-y-4 text-xs">
              <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase">
                <User className="h-4 w-4 text-sky-500" />
                {t.linkGroup}
              </h4>

              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border text-center">
                  <span className="text-2xl font-mono font-black text-sky-600">
                    {selectedFridgesForDriver.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mt-1">Appareils Sélectionnés</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sélectionner le Chauffeur</label>
                  <select
                    required
                    value={bulkDriverId}
                    onChange={(e) => setBulkDriverId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option value="">-- Choose Driver --</option>
                    {driversList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={selectedFridgesForDriver.length === 0 || !bulkDriverId}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-xl font-bold transition-all shadow cursor-pointer"
              >
                {lang === 'fr' ? 'Confirmer l\'Affectation' : 'تأكيد عملية الربط'}
              </button>
            </form>

            <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-[10px] leading-relaxed text-slate-400 space-y-1">
              <b className="text-slate-700 dark:text-slate-300 block uppercase">Logistique Intelligente :</b>
              <p>
                {lang === 'fr' 
                  ? 'Une fois liée, l\'application chauffeur de Hamza ou de l\'agent désigné affichera les tâches d\'inspection, d\'approvisionnement ou de chargement de ces réfrigérateurs automatiquement.' 
                  : 'بمجرد الربط، ستعرض تطبيق الهاتف الخاص بالسائق حمزة أو الوكيل المهام المخصصة لتفتيش أو تزويد هذه الثلاجات تلقائياً.'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 5: BONS D'ENTRÉE ET DE SORTIE AP/AG (FULL SCREEN FORM) */}
      {activeSubTab === 'bons' && (
        <div className="p-6 max-w-full mx-auto space-y-6 w-full">
          
          {/* Printable Page Inline CSS Rules for exact copy conform printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide everything else on the page during print */
              body * {
                visibility: hidden !important;
              }
              #printable-carbon-copy, #printable-carbon-copy * {
                visibility: visible !important;
              }
              #printable-carbon-copy {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 1.5cm !important;
                border: 2px solid #1e293b !important;
                box-shadow: none !important;
                background-color: white !important;
                color: black !important;
                font-size: 12px !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {/* Form configuration toolbar (no-print) */}
          <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between shadow-sm no-print">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <FileText className="h-5 w-5 text-sky-500" />
                <span className="font-black text-slate-800 dark:text-white text-xs uppercase">
                  {lang === 'fr' ? 'Type de Bon :' : 'نوع السند / الإذن :'}
                </span>
              </div>
              <div className="relative">
                <select
                  value={bonType}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setBonType(newType);
                    playBip(800, 0.05);

                    if (newType === 'entry') {
                      // Automatically preload Casablanca stock fridges
                      const casaFridges = fridges.filter(f => f.status === 'stock' && (f.depot || '').toLowerCase().includes('casablanca'));
                      const casaAp = casaFridges.filter(f => f.type === 'chest' || f.type === 'AP');
                      const casaAg = casaFridges.filter(f => f.type === 'upright' || f.type === 'AG');
                      const casaAs = casaFridges.filter(f => f.type === 'AS');

                      const newAp = Array(10).fill('');
                      const newAg = Array(10).fill('');
                      const newAs = Array(10).fill('');

                      casaAp.slice(0, 10).forEach((f, idx) => { newAp[idx] = f.serialNumber; });
                      casaAg.slice(0, 10).forEach((f, idx) => { newAg[idx] = f.serialNumber; });
                      casaAs.slice(0, 10).forEach((f, idx) => { newAs[idx] = f.serialNumber; });

                      setBonApRows(newAp);
                      setBonAgRows(newAg);
                      setBonAsRows(newAs);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-sm transition-all ${
                    bonType === 'entry' 
                      ? 'bg-emerald-600 text-white border-emerald-700' 
                      : bonType === 'livraison' 
                      ? 'bg-blue-600 text-white border-blue-700' 
                      : bonType === 'sortie' 
                      ? 'bg-rose-600 text-white border-rose-700' 
                      : bonType === 'prise_en_charge' 
                      ? 'bg-amber-500 text-slate-950 border-amber-600' 
                      : bonType === 'decharge' 
                      ? 'bg-purple-600 text-white border-purple-700' 
                      : bonType === 'depot_regional' 
                      ? 'bg-indigo-600 text-white border-indigo-700' 
                      : 'bg-cyan-600 text-white border-cyan-700'
                  }`}
                >
                  <option value="livraison" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? '1. Bon de Livraison (Vers Casablanca)' : '1. إذن تسليم ثلاجات (إلى مستودع الدار البيضاء)'}
                  </option>
                  <option value="entry" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? "2. Bon d'Entrée (Depuis Casablanca)" : '2. إذن دخول ثلاجة (من كازا إلى الفروع)'}
                  </option>
                  <option value="sortie" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? '3. Bon de Sortie' : '3. إذن خروج ثلاجة'}
                  </option>
                  <option value="prise_en_charge" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? '4. Prise en Charge' : '4. سند استلام ثلاجة'}
                  </option>
                  <option value="decharge" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? '5. Décharge' : '5. سند إخلاء / إرجاع'}
                  </option>
                  <option value="contrat_depot" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? '6. Contrat Dépôt' : '6. عقد إيداع ثلاجة'}
                  </option>
                  <option value="depot_regional" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {lang === 'fr' ? '7. Dépôts Régionaux' : '7. المستودعات الجهوية'}
                  </option>
                </select>
              </div>

              {/* Dépôts Régionaux Selection Dropdown */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                  {lang === 'fr' ? 'Dépôt :' : 'المستودع :'}
                </span>
                <select
                  value={bonDepot}
                  onChange={(e) => {
                    setBonDepot(e.target.value);
                    playBip(750, 0.04);
                  }}
                  className="bg-white dark:bg-slate-900 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {regionalDepots.map((dep) => (
                    <option key={dep} value={dep}>
                      {lang === 'fr' ? `Dépôt ${dep}` : `مستودع ${dep}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              <button
                type="button"
                onClick={() => { resetBonForm(); playBip(900, 0.05); }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {lang === 'fr' ? 'Nouveau' : 'جديد'}
              </button>
              <button
                type="button"
                onClick={() => { setActiveSubTab('historique'); playBip(800, 0.05); }}
                className="px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-sky-200/50"
              >
                <History className="h-3.5 w-3.5 text-sky-500" />
                {lang === 'fr' ? 'Historique des Bons' : 'سجل الأذونات المحفوظة'}
                <span className="px-1.5 py-0.2 bg-sky-500 text-white rounded-full text-[10px] font-mono font-bold">
                  {savedBons.length}
                </span>
              </button>
            </div>
          </div>

          {/* NOTIFICATION TOAST ALERT (BON SAVED / ERROR) */}
          {bonToast && (
            <div 
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-bounce duration-300 no-print ${
                bonToast.type === 'success' 
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20' 
                  : 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {bonToast.type === 'success' ? (
                  <Check className="h-6 w-6 shrink-0 bg-white/20 p-1 rounded-full" />
                ) : (
                  <AlertTriangle className="h-6 w-6 shrink-0 bg-white/20 p-1 rounded-full" />
                )}
                <div>
                  <h4 className="font-black text-sm">
                    {bonToast.type === 'success' 
                      ? (lang === 'fr' ? 'Opération réussie !' : 'تمت العملية بنجاح !') 
                      : (lang === 'fr' ? 'Attention / Erreur' : 'تنبيه / خطأ')}
                  </h4>
                  <p className="text-xs font-semibold text-white/95 mt-0.5">
                    {bonToast.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bonToast.type === 'success' && (
                  <button
                    type="button"
                    onClick={() => { setActiveSubTab('historique'); playBip(800, 0.05); }}
                    className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-black shadow-sm transition-all"
                  >
                    {lang === 'fr' ? "Voir l'Historique →" : "عرض السجل →"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBonToast(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white font-black text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* CARBON COPY PRINTABLE RECEIPT CONTAINER */}
            <div 
              id="printable-carbon-copy"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-800 shadow-xl relative overflow-hidden font-sans space-y-5"
            >
              {bonType === 'contrat_depot' ? (
                /* CONTRAT DE DÉPÔT DE CONGÉLATEUR (عقد إيداع ثلاجة مجمدة) FORM REPLICA MATCHING ATTACHED PHOTO */
                <form onSubmit={handleSaveBon} className="space-y-5 text-slate-900 font-sans text-right" dir="rtl">
                  
                  {/* HEADER ROW WITH LOGO AND ARABIC / FRENCH ADDRESSES */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
                    
                    {/* Left (French address & contact) */}
                    <div className="text-left text-[10px] leading-tight font-medium text-slate-700 font-mono" dir="ltr">
                      <p className="font-bold text-slate-900 text-xs">Zahi Glace</p>
                      <p>Siège & Usine : Route 3301 Ouled Sidi Abdenbi</p>
                      <p>Chellalatte - Mohammedia</p>
                      <p>Tél. : 06 61 39 97 41 / 06 62 13 04 85</p>
                      <p>Fax : 05 22 73 34 97</p>
                      <p>E-mail : zahiglaces@hotmail.com</p>
                    </div>

                    {/* Center Logo */}
                    <div className="flex flex-col items-center">
                      <svg viewBox="0 0 160 100" className="h-16 w-24 shrink-0 drop-shadow">
                        <ellipse cx="80" cy="46" rx="72" ry="36" fill="#3a2210" stroke="#d4af37" strokeWidth="2.5" />
                        <ellipse cx="80" cy="46" rx="66" ry="30" fill="#4d2b14" stroke="#f1d255" strokeWidth="1.5" />
                        <text x="80" y="47" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" stroke="#1d0e04" strokeWidth="1.5" dy="4">ZAHI</text>
                        <path d="M 36 62 L 124 62 L 116 76 L 44 76 Z" fill="#b59410" stroke="#f1d255" strokeWidth="1.2" />
                        <text x="80" y="72" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="10">GLACES</text>
                      </svg>
                    </div>

                    {/* Right (Arabic address & contact) */}
                    <div className="text-right text-[11px] leading-relaxed font-bold text-slate-800">
                      <p className="font-black text-slate-900 text-xs">زاهي كلاص</p>
                      <p>المقر : طريق 3301 سيدي عبد النبي الشلالات - المحمدية</p>
                      <p>الهاتف : 06 61 39 97 41 / 06 62 13 04 85</p>
                      <p>الفاكس : 05 22 73 34 97</p>
                      <p>البريد الإلكتروني : zahiglaces@hotmail.com</p>
                    </div>
                  </div>

                  {/* TITLE & SERIAL STAMP */}
                  <div className="text-center space-y-1 py-2.5 bg-slate-50 border border-slate-300 rounded-lg">
                    <h1 className="text-lg font-black text-slate-950 underline decoration-slate-400 underline-offset-4">
                      عقد إيداع ثلاجة مجمدة (كونجيلاتور)
                    </h1>
                    <p className="text-xs font-bold text-slate-600 font-mono tracking-widest uppercase" dir="ltr">
                      CONTRAT DE DÉPÔT DE CONGÉLATEUR
                    </p>
                    <div className="inline-block px-4 py-1 mt-1 bg-white border-2 border-rose-600 text-rose-600 rounded font-mono font-black text-sm shadow-inner" dir="ltr">
                      N° {bonNo}
                    </div>
                  </div>

                  {/* CONTRACT METADATA (التاريخ - المدينة - صنف الثلاجة - رقم الثلاجة) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold shadow-sm">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-black text-slate-800">التاريخ (Date) :</label>
                      <input
                        type="date"
                        value={bonDate}
                        onChange={(e) => setBonDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-black text-slate-800">المدينة (Ville) :</label>
                      <input
                        type="text"
                        value={bonVille}
                        onChange={(e) => setBonVille(e.target.value)}
                        placeholder="المحمدية"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-black text-slate-800">صنف الثلاجة (Catégorie) :</label>
                      <select
                        value={bonCongelateurType}
                        onChange={(e) => setBonCongelateurType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                      >
                        <option value="AP">صنف AP</option>
                        <option value="AG">صنف AG</option>
                        <option value="AS">صنف AS</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-black text-slate-800">رقم الثلاجة (N° Série) :</label>
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <input
                          type="text"
                          value={bonCongelateurNo}
                          onChange={(e) => setBonCongelateurNo(e.target.value.toUpperCase())}
                          placeholder="ZAHI-CF-00882"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-black text-rose-600 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm uppercase"
                        />
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            setBonCongelateurNo(e.target.value);
                            playBip(800, 0.04);
                          }}
                          className="no-print text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 font-bold shrink-0 cursor-pointer"
                          value=""
                          title="Sélectionner depuis le stock"
                        >
                          <option value="">Stock...</option>
                          {fridges
                            .filter(f => f.depot && bonDepot && f.depot.toLowerCase() === bonDepot.toLowerCase())
                            .map(f => (
                              <option key={f.id} value={f.serialNumber}>
                                {f.serialNumber} ({f.type}) [{f.status === 'stock' ? (lang === 'fr' ? 'Stock' : 'مخزن') : f.status === 'service' ? (lang === 'fr' ? 'Service' : 'خدمة') : (lang === 'fr' ? 'Maintenance' : 'صيانة')}]
                              </option>
                            ))
                          }
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setBonCongelateurNo(`ZAHI-CF-${Math.floor(100000 + Math.random() * 900000)}`);
                            playBip(900, 0.05);
                          }}
                          className="no-print text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg px-2.5 py-1.5 shrink-0"
                          title="Générer un N° de série"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PARTIES SECTION (الطرف الأول & الطرف الثاني) */}
                  <div className="space-y-4 p-4 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed shadow-sm">
                    
                    {/* الطرف الأول */}
                    <div className="p-3 bg-slate-100/90 rounded-lg border-r-4 border-slate-800 font-medium space-y-1">
                      <div className="flex items-center justify-between">
                        <b className="text-slate-950 font-black text-xs">الطرف الأول (المودع) :</b>
                        <span className="text-[10px] text-slate-500 font-mono">Premier Partie - Déposant</span>
                      </div>
                      <p className="text-slate-800 font-bold">شركة زاهي كلاص (S.A.R.L Zahi Glaces)</p>
                      <p className="text-[11px] text-slate-600">المقر : طريق 3301 سيدي عبد النبي الشلالات - المحمدية - المغرب.</p>
                    </div>

                    {/* الطرف الثاني */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                        <b className="text-slate-950 font-black text-sm">الطرف الثاني (الزبون المستفيد) :</b>
                        <span className="text-[10px] text-slate-500 font-mono">Deuxième Partie - Client</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">الاسم والنسب الكامل :</label>
                          <input
                            type="text"
                            value={bonNomClient}
                            onChange={(e) => setBonNomClient(e.target.value)}
                            placeholder="الاسم والنسب الكامل للزبون..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">رقم البطاقة الوطنية (C.I.N) :</label>
                          <input
                            type="text"
                            value={bonCinNo}
                            onChange={(e) => setBonCinNo(e.target.value)}
                            placeholder="BH123456"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">العنوان الشخصي للزبون :</label>
                          <input
                            type="text"
                            value={bonAdresseClient}
                            onChange={(e) => setBonAdresseClient(e.target.value)}
                            placeholder="العنوان الشخصي الكامل..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">عنوان محل إيداع الثلاجة :</label>
                          <input
                            type="text"
                            value={bonAdresseLocal}
                            onChange={(e) => setBonAdresseLocal(e.target.value)}
                            placeholder="عنوان المحل التجاري الذي ستوضع فيه الثلاجة..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">الهاتف :</label>
                          <input
                            type="text"
                            value={bonTelephoneNo}
                            onChange={(e) => setBonTelephoneNo(e.target.value)}
                            placeholder="06 61 00 00 00"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            dir="ltr"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">نوع التجارة / النشاط :</label>
                          <input
                            type="text"
                            value={bonActiviteClient}
                            onChange={(e) => setBonActiviteClient(e.target.value)}
                            placeholder="مواد غذائية / سوبيرات..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">رقم الضريبة المهنية (Patente) :</label>
                          <input
                            type="text"
                            value={bonPatenteNo}
                            onChange={(e) => setBonPatenteNo(e.target.value)}
                            placeholder="PAT-7749201"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            dir="ltr"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* CONTRACT CLAUSES AND TERMS (الشروط والبنود القانونية) */}
                  <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5 text-xs leading-relaxed text-slate-900 font-medium">
                    <b className="text-xs font-black text-slate-950 block border-b pb-1.5 border-slate-300 mb-2 underline decoration-slate-400">
                      لقد وقع الاتفاق والتراضي بين الطرفين على ما يلي:
                    </b>
                    <ul className="space-y-2 list-disc list-inside text-slate-850">
                      <li>تتعهد الشركة بتسليم الزبون ثلاجة لبيع منتجاتها، وهي ملك للشركة ولا يجب بيعها أو التصرف فيها أو إيداع أي منتج من المنتجات المنافسة فيها.</li>
                      <li>يتعهد الزبون بالمحافظة على الثلاجة من أي خدش أو كسر أو تغيير في الشكل، كما عليه إبلاغ الشركة بأي عطل فيها أو انقطاع في التيار الكهربائي على الفور، وأي تأخير أو تماطل يتحمل الزبون مسؤوليته.</li>
                      <li>للشركة الحق في استرداد ثلاجتها وفسخ العقد دون قيد أو شرط مع إشعار مسبق.</li>
                      <li>يلتزم الطرف الثاني باحترام الأثمنة التي تحددها الشركة.</li>
                      <li>الزبون له الحق في مطالبة الموزع بوعاء استلام البضاعة.</li>
                      <li>في حالة رد أي منتج من طرف الزبون، يسلم له توصيل بقيمته من طرف الموزع مقابل رده له في وقت لاحق والشركة غير ملزمة بتعويضه ماديا.</li>
                      <li>يتعهد الزبون بإبلاغ الشركة بأي تغيير في العنوان أو رقم الهاتف.</li>
                      <li>
                        في حالة توصل الطرف الثاني بإشعار من طرف الشركة بتسليم الثلاجة وإن لم يتم تسليمها في الآجال المحددة، يلتزم الطرف الثاني بأداء مبلغ <span className="font-black px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-300">300 درهم</span> عوض عن كل يوم تأخير.
                      </li>
                      <li>وعليه يلتزم الزبون بهذا العقد، وفي حالة الإخلال به يحال الأمر إلى محامي الشركة لاتخاذ التدابير اللازمة وبهذا فالزبون يتحمل جميع المصاريف والأضرار التي تمس الشركة.</li>
                      <li className="pt-1"><b className="text-slate-950 font-black">هذا العقد يتم المصادقة عليه من طرف الزبون لدى مصلحة الإمضاء (المقاطعة)، ويرفق بنسخة من بطاقة التعريف الوطنية.</b></li>
                    </ul>
                  </div>

                  {/* DISTRIBUTOR & SIGNATURES SECTION */}
                  <div className="space-y-3 pt-3 border-t-2 border-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold">
                      <span className="whitespace-nowrap text-slate-800">اسم موزع الثلاجة لدى الشركة (Livreur) :</span>
                      <input
                        type="text"
                        value={bonNomLivreur}
                        onChange={(e) => setBonNomLivreur(e.target.value)}
                        placeholder="اسم الموزع / السائق المسلم للثلاجة..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center text-xs pt-2">
                      <div 
                        onClick={() => signVisa('responsable')}
                        className="p-3 bg-slate-50 border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 transition-all flex flex-col justify-between min-h-[90px]"
                      >
                        <b className="text-slate-950 font-black uppercase block">الطرف الأول المودع</b>
                        <span className="text-[10px] text-slate-500 font-mono">(Zahi Glaces)</span>
                        <div className="h-8 flex items-center justify-center border-t border-dashed border-slate-300 mt-2">
                          {visasSigned.responsable ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.responsable} ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">اضغط للتوقيع الإداري</span>
                          )}
                        </div>
                      </div>

                      <div 
                        onClick={() => signVisa('client')}
                        className="p-3 bg-slate-50 border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 transition-all flex flex-col justify-between min-h-[90px]"
                      >
                        <b className="text-slate-950 font-black uppercase block">الطرف الثاني الزبون</b>
                        <span className="text-[10px] text-slate-500 font-mono">(التوقيع والمصادقة على الإمضاء)</span>
                        <div className="h-8 flex items-center justify-center border-t border-dashed border-slate-300 mt-2">
                          {visasSigned.client ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.client} ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">اضغط لتوقيع الزبون والمصادقة</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" id="hidden-bon-submit" className="hidden" />
                </form>
              ) : bonType === 'prise_en_charge' || bonType === 'decharge' ? (
                /* PRISE EN CHARGE / DÉCHARGE PAPER FORM REPLICA MATCHING ATTACHED PHOTO */
                <form onSubmit={handleSaveBon} className="space-y-5 text-slate-900 font-sans">
                  
                  {/* TOP HEADER ROW: LOGO & ADDRESS ON LEFT, METADATA ON RIGHT */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-slate-800">
                    
                    {/* Left: Logo & Address */}
                    <div className="flex items-start gap-3">
                      <svg viewBox="0 0 160 100" className="h-16 w-24 shrink-0 drop-shadow-sm">
                        <ellipse cx="80" cy="46" rx="72" ry="36" fill="#3a2210" stroke="#d4af37" strokeWidth="2.5" />
                        <ellipse cx="80" cy="46" rx="66" ry="30" fill="#4d2b14" stroke="#f1d255" strokeWidth="1.5" />
                        <text x="80" y="47" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" stroke="#1d0e04" strokeWidth="1.5" dy="4">ZAHI</text>
                        <path d="M 36 62 L 124 62 L 116 76 L 44 76 Z" fill="#b59410" stroke="#f1d255" strokeWidth="1.2" />
                        <text x="80" y="72" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="10">GLACES</text>
                      </svg>

                      <div className="text-left text-[11px] leading-snug font-medium text-slate-800">
                        <p className="font-semibold text-slate-900 text-xs">Siège & Usine : Route 3301 Ouled Sidi Abdenbi</p>
                        <p>Chellalatte - Mohammedia</p>
                        <p>Tél. : 06 61 39 97 41 / 06 62 13 04 85</p>
                        <p>Fax : 05 22 73 34 97</p>
                        <p>E-mail : zahiglaces@hotmail.com</p>
                      </div>
                    </div>

                    {/* Right: Date, Heure, N° d'ordre, Secteur */}
                    <div className="w-full sm:w-auto text-xs space-y-1.5 font-bold">
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <span className="min-w-[70px]">Date :</span>
                        <input
                          type="date"
                          value={bonDate}
                          onChange={(e) => setBonDate(e.target.value)}
                          className="border-b border-dotted border-slate-600 px-1 py-0.5 bg-transparent font-mono text-xs focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <span className="min-w-[70px]">Heure :</span>
                        <input
                          type="text"
                          value={bonHeure}
                          onChange={(e) => setBonHeure(e.target.value)}
                          placeholder="14:30"
                          className="border-b border-dotted border-slate-600 px-1 py-0.5 bg-transparent font-mono text-xs w-28 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <span className="min-w-[70px]">N° d'ordre :</span>
                        <input
                          type="text"
                          value={bonNumOrdre}
                          onChange={(e) => setBonNumOrdre(e.target.value)}
                          placeholder="0012/2026"
                          className="border-b border-dotted border-slate-600 px-1 py-0.5 bg-transparent font-mono text-xs w-28 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <span className="min-w-[70px]">Secteur :</span>
                        <input
                          type="text"
                          value={bonSecteur}
                          onChange={(e) => setBonSecteur(e.target.value)}
                          placeholder="Tit Mellil / Anfa"
                          className="border-b border-dotted border-slate-600 px-1 py-0.5 bg-transparent font-semibold text-xs w-36 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <span className="min-w-[70px]">Vendeur :</span>
                        <select
                          value={bonNomVendeur}
                          onChange={(e) => {
                            setBonNomVendeur(e.target.value);
                            playBip(800, 0.05);
                          }}
                          className="border-b border-dotted border-slate-600 px-1 py-0.5 bg-transparent font-semibold text-xs w-36 focus:outline-none focus:border-slate-900 cursor-pointer"
                        >
                          <option value="">{lang === 'fr' ? '-- Choisir --' : '-- اختر --'}</option>
                          {getDrivers().map((drv: any) => {
                            const cleanName = drv.name.split(' (')[0];
                            return (
                              <option key={drv.id} value={cleanName}>
                                {cleanName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <span className="min-w-[70px]">Chef Sect. :</span>
                        <input
                          type="text"
                          value={bonChefSecteur}
                          onChange={(e) => setBonChefSecteur(e.target.value)}
                          placeholder="Chef de Secteur"
                          className="border-b border-dotted border-slate-600 px-1 py-0.5 bg-transparent font-semibold text-xs w-36 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>

                  </div>

                  {/* CENTER BANNER TITLE & RED SERIAL STAMP */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
                    <div className="px-6 py-2 border-2 border-slate-900 rounded-full bg-slate-50 text-center font-black text-sm sm:text-base uppercase tracking-wider shadow-sm">
                      {bonType === 'prise_en_charge' ? "BON DE PRISE EN CHARGE" : "BON DE DÉCHARGE"}
                    </div>

                    <div className="text-rose-600 font-mono font-black text-lg tracking-widest uppercase flex items-center gap-1">
                      <span>N°</span>
                      <input
                        type="text"
                        value={bonNo}
                        onChange={(e) => setBonNo(e.target.value)}
                        className="bg-rose-50/60 hover:bg-rose-50 text-rose-600 font-mono font-black text-lg w-36 text-center border-b-2 border-dashed border-rose-400 focus:border-rose-600 focus:outline-none px-1 py-0.5 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBonNo(String(Math.floor(27000 + Math.random() * 70000)).padStart(8, '0'));
                          playBip(900, 0.05);
                        }}
                        className="no-print p-1 text-rose-400 hover:text-rose-600 rounded"
                        title="Générer N°"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* FORM BODY LINES WITH DOTTED UNDERLINES MATCHING PHOTOS */}
                  <div className="space-y-4 text-xs font-bold pt-2">
                    
                    {/* Line 1: Activité Client & Patente N° */}
                    <div className="flex flex-col sm:flex-row items-baseline gap-2">
                      <span className="shrink-0 text-slate-900">Activité Client :</span>
                      <input
                        type="text"
                        value={bonActiviteClient}
                        onChange={(e) => setBonActiviteClient(e.target.value)}
                        placeholder="................................................................................................"
                        className="flex-1 bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-semibold"
                      />
                      <span className="shrink-0 sm:ml-4 text-slate-900">Patente N°</span>
                      <input
                        type="text"
                        value={bonPatenteNo}
                        onChange={(e) => setBonPatenteNo(e.target.value)}
                        placeholder="..................................."
                        className="w-full sm:w-48 bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-mono"
                      />
                    </div>

                    {/* Line 2: Nom, Prénom, CIN N° */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="shrink-0 text-slate-900">Nom :</span>
                        <input
                          type="text"
                          value={bonNomClient}
                          onChange={(e) => setBonNomClient(e.target.value)}
                          placeholder="..................................."
                          className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-semibold"
                        />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="shrink-0 text-slate-900">Prénom :</span>
                        <input
                          type="text"
                          value={bonPrenomClient}
                          onChange={(e) => setBonPrenomClient(e.target.value)}
                          placeholder="..................................."
                          className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-semibold"
                        />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="shrink-0 text-slate-900">CIN N°</span>
                        <input
                          type="text"
                          value={bonCinNo}
                          onChange={(e) => setBonCinNo(e.target.value)}
                          placeholder="..................................."
                          className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Line 3: Adresse */}
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-slate-900">Adresse :</span>
                      <input
                        type="text"
                        value={bonAdresseClient}
                        onChange={(e) => setBonAdresseClient(e.target.value)}
                        placeholder="................................................................................................................................................................"
                        className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-semibold"
                      />
                    </div>

                    {/* Line 4: Congélateur marque, N°, AP / AG */}
                    <div className="flex flex-col sm:flex-row items-baseline gap-3">
                      <div className="flex items-baseline gap-1.5 flex-1">
                        <span className="shrink-0 text-slate-900">Congélateur marque :</span>
                        <input
                          type="text"
                          value={bonCongelateurMarque}
                          onChange={(e) => setBonCongelateurMarque(e.target.value)}
                          placeholder="..................................."
                          className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-semibold"
                        />
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="shrink-0 text-slate-900">N°</span>
                        <input
                          type="text"
                          value={bonCongelateurNo}
                          onChange={(e) => setBonCongelateurNo(e.target.value)}
                          placeholder="ZAHI-CF-XXXX"
                          className="w-24 bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-mono font-bold uppercase text-slate-900"
                        />
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            setBonCongelateurNo(e.target.value);
                            playBip(800, 0.04);
                            
                            try {
                              const savedListingStr = localStorage.getItem('zahi_refrigerator_listing');
                              if (savedListingStr) {
                                const listing = JSON.parse(savedListingStr);
                                const foundRec = listing.find((r: any) => r.conge.toUpperCase() === e.target.value.toUpperCase());
                                if (foundRec) {
                                  const nameParts = foundRec.clientName.split(' ');
                                  if (nameParts.length >= 2) {
                                    setBonNomClient(nameParts[0]);
                                    setBonPrenomClient(nameParts.slice(1).join(' '));
                                  } else {
                                    setBonNomClient(foundRec.clientName);
                                    setBonPrenomClient('');
                                  }
                                  setBonAdresseClient(foundRec.adresse || '');
                                  setBonTelephoneNo(foundRec.telephone || '');
                                  setBonCinNo(foundRec.cin || '');
                                  
                                  const isAp = foundRec.conge.toUpperCase().includes('AP');
                                  const isAs = foundRec.conge.toUpperCase().includes('AS');
                                  if (isAp || isAs) {
                                    setBonCongelateurType('AP');
                                  } else {
                                    setBonCongelateurType('AG');
                                  }
                                }
                              }
                            } catch (err) {}
                          }}
                          className="no-print text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 font-bold shrink-0 cursor-pointer"
                          value={getVendeurFridges().includes(bonCongelateurNo) ? bonCongelateurNo : ""}
                          title={bonNomVendeur ? `Série (${bonNomVendeur})` : "Série"}
                        >
                          <option value="">{bonNomVendeur ? `Série (${bonNomVendeur})...` : "Série..."}</option>
                          {getVendeurFridges().map(serial => (
                            <option key={serial} value={serial}>{serial}</option>
                          ))}
                        </select>
                      </div>

                      {/* AP / AG CIRCLE TOGGLES */}
                      <div className="flex items-center gap-4 shrink-0 border border-slate-800 rounded-lg px-3 py-1 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => { setBonCongelateurType('AP'); playBip(800, 0.05); }}
                          className="flex items-center gap-1.5 hover:opacity-80"
                        >
                          <span className="font-bold text-slate-900">AP</span>
                          <div className={`w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${bonCongelateurType === 'AP' ? 'bg-slate-900' : 'bg-white'}`}>
                            {bonCongelateurType === 'AP' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setBonCongelateurType('AG'); playBip(800, 0.05); }}
                          className="flex items-center gap-1.5 hover:opacity-80"
                        >
                          <span className="font-bold text-slate-900">AG</span>
                          <div className={`w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${bonCongelateurType === 'AG' ? 'bg-slate-900' : 'bg-white'}`}>
                            {bonCongelateurType === 'AG' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Line 5: Téléphone N° */}
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-slate-900">Téléphone N :</span>
                      <input
                        type="text"
                        value={bonTelephoneNo}
                        onChange={(e) => setBonTelephoneNo(e.target.value)}
                        placeholder="06 XX XX XX XX ................................................................................................................."
                        className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-mono text-slate-900"
                      />
                    </div>

                    {/* Line 6: Observation */}
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-slate-900">Observation :</span>
                      <input
                        type="text"
                        value={bonObservation}
                        onChange={(e) => setBonObservation(e.target.value)}
                        placeholder="................................................................................................................................................................"
                        className="w-full bg-transparent border-b border-dotted border-slate-700 px-1 py-0.5 focus:outline-none focus:border-slate-900 font-semibold text-slate-900"
                      />
                    </div>

                  </div>

                  {/* THREE COLUMN SIGNATURES AT BOTTOM MATCHING PHOTO */}
                  <div className="mt-8 pt-6 border-t-2 border-slate-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      
                      {/* Vendeur */}
                      <div 
                        onClick={() => signVisa('vendeur')}
                        className="p-3 border-2 border-slate-800 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-all text-left min-h-[90px] flex flex-col justify-between"
                      >
                        <span className="font-black text-xs uppercase text-slate-900">Vendeur :</span>
                        <div className="border-t border-dashed border-slate-400 pt-2 text-center">
                          {visasSigned.vendeur ? (
                            <span className="font-serif italic font-bold text-blue-700 text-sm">{visasSigned.vendeur} ✓</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>

                      {/* Client */}
                      <div 
                        onClick={() => signVisa('client')}
                        className="p-3 border-2 border-slate-800 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-all text-left min-h-[90px] flex flex-col justify-between"
                      >
                        <span className="font-black text-xs uppercase text-slate-900">Client :</span>
                        <div className="border-t border-dashed border-slate-400 pt-2 text-center">
                          {visasSigned.client ? (
                            <span className="font-serif italic font-bold text-blue-700 text-sm">{visasSigned.client} ✓</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>

                      {/* Livreur */}
                      <div 
                        onClick={() => signVisa('livreur')}
                        className="p-3 border-2 border-slate-800 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-all text-left min-h-[90px] flex flex-col justify-between"
                      >
                        <span className="font-black text-xs uppercase text-slate-900">Livreur :</span>
                        <div className="border-t border-dashed border-slate-400 pt-2 text-center">
                          {visasSigned.livreur ? (
                            <span className="font-serif italic font-bold text-blue-700 text-sm">{visasSigned.livreur} ✓</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  <input type="submit" id="hidden-bon-submit" className="hidden" />
                </form>
              ) : (
                /* EXISTING BON D'ENTRÉE / BON DE SORTIE FORM REPLICA */
                <>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-slate-800">
                    
                    {/* Brand Logo & Name */}
                    <div className="flex items-center gap-4">
                      <svg viewBox="0 0 160 100" className="h-16 w-24 shrink-0 drop-shadow-sm">
                        <ellipse cx="80" cy="46" rx="72" ry="36" fill="#3a2210" stroke="#d4af37" strokeWidth="2.5" />
                        <ellipse cx="80" cy="46" rx="66" ry="30" fill="#4d2b14" stroke="#f1d255" strokeWidth="1.5" />
                        
                        <path d="M 8 46 Q -2 60 12 68" fill="none" stroke="#d4af37" strokeWidth="2" />
                        <path d="M 152 46 Q 162 60 148 68" fill="none" stroke="#d4af37" strokeWidth="2" />
                        
                        <text x="80" y="47" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" fontFamily="'Space Grotesk', 'Arial Black', sans-serif" stroke="#1d0e04" strokeWidth="1.5" dy="4">
                          ZAHI
                        </text>
                        
                        <path d="M 36 62 L 124 62 L 116 76 L 44 76 Z" fill="#b59410" stroke="#f1d255" strokeWidth="1.2" />
                        <text x="80" y="72" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="10" fontFamily="'Inter', sans-serif" style={{ letterSpacing: '2px' }}>
                          GLACES
                        </text>
                      </svg>

                      <div className="text-left">
                        <h1 className="font-black text-slate-900 text-base tracking-wider uppercase">S.A.R.L ZAHI GLACES</h1>
                        <p className="text-[10px] text-slate-600 font-medium leading-tight">
                          Fabrication et Distribution de Crèmes Glacées<br />
                          Zone Industrielle, Tit Mellil, Casablanca<br />
                          Tél: +212 522 90 00 12
                        </p>
                      </div>
                    </div>

                    {/* Document Serial Number & Title */}
                    <div className="text-center sm:text-right space-y-1">
                      <div className="px-5 py-2 bg-slate-50 rounded-xl border-2 border-slate-800 text-center">
                        <span className="text-sm font-black text-slate-900 uppercase block tracking-widest">
                          {bonType === 'livraison' 
                            ? "BON DE LIVRAISON" 
                            : bonType === 'entry' 
                            ? "BON D'ENTRÉE" 
                            : bonType === 'sortie' 
                            ? "BON DE SORTIE" 
                            : "BON DE DÉPÔT RÉGIONAL"}
                        </span>
                        <h2 className="text-base font-bold text-slate-800 font-serif leading-tight mt-0.5">
                          Congélateurs
                        </h2>
                      </div>
                      
                      <div className="text-rose-600 font-mono font-black text-lg tracking-widest mt-1 uppercase flex items-center justify-center sm:justify-end gap-1">
                        <span className="text-rose-600 font-black">N°</span>
                        <input
                          type="text"
                          value={bonNo}
                          onChange={(e) => setBonNo(e.target.value)}
                          className="bg-rose-50/60 hover:bg-rose-50 text-rose-600 font-mono font-black text-lg w-36 text-center sm:text-right border-b-2 border-dashed border-rose-400 focus:border-rose-600 focus:bg-rose-100/60 focus:outline-none transition-all px-1 py-0.5 rounded-t"
                          title={lang === 'fr' ? 'Modifier le numéro du bon' : 'تعديل رقم السند'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBonNo(String(Math.floor(27000 + Math.random() * 70000)).padStart(8, '0'));
                            playBip(900, 0.05);
                          }}
                          className="no-print p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 rounded transition-colors"
                          title={lang === 'fr' ? 'Générer un numéro aléatoire' : 'توليد رقم عشوائي'}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* METADATA FIELDS */}
                  <form onSubmit={handleSaveBon} className="py-6 space-y-3.5 text-xs font-bold text-slate-900">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="shrink-0 text-slate-900 min-w-[140px] font-bold">
                        {bonType === 'livraison' || bonType === 'entry' ? "Date D'entrée :" : bonType === 'sortie' ? "Date De Sortie :" : "Date de Dépôt Régional :"}
                      </label>
                      <input
                        type="date"
                        required
                        value={bonDate}
                        onChange={(e) => setBonDate(e.target.value)}
                        className="flex-1 bg-white text-slate-900 border-b-2 border-dashed border-slate-400 focus:border-slate-900 focus:bg-amber-50/40 px-2 py-1 font-mono focus:outline-none transition-all cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="shrink-0 text-slate-900 min-w-[140px] font-bold flex items-center gap-1">
                        <span>Dépôt Régional :</span>
                        {bonType === 'entry' && (
                          <span className="text-[10px] text-blue-600 font-bold">({lang === 'fr' ? 'Destination depuis Casablanca' : 'الوجهة انطلاقاً من كازا'})</span>
                        )}
                      </label>
                      {bonType === 'livraison' ? (
                        <div className="flex-1 flex items-center gap-2 bg-blue-50/70 text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200">
                          <Warehouse className="h-4 w-4 text-blue-600" />
                          <span className="font-extrabold text-xs">Dépôt Casablanca</span>
                          <span className="text-[10px] text-blue-600 font-normal italic">
                            ({lang === 'fr' ? 'Fixé automatiquement : toutes les livraisons arrivent à Casablanca' : 'افتراضي ثابت: جميع التوريدات تصل لمستودع كازا'})
                          </span>
                        </div>
                      ) : (
                        <select
                          value={bonDepot}
                          onChange={(e) => setBonDepot(e.target.value)}
                          className="flex-1 bg-white text-slate-900 border-b-2 border-dashed border-slate-400 focus:border-slate-900 focus:bg-amber-50/40 px-2 py-1 focus:outline-none transition-all font-bold cursor-pointer"
                        >
                          {regionalDepots.map((dep) => (
                            <option key={dep} value={dep}>
                              Dépôt {dep}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {bonType !== 'livraison' && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="shrink-0 text-slate-900 min-w-[140px] font-bold">
                            Chef du Secteur :
                          </label>
                          <input
                            type="text"
                            placeholder="................................................................................................"
                            value={bonChefSecteur}
                            onChange={(e) => setBonChefSecteur(e.target.value)}
                            className="flex-1 bg-white text-slate-900 border-b-2 border-dashed border-slate-400 focus:border-slate-900 focus:bg-amber-50/40 px-2 py-1 focus:outline-none transition-all font-semibold"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="shrink-0 text-slate-900 min-w-[140px] font-bold flex items-center gap-1">
                            <span>Nom Vendeur :</span>
                            <span className="text-[10px] text-slate-400 font-normal italic">({lang === 'fr' ? 'Optionnel' : 'اختياري'})</span>
                          </label>
                          <select
                            value={bonNomVendeur}
                            onChange={(e) => {
                              setBonNomVendeur(e.target.value);
                              playBip(800, 0.05);
                            }}
                            className="flex-1 bg-white text-slate-900 border-b-2 border-dashed border-slate-400 focus:border-slate-900 focus:bg-amber-50/40 px-2 py-1 focus:outline-none transition-all font-semibold cursor-pointer"
                          >
                            <option value="">{lang === 'fr' ? '-- Sélectionner un Vendeur --' : '-- اختر الموزع --'}</option>
                            {getDrivers().map((drv: any) => {
                              const cleanName = drv.name.split(' (')[0];
                              return (
                                <option key={drv.id} value={cleanName}>
                                  {drv.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </>
                    )}

                    {(bonType === 'entry' || bonType === 'livraison') && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="shrink-0 text-slate-900 min-w-[140px] font-bold flex items-center gap-1">
                          <span>Camion de transfer :</span>
                          <span className="text-[10px] text-slate-400 font-normal italic">({lang === 'fr' ? 'Optionnel' : 'اختياري'})</span>
                        </label>
                        <select
                          value={bonCamionTransfert}
                          onChange={(e) => {
                            setBonCamionTransfert(e.target.value);
                            playBip(800, 0.05);
                          }}
                          className="flex-1 bg-white text-slate-900 border-b-2 border-dashed border-slate-400 focus:border-slate-900 focus:bg-amber-50/40 px-2 py-1 focus:outline-none transition-all font-semibold cursor-pointer"
                        >
                          <option value="">- Sélectionner un Camion de transfert --</option>
                          {getVehicles().map((v: any) => {
                            const desc = `${v.model} (${v.plateNumber})`;
                            return (
                              <option key={v.id} value={desc}>
                                {desc}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <input type="submit" id="hidden-bon-submit" className="hidden" />
                  </form>

                  {/* QUICK LOAD FROM CASABLANCA STOCK OR HISTORIQUE DES BONS FOR BON D'ENTRÉE */}
                  {bonType === 'entry' && (() => {
                    const casaFridges = fridges.filter(f => f.status === 'stock' && (f.depot || '').toLowerCase().includes('casablanca'));
                    
                    // Deduplicate Casablanca fridges strictly by serial number so no fridge can appear twice
                    const seenCasaSerials = new Set<string>();
                    const uniqueCasaFridges = casaFridges.filter(f => {
                      const norm = (f.serialNumber || '').trim().toUpperCase();
                      if (!norm || seenCasaSerials.has(norm)) return false;
                      seenCasaSerials.add(norm);
                      return true;
                    });

                    const casaAp = uniqueCasaFridges.filter(f => f.type === 'chest' || f.type === 'AP');
                    const casaAg = uniqueCasaFridges.filter(f => f.type === 'upright' || f.type === 'AG');
                    const casaAs = uniqueCasaFridges.filter(f => f.type === 'AS');

                    const handleLoadCasaFridges = () => {
                      const newAp = Array(10).fill('');
                      const newAg = Array(10).fill('');
                      const newAs = Array(10).fill('');

                      const loadedSerials = new Set<string>();

                      let apCount = 0;
                      casaAp.forEach(f => {
                        const s = f.serialNumber.trim().toUpperCase();
                        if (s && !loadedSerials.has(s) && apCount < 10) {
                          newAp[apCount++] = s;
                          loadedSerials.add(s);
                        }
                      });

                      let agCount = 0;
                      casaAg.forEach(f => {
                        const s = f.serialNumber.trim().toUpperCase();
                        if (s && !loadedSerials.has(s) && agCount < 10) {
                          newAg[agCount++] = s;
                          loadedSerials.add(s);
                        }
                      });

                      let asCount = 0;
                      casaAs.forEach(f => {
                        const s = f.serialNumber.trim().toUpperCase();
                        if (s && !loadedSerials.has(s) && asCount < 10) {
                          newAs[asCount++] = s;
                          loadedSerials.add(s);
                        }
                      });

                      setBonApRows(newAp);
                      setBonAgRows(newAg);
                      setBonAsRows(newAs);
                      playBip(1100, 0.08);
                      setBonToast({
                        message: lang === 'fr' 
                          ? `${loadedSerials.size} congélateurs uniques chargés dans le tableau (AP: ${apCount}, AG: ${agCount}, AS: ${asCount}) sans doublons !`
                          : `تم تحميل ${loadedSerials.size} ثلاجة فريدة في الجدول بدون أي تكرار (AP: ${apCount}, AG: ${agCount}, AS: ${asCount})!`,
                        type: 'success'
                      });
                    };

                    const handleLoadFromHistory = (selectedBonId: string) => {
                      if (!selectedBonId) return;
                      const bonToLoad = savedBons.find(b => b.id === selectedBonId);
                      if (bonToLoad) {
                        loadSavedBon(bonToLoad);
                        setBonType('entry'); // maintain bonType as entry
                        
                        // Enforce deduplication on rows loaded from history
                        const seen = new Set<string>();
                        setBonApRows(prev => prev.map(s => {
                          const u = s.trim().toUpperCase();
                          if (!u || seen.has(u)) return '';
                          seen.add(u);
                          return u;
                        }));
                        setBonAgRows(prev => prev.map(s => {
                          const u = s.trim().toUpperCase();
                          if (!u || seen.has(u)) return '';
                          seen.add(u);
                          return u;
                        }));
                        setBonAsRows(prev => prev.map(s => {
                          const u = s.trim().toUpperCase();
                          if (!u || seen.has(u)) return '';
                          seen.add(u);
                          return u;
                        }));

                        playBip(1200, 0.08);
                        setBonToast({
                          message: lang === 'fr' 
                            ? `Données et congélateurs uniques chargés depuis le Bon N° ${bonToLoad.bonNo} !`
                            : `تم تحميل الثلاجات الفريدة من الإذن رقم ${bonToLoad.bonNo} بنجاح دون تكرار!`,
                          type: 'success'
                        });
                      }
                    };

                    return (
                      <div className="mb-3 p-3.5 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <div className="text-xs">
                              <span className="font-extrabold text-blue-950 dark:text-white block">
                                {lang === 'fr' ? 'Stock disponible à Dépôt Casablanca :' : 'المخزون المتوفر بمستودع الدار البيضاء :'}
                              </span>
                              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                                AP: <b>{casaAp.length}</b> | AG: <b>{casaAg.length}</b> | AS: <b>{casaAs.length}</b> (Total: <b>{uniqueCasaFridges.length}</b>)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={uniqueCasaFridges.length === 0}
                              onClick={handleLoadCasaFridges}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {lang === 'fr' ? 'Charger les congélateurs de Casablanca' : 'تحميل ثلاجات كازابلانكا في الجدول'}
                            </button>
                            {(bonApRows.some(s => s) || bonAgRows.some(s => s) || bonAsRows.some(s => s)) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBonApRows(Array(10).fill(''));
                                  setBonAgRows(Array(10).fill(''));
                                  setBonAsRows(Array(10).fill(''));
                                  playBip(700, 0.04);
                                }}
                                className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all"
                                title="Vider le tableau"
                              >
                                {lang === 'fr' ? 'Vider' : 'تفريغ'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* LOAD DIRECTLY FROM HISTORIQUE DES BONS */}
                        <div className="pt-2 border-t border-blue-200/60 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {lang === 'fr' ? 'Ou charger depuis un Bon de l\'Historique :' : 'أو تحميل من سجل الأذونات السابق :'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-1 max-w-md">
                            <select
                              onChange={(e) => handleLoadFromHistory(e.target.value)}
                              defaultValue=""
                              className="w-full bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                            >
                              <option value="">{lang === 'fr' ? '-- Sélectionner un Bon de l\'Historique --' : '-- اختر إذن من السجل للتحميل --'}</option>
                              {savedBons
                                .filter(b => (b.apRows && b.apRows.some((s: string) => s)) || (b.agRows && b.agRows.some((s: string) => s)) || b.type === 'livraison' || b.type === 'entry')
                                .map(b => {
                                  const apC = (b.apRows || []).filter((s: string) => s).length;
                                  const agC = (b.agRows || []).filter((s: string) => s).length;
                                  const asC = (b.asRows || []).filter((s: string) => s).length;
                                  const typeName = b.type === 'livraison' ? 'Livraison' : b.type === 'entry' ? 'Entrée' : b.type;
                                  return (
                                    <option key={b.id} value={b.id}>
                                      {typeName} N° {b.bonNo} ({b.depot || 'Casablanca'}) - {apC + agC + asC} fridges ({b.date})
                                    </option>
                                  );
                                })}
                            </select>

                            <button
                              type="button"
                              onClick={() => { setActiveSubTab('historique'); playBip(800, 0.05); }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition-all flex items-center gap-1 shadow-sm"
                            >
                              <History className="h-3.5 w-3.5" />
                              {lang === 'fr' ? 'Historique' : 'السجل'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* HTML5 DATALISTS - FILTERING OUT ALREADY USED SERIALS TO PREVENT DUPLICATES */}
                  {(() => {
                    const usedSerialsSet = new Set([
                      ...bonApRows.map(s => s.trim().toUpperCase()),
                      ...bonAgRows.map(s => s.trim().toUpperCase()),
                      ...bonAsRows.map(s => s.trim().toUpperCase())
                    ].filter(Boolean));

                    return (
                      <>
                        <datalist id="bon-casa-ap-list">
                          {fridges
                            .filter(f => f.status === 'stock' && (f.type === 'chest' || f.type === 'AP') && (bonType !== 'entry' || (f.depot || '').toLowerCase().includes('casablanca')))
                            .filter(f => !usedSerialsSet.has((f.serialNumber || '').trim().toUpperCase()))
                            .map(f => (
                              <option key={f.id} value={f.serialNumber}>{f.serialNumber} - ({f.depot || 'Casablanca'})</option>
                            ))}
                        </datalist>
                        <datalist id="bon-casa-ag-list">
                          {fridges
                            .filter(f => f.status === 'stock' && (f.type === 'upright' || f.type === 'AG') && (bonType !== 'entry' || (f.depot || '').toLowerCase().includes('casablanca')))
                            .filter(f => !usedSerialsSet.has((f.serialNumber || '').trim().toUpperCase()))
                            .map(f => (
                              <option key={f.id} value={f.serialNumber}>{f.serialNumber} - ({f.depot || 'Casablanca'})</option>
                            ))}
                        </datalist>
                        <datalist id="bon-casa-as-list">
                          {fridges
                            .filter(f => f.status === 'stock' && f.type === 'AS' && (bonType !== 'entry' || (f.depot || '').toLowerCase().includes('casablanca')))
                            .filter(f => !usedSerialsSet.has((f.serialNumber || '').trim().toUpperCase()))
                            .map(f => (
                              <option key={f.id} value={f.serialNumber}>{f.serialNumber} - ({f.depot || 'Casablanca'})</option>
                            ))}
                        </datalist>
                      </>
                    );
                  })()}

                  {/* CORE TABLE: AP VS AG VS AS */}
                  <div className="border-2 border-slate-900 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-2 shadow-sm">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase text-xs sm:text-sm border-b-2 border-slate-900 dark:border-slate-700">
                          <th colSpan={2} className="py-2.5 px-2 border-r-2 border-slate-900 dark:border-slate-700 w-1/3 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-300">
                            AP (Coffre)
                          </th>
                          <th colSpan={2} className="py-2.5 px-2 border-r-2 border-slate-900 dark:border-slate-700 w-1/3 bg-amber-50/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-300">
                            AG (Vitrine)
                          </th>
                          <th colSpan={2} className="py-2.5 px-2 w-1/3 bg-purple-50/50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-300">
                            AS (Spécial)
                          </th>
                        </tr>
                      </thead>
                      
                      <tbody>
                        {[0, 1, 2, 3, 4].map((rowIdx) => {
                          const apIdx1 = rowIdx * 2;
                          const apIdx2 = rowIdx * 2 + 1;
                          const agIdx1 = rowIdx * 2;
                          const agIdx2 = rowIdx * 2 + 1;
                          const asIdx1 = rowIdx * 2;
                          const asIdx2 = rowIdx * 2 + 1;

                          return (
                            <tr key={rowIdx} className="border-b border-slate-300 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              
                              {/* AP 1 */}
                              <td className="py-1 px-1 border-r border-slate-300 dark:border-slate-700 w-1/6 relative group">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    list="bon-casa-ap-list"
                                    placeholder="............"
                                    value={bonApRows[apIdx1] || ''}
                                    onChange={(e) => handleUpdateBonRow('AP', apIdx1, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-center font-mono font-black text-slate-950 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-amber-50/60 dark:focus:bg-slate-800 py-1.5 px-1 text-xs focus:outline-none transition-all tracking-tight"
                                  />
                                  {bonApRows[apIdx1] ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBonRow('AP', apIdx1, '')}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 text-xs font-black transition-opacity px-0.5"
                                      title="Effacer"
                                    >
                                      ×
                                    </button>
                                  ) : bonType !== 'entry' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = `ZAHI-CF-${Math.floor(100000 + Math.random() * 900000)}`;
                                        handleUpdateBonRow('AP', apIdx1, rand);
                                        playBip(900, 0.05);
                                      }}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 font-bold px-0.5"
                                      title="Générer N°"
                                    >
                                      +
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                              {/* AP 2 */}
                              <td className="py-1 px-1 border-r-2 border-slate-900 dark:border-slate-700 w-1/6 relative group">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    list="bon-casa-ap-list"
                                    placeholder="............"
                                    value={bonApRows[apIdx2] || ''}
                                    onChange={(e) => handleUpdateBonRow('AP', apIdx2, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-center font-mono font-black text-slate-950 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-amber-50/60 dark:focus:bg-slate-800 py-1.5 px-1 text-xs focus:outline-none transition-all tracking-tight"
                                  />
                                  {bonApRows[apIdx2] ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBonRow('AP', apIdx2, '')}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 text-xs font-black transition-opacity px-0.5"
                                      title="Effacer"
                                    >
                                      ×
                                    </button>
                                  ) : bonType !== 'entry' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = `ZAHI-CF-${Math.floor(100000 + Math.random() * 900000)}`;
                                        handleUpdateBonRow('AP', apIdx2, rand);
                                        playBip(900, 0.05);
                                      }}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 font-bold px-0.5"
                                      title="Générer N°"
                                    >
                                      +
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                              {/* AG 1 */}
                              <td className="py-1 px-1 border-r border-slate-300 dark:border-slate-700 w-1/6 relative group">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    list="bon-casa-ag-list"
                                    placeholder="............"
                                    value={bonAgRows[agIdx1] || ''}
                                    onChange={(e) => handleUpdateBonRow('AG', agIdx1, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-center font-mono font-black text-slate-950 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-amber-50/60 dark:focus:bg-slate-800 py-1.5 px-1 text-xs focus:outline-none transition-all tracking-tight"
                                  />
                                  {bonAgRows[agIdx1] ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBonRow('AG', agIdx1, '')}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 text-xs font-black transition-opacity px-0.5"
                                      title="Effacer"
                                    >
                                      ×
                                    </button>
                                  ) : bonType !== 'entry' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = `ZAHI-VD-${Math.floor(100000 + Math.random() * 900000)}`;
                                        handleUpdateBonRow('AG', agIdx1, rand);
                                        playBip(900, 0.05);
                                      }}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 font-bold px-0.5"
                                      title="Générer N°"
                                    >
                                      +
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                              {/* AG 2 */}
                              <td className="py-1 px-1 border-r-2 border-slate-900 dark:border-slate-700 w-1/6 relative group">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    list="bon-casa-ag-list"
                                    placeholder="............"
                                    value={bonAgRows[agIdx2] || ''}
                                    onChange={(e) => handleUpdateBonRow('AG', agIdx2, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-center font-mono font-black text-slate-950 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-amber-50/60 dark:focus:bg-slate-800 py-1.5 px-1 text-xs focus:outline-none transition-all tracking-tight"
                                  />
                                  {bonAgRows[agIdx2] ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBonRow('AG', agIdx2, '')}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 text-xs font-black transition-opacity px-0.5"
                                      title="Effacer"
                                    >
                                      ×
                                    </button>
                                  ) : bonType !== 'entry' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = `ZAHI-VD-${Math.floor(100000 + Math.random() * 900000)}`;
                                        handleUpdateBonRow('AG', agIdx2, rand);
                                        playBip(900, 0.05);
                                      }}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 font-bold px-0.5"
                                      title="Générer N°"
                                    >
                                      +
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                              {/* AS 1 */}
                              <td className="py-1 px-1 border-r border-slate-300 dark:border-slate-700 w-1/6 relative group">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    list="bon-casa-as-list"
                                    placeholder="............"
                                    value={bonAsRows[asIdx1] || ''}
                                    onChange={(e) => handleUpdateBonRow('AS', asIdx1, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-center font-mono font-black text-slate-950 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-amber-50/60 dark:focus:bg-slate-800 py-1.5 px-1 text-xs focus:outline-none transition-all tracking-tight"
                                  />
                                  {bonAsRows[asIdx1] ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBonRow('AS', asIdx1, '')}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 text-xs font-black transition-opacity px-0.5"
                                      title="Effacer"
                                    >
                                      ×
                                    </button>
                                  ) : bonType !== 'entry' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = `ZAHI-AS-${Math.floor(100000 + Math.random() * 900000)}`;
                                        handleUpdateBonRow('AS', asIdx1, rand);
                                        playBip(900, 0.05);
                                      }}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 font-bold px-0.5"
                                      title="Générer N°"
                                    >
                                      +
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                              {/* AS 2 */}
                              <td className="py-1 px-1 w-1/6 relative group">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    list="bon-casa-as-list"
                                    placeholder="............"
                                    value={bonAsRows[asIdx2] || ''}
                                    onChange={(e) => handleUpdateBonRow('AS', asIdx2, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-center font-mono font-black text-slate-950 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-amber-50/60 dark:focus:bg-slate-800 py-1.5 px-1 text-xs focus:outline-none transition-all tracking-tight"
                                  />
                                  {bonAsRows[asIdx2] ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBonRow('AS', asIdx2, '')}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-slate-400 text-xs font-black transition-opacity px-0.5"
                                      title="Effacer"
                                    >
                                      ×
                                    </button>
                                  ) : bonType !== 'entry' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rand = `ZAHI-AS-${Math.floor(100000 + Math.random() * 900000)}`;
                                        handleUpdateBonRow('AS', asIdx2, rand);
                                        playBip(900, 0.05);
                                      }}
                                      className="no-print absolute right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 font-bold px-0.5"
                                      title="Générer N°"
                                    >
                                      +
                                    </button>
                                  ) : null}
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* RECAP TABLE */}
                  <div className="mt-5 border-2 border-slate-900 rounded-lg overflow-hidden bg-white max-w-2xl">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-black uppercase border-b-2 border-slate-900">
                          <th className="py-2 px-3 border-r border-slate-900 text-left w-1/5">Recap</th>
                          <th className="py-2 px-3 border-r border-slate-900 w-1/5">AP</th>
                          <th className="py-2 px-3 border-r border-slate-900 w-1/5">AG</th>
                          <th className="py-2 px-3 border-r border-slate-900 w-1/5">AS</th>
                          <th className="py-2 px-3 w-1/5">Total Global</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-bold text-slate-900">
                          <td className="py-2.5 px-3 border-r border-slate-900 text-left bg-slate-50 font-black">Total</td>
                          <td className="py-2.5 px-3 border-r border-slate-900 font-mono text-sm">
                            {bonApRows.filter(s => s.trim() !== '').length}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-900 font-mono text-sm">
                            {bonAgRows.filter(s => s.trim() !== '').length}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-900 font-mono text-sm">
                            {bonAsRows.filter(s => s.trim() !== '').length}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-base font-black text-slate-950">
                            {bonApRows.filter(s => s.trim() !== '').length + bonAgRows.filter(s => s.trim() !== '').length + bonAsRows.filter(s => s.trim() !== '').length}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* VISAS / SIGNATURES GRID */}
                  <div className="mt-6 pt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div 
                        onClick={() => signVisa('vendeur')}
                        className="p-2.5 bg-white border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 transition-all text-left flex flex-col justify-between min-h-[72px]"
                      >
                        <span className="text-[10px] text-slate-900 font-black uppercase">Visa Vendeur</span>
                        <div className="h-7 flex items-center justify-center border-t border-dashed border-slate-300 mt-1">
                          {visasSigned.vendeur ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.vendeur} ✓
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>

                      <div 
                        onClick={() => signVisa('chef')}
                        className="p-2.5 bg-white border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 transition-all text-left flex flex-col justify-between min-h-[72px]"
                      >
                        <span className="text-[10px] text-slate-900 font-black uppercase">Visa Chef Du Secteur</span>
                        <div className="h-7 flex items-center justify-center border-t border-dashed border-slate-300 mt-1">
                          {visasSigned.chef ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.chef} ✓
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>

                      <div 
                        onClick={() => signVisa('frigoriste')}
                        className="p-2.5 bg-white border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 transition-all text-left flex flex-col justify-between min-h-[72px]"
                      >
                        <span className="text-[10px] text-slate-900 font-black uppercase">Visa Frigoriste</span>
                        <div className="h-7 flex items-center justify-center border-t border-dashed border-slate-300 mt-1">
                          {visasSigned.frigoriste ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.frigoriste} ✓
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center max-w-2xl mx-auto">
                      <div 
                        onClick={() => signVisa('controle')}
                        className="p-2.5 bg-white border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 transition-all text-left flex flex-col justify-between min-h-[72px]"
                      >
                        <span className="text-[10px] text-slate-900 font-black uppercase">Visa Agent de Contrôle</span>
                        <div className="h-7 flex items-center justify-center border-t border-dashed border-slate-300 mt-1">
                          {visasSigned.controle ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.controle} ✓
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>

                      <div 
                        onClick={() => signVisa('responsable')}
                        className="p-2.5 bg-white border-2 border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 transition-all text-left flex flex-col justify-between min-h-[72px]"
                      >
                        <span className="text-[10px] text-slate-900 font-black uppercase">Visa Responsable de Gestion</span>
                        <div className="h-7 flex items-center justify-center border-t border-dashed border-slate-300 mt-1">
                          {visasSigned.responsable ? (
                            <span className="font-serif italic text-xs font-black text-blue-700">
                              {visasSigned.responsable} ✓
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Cliquer pour signer</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* ACTION FOOTER BUTTONS BELOW DOCUMENT FRAME */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2 no-print">
              
              {/* Reset Signature button */}
              <button
                type="button"
                onClick={() => {
                  setVisasSigned({
                    vendeur: '',
                    chef: '',
                    frigoriste: '',
                    controle: '',
                    responsable: ''
                  });
                  playBip(600, 0.08);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                {lang === 'fr' ? 'Réinitialiser Signatures' : 'مسح التوقيعات'}
              </button>

              {/* Save & Update Stock button */}
              <button
                type="button"
                onClick={() => {
                  try {
                    handleSaveBon();
                  } catch (err) {
                    console.error("Error saving bon:", err);
                    const submitBtn = document.getElementById('hidden-bon-submit');
                    if (submitBtn) submitBtn.click();
                  }
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow"
              >
                <Check className="h-4 w-4" />
                {lang === 'fr' 
                  ? "Enregistrer & Mettre à jour le Stock" 
                  : "حفظ وتحديث المخزون الفعلي"}
              </button>

              {/* Print / Download Receipt button */}
              <button
                type="button"
                onClick={() => {
                  playBip(1400, 0.1);
                  window.print();
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
              >
                <Printer className="h-4 w-4 animate-bounce" />
                {lang === 'fr' ? 'Imprimer / Télécharger (PDF)' : 'طباعة وتحميل السند (PDF)'}
              </button>

            </div>

          </div>
        )}

      {/* SUB-TAB 6: HISTORIQUE DES BONS (FULL SCREEN ARCHIVE & SEARCH DASHBOARD 2026) */}
      {activeSubTab === 'historique' && (
        <div className="p-6 max-w-full mx-auto space-y-6 w-full">
          
          {/* HEADER BANNER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-sky-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    {lang === 'fr' ? 'Historique des Bons & Contrats de Stock' : 'سجل الأذونات والعقود المحفوظة'}
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                      {savedBons.length} {lang === 'fr' ? 'Bons' : 'سند'}
                    </span>
                  </h2>
                  <p className="text-xs text-sky-200/80 mt-0.5">
                    {lang === 'fr' 
                      ? "Archive centralisée, recherche multicritères, traçabilité des transferts et impression officielle."
                      : 'إدارة وبحث وتصفح وطباعة جميع أذونات التوريد، الدخول، الخروج، الاستلام، الإخلاء وعقود الإيداع.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => { playBip(1200, 0.1); window.print(); }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-all border border-slate-700 flex items-center gap-1.5 shadow"
                title={lang === 'fr' ? 'Imprimer la liste' : 'طباعة القائمة'}
              >
                <Printer className="h-4 w-4 text-sky-400" />
                <span>{lang === 'fr' ? 'Imprimer Liste' : 'طباعة السجل'}</span>
              </button>

              <button
                type="button"
                onClick={() => { resetBonForm(); setActiveSubTab('bons'); playBip(900, 0.05); }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>{lang === 'fr' ? '+ Nouveau Formulaire' : '+ تعبئة إذن جديد'}</span>
              </button>
            </div>
          </div>

          {/* SUMMARY METRICS RIBBON (INTERACTIVE FILTER CARDS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
            {/* Total Registrés */}
            <div 
              onClick={() => { setBonHistoryFilter('all'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 group ${
                bonHistoryFilter === 'all'
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-sky-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{lang === 'fr' ? 'Total Registrés' : 'إجمالي السندات'}</span>
                <FileText className="h-4 w-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">{savedBons.length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Tous les types' : 'كافة الأذونات'}
              </span>
            </div>

            {/* Bons de Livraison */}
            <div 
              onClick={() => { setBonHistoryFilter(bonHistoryFilter === 'livraison' ? 'all' : 'livraison'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                bonHistoryFilter === 'livraison'
                  ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block uppercase">{lang === 'fr' ? 'Livraisons Usine' : 'أذونات التوريد'}</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{savedBons.filter(b => b.type === 'livraison').length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Usine -> Casablanca' : 'من المصنع للمستودع'}
              </span>
            </div>

            {/* Bons d'Entrée */}
            <div 
              onClick={() => { setBonHistoryFilter(bonHistoryFilter === 'entry' ? 'all' : 'entry'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                bonHistoryFilter === 'entry'
                  ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">{lang === 'fr' ? "Bons d'Entrée" : 'أذونات الدخول'}</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{savedBons.filter(b => b.type === 'entry').length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Depuis Casablanca' : 'تحويل من الدار البيضاء'}
              </span>
            </div>

            {/* Bons de Sortie */}
            <div 
              onClick={() => { setBonHistoryFilter(bonHistoryFilter === 'sortie' ? 'all' : 'sortie'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                bonHistoryFilter === 'sortie'
                  ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-rose-400'
              }`}
            >
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase">{lang === 'fr' ? 'Bons de Sortie' : 'أذونات الخروج'}</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{savedBons.filter(b => b.type === 'sortie').length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Vers Réseau Vente' : 'لشبكة التوزيع'}
              </span>
            </div>

            {/* Prises & Décharges */}
            <div 
              onClick={() => { setBonHistoryFilter(bonHistoryFilter === 'prise_en_charge' ? 'all' : 'prise_en_charge'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                bonHistoryFilter === 'prise_en_charge' || bonHistoryFilter === 'decharge'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">{lang === 'fr' ? 'Prises & Décharges' : 'استلام وإخلاء'}</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{savedBons.filter(b => b.type === 'prise_en_charge' || b.type === 'decharge').length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Clients Directs' : 'تسليم للعملاء'}
              </span>
            </div>

            {/* Contrats Dépôt */}
            <div 
              onClick={() => { setBonHistoryFilter(bonHistoryFilter === 'contrat_depot' ? 'all' : 'contrat_depot'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                bonHistoryFilter === 'contrat_depot'
                  ? 'bg-cyan-500/15 border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-cyan-400'
              }`}
            >
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold block uppercase">{lang === 'fr' ? 'Contrats Dépôt' : 'عقود الإيداع'}</span>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">{savedBons.filter(b => b.type === 'contrat_depot').length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Engagements légaux' : 'عقود رسمية'}
              </span>
            </div>

            {/* Dépôts Régionaux */}
            <div 
              onClick={() => { setBonHistoryFilter(bonHistoryFilter === 'depot_regional' ? 'all' : 'depot_regional'); playBip(700, 0.04); }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                bonHistoryFilter === 'depot_regional'
                  ? 'bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block uppercase">{lang === 'fr' ? 'Dépôts Régionaux' : 'المستودعات'}</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{savedBons.filter(b => b.type === 'depot_regional').length}</div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === 'fr' ? 'Transferts inter-dépôts' : 'بين المستودعات'}
              </span>
            </div>
          </div>

          {/* SEARCH AND FILTERS BAR */}
          <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={lang === 'fr' ? 'Rechercher par N°, client, vendeur, série, ville, camion...' : 'بحث برقم السند، الزبون، البائع، رقم التسلسل...'}
                value={bonHistorySearch}
                onChange={(e) => setBonHistorySearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
              {bonHistorySearch && (
                <button
                  type="button"
                  onClick={() => setBonHistorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setBonHistoryFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tous ({savedBons.length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('livraison')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'livraison'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Livraison ({savedBons.filter(b => b.type === 'livraison').length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('entry')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'entry'
                      ? 'bg-emerald-600 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Entrée ({savedBons.filter(b => b.type === 'entry').length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('sortie')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'sortie'
                      ? 'bg-rose-600 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Sortie ({savedBons.filter(b => b.type === 'sortie').length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('prise_en_charge')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'prise_en_charge'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Prise Charge ({savedBons.filter(b => b.type === 'prise_en_charge').length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('decharge')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'decharge'
                      ? 'bg-purple-600 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Décharge ({savedBons.filter(b => b.type === 'decharge').length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('contrat_depot')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'contrat_depot'
                      ? 'bg-cyan-600 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Contrat ({savedBons.filter(b => b.type === 'contrat_depot').length})
                </button>
                <button
                  onClick={() => setBonHistoryFilter('depot_regional')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    bonHistoryFilter === 'depot_regional'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Dépôts ({savedBons.filter(b => b.type === 'depot_regional').length})
                </button>
              </div>

              {/* View Switcher: Table vs Cards */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setBonHistoryViewMode('table'); playBip(800, 0.04); }}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    bonHistoryViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={lang === 'fr' ? 'Vue Tableau' : 'عرض جدول'}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{lang === 'fr' ? 'Tableau' : 'جدول'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setBonHistoryViewMode('cards'); playBip(800, 0.04); }}
                  className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    bonHistoryViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={lang === 'fr' ? 'Vue Cartes' : 'عرض بطاقات'}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">{lang === 'fr' ? 'Cartes' : 'بطاقات'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC VIEW: TABLE OR CARDS */}
          {(() => {
            const filtered = savedBons.filter(bon => {
              if (bonHistoryFilter !== 'all' && bon.type !== bonHistoryFilter) return false;
              if (!bonHistorySearch.trim()) return true;
              const query = bonHistorySearch.toLowerCase();
              const bonNoMatch = (bon.bonNo || '').toLowerCase().includes(query);
              const chefMatch = (bon.chefSecteur || '').toLowerCase().includes(query);
              const vendeurMatch = (bon.nomVendeur || '').toLowerCase().includes(query);
              const clientMatch = `${bon.nomClient || ''} ${bon.prenomClient || ''}`.toLowerCase().includes(query);
              const activiteMatch = (bon.activiteClient || '').toLowerCase().includes(query);
              const congelateurMatch = (bon.congelateurNo || '').toLowerCase().includes(query);
              const depotMatch = (bon.depot || '').toLowerCase().includes(query);
              const dateMatch = (bon.date || '').toLowerCase().includes(query);
              const camionMatch = (bon.camionTransfert || '').toLowerCase().includes(query);
              const apSerials = Array.isArray(bon.apRows) ? bon.apRows.join(' ').toLowerCase() : '';
              const agSerials = Array.isArray(bon.agRows) ? bon.agRows.join(' ').toLowerCase() : '';
              const asSerials = Array.isArray(bon.asRows) ? bon.asRows.join(' ').toLowerCase() : '';
              return bonNoMatch || chefMatch || vendeurMatch || clientMatch || activiteMatch || congelateurMatch || depotMatch || dateMatch || camionMatch || apSerials.includes(query) || agSerials.includes(query) || asSerials.includes(query);
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-16 bg-white dark:bg-slate-850 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-3">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center text-slate-400">
                    <FileText className="h-7 w-7" />
                  </div>
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                    {lang === 'fr' ? "Aucun bon correspondant dans l'historique." : 'لا يوجد أي إذن أومستند مطابق في السجل.'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {lang === 'fr' ? "Essayez de modifier vos critères de recherche ou créez un nouveau bon de transfert." : "يرجى تعديل مصطلحات البحث أو تعبئة إذن جديد."}
                  </p>
                  <button
                    onClick={() => { resetBonForm(); setActiveSubTab('bons'); playBip(900, 0.05); }}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'fr' ? '+ Créer un Nouveau Bon' : '+ إنشاء إذن جديد'}</span>
                  </button>
                </div>
              );
            }

            // TABLE VIEW
            if (bonHistoryViewMode === 'table') {
              return (
                <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">{lang === 'fr' ? 'N° Bon & Date' : 'رقم السند والتاريخ'}</th>
                          <th className="py-3.5 px-4">{lang === 'fr' ? 'Type de Document' : 'نوع السند'}</th>
                          <th className="py-3.5 px-4">{lang === 'fr' ? 'Dépôt / Ville' : 'المستودع / المدينة'}</th>
                          <th className="py-3.5 px-4">{lang === 'fr' ? 'Destinataire / Tiers' : 'العميل / المستلم'}</th>
                          <th className="py-3.5 px-4">{lang === 'fr' ? 'Appareils (AP / AG / AS)' : 'الثلاجات المشمولة'}</th>
                          <th className="py-3.5 px-4">{lang === 'fr' ? 'Visas Signés' : 'التأشيرات'}</th>
                          <th className="py-3.5 px-4 text-right">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                        {filtered.map(bon => {
                          const apSerials = (bon.apRows || []).filter((s: string) => s && s.trim() !== '');
                          const agSerials = (bon.agRows || []).filter((s: string) => s && s.trim() !== '');
                          const asSerials = (bon.asRows || []).filter((s: string) => s && s.trim() !== '');
                          const totalCount = apSerials.length + agSerials.length + asSerials.length;
                          const visasCount = Object.values(bon.visasSigned || {}).filter((v: any) => Boolean(v) && v !== '').length;

                          const typeBadgeClass =
                            bon.type === 'livraison'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/50'
                              : bon.type === 'entry' 
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50' 
                              : bon.type === 'sortie'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50'
                              : bon.type === 'prise_en_charge'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
                              : bon.type === 'decharge'
                              ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/50'
                              : bon.type === 'depot_regional'
                              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50'
                              : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700/50';

                          const typeLabel =
                            bon.type === 'livraison'
                              ? "BON LIVRAISON"
                              : bon.type === 'entry'
                              ? "BON ENTRÉE"
                              : bon.type === 'sortie'
                              ? "BON SORTIE"
                              : bon.type === 'prise_en_charge'
                              ? "PRISE EN CHARGE"
                              : bon.type === 'decharge'
                              ? "DÉCHARGE"
                              : bon.type === 'depot_regional'
                              ? "DÉPÔT RÉGIONAL"
                              : "CONTRAT DÉPÔT";

                          return (
                            <tr key={bon.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              {/* Bon No & Date */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs block">
                                  N° {bon.bonNo}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {bon.date}
                                </span>
                              </td>

                              {/* Document Type Badge */}
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border inline-block ${typeBadgeClass}`}>
                                  {typeLabel}
                                </span>
                              </td>

                              {/* Depot / City */}
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold inline-block">
                                  {bon.depot || bon.ville || 'Casablanca'}
                                </span>
                              </td>

                              {/* Target / Beneficiary */}
                              <td className="py-3.5 px-4">
                                {bon.type === 'livraison' ? (
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs truncate max-w-[170px]">
                                      Usine &rarr; Casablanca
                                    </span>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block truncate max-w-[170px]">
                                      {bon.camionTransfert || 'Camion Transfert'}
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs truncate max-w-[170px]">
                                      {bon.nomClient ? `${bon.nomClient} ${bon.prenomClient || ''}` : bon.nomVendeur || '--'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate max-w-[170px]">
                                      {bon.chefSecteur || bon.activiteClient || '--'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Fridges summary */}
                              <td className="py-3.5 px-4 font-mono text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {apSerials.length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded font-bold text-[10px]">
                                      AP:{apSerials.length}
                                    </span>
                                  )}
                                  {agSerials.length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded font-bold text-[10px]">
                                      AG:{agSerials.length}
                                    </span>
                                  )}
                                  {asSerials.length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded font-bold text-[10px]">
                                      AS:{asSerials.length}
                                    </span>
                                  )}
                                  {bon.congelateurNo && (
                                    <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-bold text-[10px]">
                                      {bon.congelateurNo}
                                    </span>
                                  )}
                                  {totalCount === 0 && !bon.congelateurNo && (
                                    <span className="text-slate-400 italic text-[10px] font-sans">0 appareil</span>
                                  )}
                                </div>
                              </td>

                              {/* Visas */}
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  visasCount >= 4 
                                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                }`}>
                                  {visasCount}/5 Visas
                                </span>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setViewingBonModal(bon)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                                    title={lang === 'fr' ? 'Aperçu Plein Écran' : 'معاينة'}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => { loadSavedBon(bon); playBip(900, 0.05); }}
                                    className="p-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                    title={lang === 'fr' ? 'Éditer' : 'تعديل'}
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handlePrintSavedBon(bon)}
                                    className="p-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 text-amber-800 dark:text-amber-300 rounded-lg transition-all cursor-pointer"
                                    title={lang === 'fr' ? 'Imprimer le Bon' : 'طباعة'}
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBon(bon.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                                    title={lang === 'fr' ? 'Supprimer' : 'حذف'}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // CARDS VIEW
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(bon => {
                  const apSerials = (bon.apRows || []).filter((s: string) => s && s.trim() !== '');
                  const agSerials = (bon.agRows || []).filter((s: string) => s && s.trim() !== '');
                  const asSerials = (bon.asRows || []).filter((s: string) => s && s.trim() !== '');
                  const totalCount = apSerials.length + agSerials.length + asSerials.length;
                  const isExpanded = expandedBonId === bon.id;
                  const visasCount = Object.values(bon.visasSigned || {}).filter((v: any) => Boolean(v) && v !== '').length;

                  return (
                    <div
                      key={bon.id}
                      className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-3 relative flex flex-col justify-between overflow-hidden max-w-full"
                    >
                      <div className="space-y-3">
                        {/* Top Header Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            bon.type === 'livraison'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                              : bon.type === 'entry' 
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                              : bon.type === 'sortie'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                              : bon.type === 'prise_en_charge'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : bon.type === 'decharge'
                              ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300'
                              : bon.type === 'depot_regional'
                              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                              : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300'
                          }`}>
                            {bon.type === 'livraison'
                              ? "BON LIVRAISON"
                              : bon.type === 'entry'
                              ? "BON ENTRÉE"
                              : bon.type === 'sortie'
                              ? "BON SORTIE"
                              : bon.type === 'prise_en_charge'
                              ? "PRISE EN CHARGE"
                              : bon.type === 'decharge'
                              ? "DÉCHARGE"
                              : bon.type === 'depot_regional'
                              ? "DÉPÔT RÉGIONAL"
                              : "CONTRAT DÉPÔT"}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {bon.date}
                          </span>
                        </div>

                        {/* Bon N° & Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm tracking-wide">
                              N° {bon.bonNo}
                            </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-bold text-slate-600 dark:text-slate-300">
                              Dépôt {bon.depot || bon.ville || 'Casablanca'}
                            </span>
                          </div>

                          {/* People / Logistics Involved */}
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            {bon.type === 'livraison' ? (
                              <>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Origine &rarr; Cible</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                    Usine &rarr; Casablanca
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Camion Transfert</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400 truncate block">
                                    {bon.camionTransfert || 'Non spécifié'}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client / Vendeur</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                    {bon.nomClient ? `${bon.nomClient} ${bon.prenomClient || ''}` : bon.nomVendeur || '--'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Chef / Agent</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                    {bon.chefSecteur || '--'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Serial & Visas summary */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-600 dark:text-slate-400 font-bold">
                              AP: <b className="text-slate-900 dark:text-white">{apSerials.length}</b> | AG: <b className="text-slate-900 dark:text-white">{agSerials.length}</b> | AS: <b className="text-slate-900 dark:text-white">{asSerials.length}</b>
                            </span>
                            <span className={`text-xs font-bold ${visasCount >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {visasCount}/5 Visas
                            </span>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-xs space-y-2">
                            <div>
                              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Séries d&apos;appareils :</span>
                              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                                {apSerials.map((s: string, idx: number) => (
                                  <span key={`ap-${idx}`} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono text-xs rounded-md font-bold">
                                    AP: {s}
                                  </span>
                                ))}
                                {agSerials.map((s: string, idx: number) => (
                                  <span key={`ag-${idx}`} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-mono text-xs rounded-md font-bold">
                                    AG: {s}
                                  </span>
                                ))}
                                {asSerials.map((s: string, idx: number) => (
                                  <span key={`as-${idx}`} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono text-xs rounded-md font-bold">
                                    AS: {s}
                                  </span>
                                ))}
                                {bon.congelateurNo && (
                                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs rounded-md font-bold">
                                    {bon.congelateurType || 'REF'}: {bon.congelateurNo}
                                  </span>
                                )}
                                {totalCount === 0 && !bon.congelateurNo && (
                                  <span className="text-slate-400 italic">Aucun numéro enregistré</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedBonId(isExpanded ? null : bon.id)}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-bold shrink-0 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {isExpanded ? 'Réduire' : 'Détails'}
                        </button>

                        <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                          {/* Load / Edit */}
                          <button
                            type="button"
                            onClick={() => { loadSavedBon(bon); playBip(900, 0.05); }}
                            className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Ouvrir dans le formulaire"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>{lang === 'fr' ? 'Éditer' : 'تعديل'}</span>
                          </button>

                          {/* Full Screen View */}
                          <button
                            type="button"
                            onClick={() => setViewingBonModal(bon)}
                            className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow cursor-pointer"
                            title="Aperçu Plein Écran"
                          >
                            <Eye className="h-3.5 w-3.5 text-amber-400" />
                            <span>{lang === 'fr' ? 'Aperçu' : 'معاينة'}</span>
                          </button>

                          {/* Direct Print */}
                          <button
                            type="button"
                            onClick={() => handlePrintSavedBon(bon)}
                            className="p-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 text-amber-800 dark:text-amber-300 rounded-xl transition-all shrink-0 cursor-pointer"
                            title="Imprimer le Bon"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBon(bon.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all shrink-0 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>
      )}

      {/* FULL BON DETAIL MODAL OVERLAY */}
      {viewingBonModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            
            {/* Modal Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <span className="font-bold text-sm">
                  Détail Complet du {
                    viewingBonModal.type === 'livraison'
                      ? "Bon de Livraison"
                      : viewingBonModal.type === 'entry'
                      ? "Bon d'Entrée"
                      : viewingBonModal.type === 'sortie'
                      ? "Bon de Sortie"
                      : viewingBonModal.type === 'prise_en_charge'
                      ? "Bon de Prise en Charge"
                      : viewingBonModal.type === 'decharge'
                      ? "Bon de Décharge"
                      : "Contrat de Dépôt"
                  } N° {viewingBonModal.bonNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePrintSavedBon(viewingBonModal);
                    setViewingBonModal(null);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadSavedBon(viewingBonModal);
                    setViewingBonModal(null);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier dans l'Éditeur
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBonModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content: Paper Form Replica */}
            <div className="p-6 overflow-y-auto bg-slate-100 text-slate-900 space-y-4">
              <div className="bg-white text-slate-900 p-8 rounded-xl border-2 border-slate-800 shadow-md font-sans">
                
                {viewingBonModal.type === 'contrat_depot' ? (
                  /* CONTRAT DE DÉPÔT MODAL VIEW */
                  <div className="space-y-4 text-xs text-right" dir="rtl">
                    <div className="flex justify-between items-center pb-4 border-b-2 border-slate-800">
                      <div className="text-left font-mono text-[10px]" dir="ltr">
                        <b>Zahi Glace</b><br />
                        Siège & Usine : Route 3301 Ouled Sidi Abdenbi<br />
                        Chellalatte - Mohammedia
                      </div>
                      <div className="text-center">
                        <span className="font-black text-sm uppercase block">عقد إيداع ثلاجة مجمدة</span>
                        <span className="text-rose-600 font-mono font-black text-base block mt-0.5">
                          N° {viewingBonModal.bonNo}
                        </span>
                      </div>
                      <div className="text-right text-[10px]">
                        <b>زاهي كلاص</b><br />
                        طريق 3301 سيدي عبد النبي<br />
                        الشلالات - المحمدية
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs p-3 bg-slate-50 rounded-xl border border-slate-300 font-bold shadow-sm">
                      <div>التاريخ : <b className="text-slate-900">{viewingBonModal.date || '--'}</b></div>
                      <div>المدينة : <b className="text-slate-900">{viewingBonModal.ville || 'المحمدية'}</b></div>
                      <div>الصنف : <b className="text-slate-900">صنف {viewingBonModal.congelateurType || 'AP'}</b></div>
                      <div>رقم الثلاجة : <b className="font-mono text-rose-600">{viewingBonModal.congelateurNo || '--'}</b></div>
                    </div>

                    <div className="space-y-3 p-3.5 bg-white rounded-xl border border-slate-300 font-medium leading-relaxed text-xs shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><b>اسم الزبون الكامل :</b> <span className="text-slate-900 font-bold">{viewingBonModal.nomClient || '--'} {viewingBonModal.prenomClient || ''}</span></div>
                        <div><b>رقم البطاقة الوطنية (CIN) :</b> <span className="font-mono font-bold text-slate-900">{viewingBonModal.cinNo || '--'}</span></div>
                      </div>
                      <div><b>العنوان الشخصي :</b> <span className="text-slate-900">{viewingBonModal.adresseClient || '--'}</span></div>
                      <div><b>عنوان محل إيداع الثلاجة :</b> <span className="text-slate-900">{viewingBonModal.adresseLocal || viewingBonModal.adresseClient || '--'}</span></div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        <div><b>الهاتف :</b> <span className="font-mono text-slate-900 font-bold">{viewingBonModal.telephoneNo || '--'}</span></div>
                        <div><b>نوع التجارة :</b> <span className="text-slate-900">{viewingBonModal.activiteClient || '--'}</span></div>
                        <div><b>الضريبة المهنية :</b> <span className="font-mono text-slate-900">{viewingBonModal.patenteNo || '--'}</span></div>
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <b>اسم موزع الثلاجة لدى الشركة :</b> <span className="text-slate-900 font-bold">{viewingBonModal.nomLivreur || '--'}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 text-[11px] leading-relaxed text-slate-800">
                      <b className="text-slate-950 font-black block mb-1">الشروط الأساسية للعقد :</b>
                      تتعهد الشركة بتسليم ثلاجة للزبون كوديعة لبيع منتجات زاهي كلاص حصرياً والمحافظة عليها. وفي حالة الإخلال يلتزم الزبون بأداء <b>300 درهم عن كل يوم تأخير</b>، ويكون هذا العقد مصادقاً عليه من طرف السلطات المحلية (المقاطعة).
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">توقيعات العقد</span>
                      <div className="grid grid-cols-2 gap-3 text-center text-[10px]">
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">الطرف الأول (Zahi Glaces)</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.responsable || 'موقع إدارياً'}</span>
                        </div>
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">الطرف الثاني الزبون</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.client || 'موقع ومصادق'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : viewingBonModal.type === 'prise_en_charge' || viewingBonModal.type === 'decharge' ? (
                  /* PRISE EN CHARGE / DÉCHARGE MODAL VIEW */
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 160 100" className="h-14 w-20 shrink-0">
                          <ellipse cx="80" cy="46" rx="72" ry="36" fill="#3a2210" stroke="#d4af37" strokeWidth="2.5" />
                          <ellipse cx="80" cy="46" rx="66" ry="30" fill="#4d2b14" stroke="#f1d255" strokeWidth="1.5" />
                          <text x="80" y="47" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" stroke="#1d0e04" strokeWidth="1.5" dy="4">ZAHI</text>
                          <path d="M 36 62 L 124 62 L 116 76 L 44 76 Z" fill="#b59410" stroke="#f1d255" strokeWidth="1.2" />
                          <text x="80" y="72" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="10">GLACES</text>
                        </svg>
                        <div className="text-[10px]">
                          <h1 className="font-black text-slate-900 uppercase">S.A.R.L ZAHI GLACES</h1>
                          <p className="text-slate-600">Route 3301 Ouled Sidi Abdenbi, Chellalatte - Mohammedia</p>
                          <p className="text-slate-600">Tél: 06 61 39 97 41 / 06 62 13 04 85</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-slate-100 rounded border border-slate-800 font-black uppercase tracking-wider block text-xs">
                          {viewingBonModal.type === 'prise_en_charge' ? "BON DE PRISE EN CHARGE" : "BON DE DÉCHARGE"}
                        </span>
                        <span className="text-rose-600 font-mono font-black text-base block mt-1">
                          N° {viewingBonModal.bonNo}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2 bg-slate-50 rounded border border-slate-200">
                      <div>Date : <b>{viewingBonModal.date || '--'}</b></div>
                      <div>Heure : <b>{viewingBonModal.heure || '--'}</b></div>
                      <div>N° d'ordre : <b>{viewingBonModal.numOrdre || '--'}</b></div>
                      <div>Secteur : <b>{viewingBonModal.secteur || '--'}</b></div>
                    </div>

                    <div className="space-y-2 p-3 bg-white rounded border border-slate-300 font-medium leading-relaxed">
                      <div><b>Activité Client :</b> {viewingBonModal.activiteClient || '--'} &nbsp;|&nbsp; <b>Patente N° :</b> {viewingBonModal.patenteNo || '--'}</div>
                      <div><b>Nom & Prénom :</b> {viewingBonModal.nomClient || '--'} {viewingBonModal.prenomClient || ''} &nbsp;|&nbsp; <b>CIN N° :</b> {viewingBonModal.cinNo || '--'}</div>
                      <div><b>Adresse :</b> {viewingBonModal.adresseClient || '--'}</div>
                      <div>
                        <b>Congélateur :</b> {viewingBonModal.congelateurMarque || 'Marque N/A'} &nbsp;|&nbsp; 
                        <b>N° :</b> <span className="font-mono font-bold text-rose-600">{viewingBonModal.congelateurNo || '--'}</span> &nbsp;|&nbsp; 
                        <b>Type :</b> <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-bold">{viewingBonModal.congelateurType || 'AP'}</span>
                      </div>
                      <div><b>Téléphone N° :</b> <span className="font-mono">{viewingBonModal.telephoneNo || '--'}</span></div>
                      <div><b>Observation :</b> {viewingBonModal.observation || '--'}</div>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Visas enregistrés</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">Vendeur</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.vendeur || 'Non signé'}</span>
                        </div>
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">Client</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.client || 'Non signé'}</span>
                        </div>
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">Livreur</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.livreur || 'Non signé'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EXISTING ENTRY / SORTIE MODAL VIEW */
                  <>
                    {/* Header */}
                    <div className="flex justify-between items-center pb-6 border-b-2 border-slate-800">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 160 100" className="h-14 w-20 shrink-0">
                          <ellipse cx="80" cy="46" rx="72" ry="36" fill="#3a2210" stroke="#d4af37" strokeWidth="2.5" />
                          <ellipse cx="80" cy="46" rx="66" ry="30" fill="#4d2b14" stroke="#f1d255" strokeWidth="1.5" />
                          <text x="80" y="47" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="24" stroke="#1d0e04" strokeWidth="1.5" dy="4">ZAHI</text>
                          <path d="M 36 62 L 124 62 L 116 76 L 44 76 Z" fill="#b59410" stroke="#f1d255" strokeWidth="1.2" />
                          <text x="80" y="72" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="10">GLACES</text>
                        </svg>
                        <div>
                          <h1 className="font-black text-slate-900 text-sm uppercase">S.A.R.L ZAHI GLACES</h1>
                          <p className="text-[10px] text-slate-600">Fabrication et Distribution de Crèmes Glacées<br />Zone Industrielle, Tit Mellil, Casablanca</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="px-4 py-1.5 bg-slate-50 rounded-lg border-2 border-slate-800 text-center">
                          <span className="text-xs font-black uppercase tracking-wider block">
                            {viewingBonModal.type === 'livraison' ? "BON DE LIVRAISON" : viewingBonModal.type === 'entry' ? "BON D'ENTRÉE" : viewingBonModal.type === 'sortie' ? "BON DE SORTIE" : "BON DE DÉPÔT RÉGIONAL"}
                          </span>
                          <h2 className="text-sm font-bold font-serif">Congélateurs</h2>
                        </div>
                        <div className="text-rose-600 font-mono font-black text-base uppercase">
                          N° {viewingBonModal.bonNo}
                        </div>
                      </div>
                    </div>

                     {/* Metadata */}
                     <div className="py-4 space-y-2 text-xs font-bold border-b border-slate-300">
                       <div className="flex justify-between">
                         <span>Date: <b className="text-slate-800">{viewingBonModal.date}</b></span>
                         <span>Dépôt: <b className="text-slate-800">{viewingBonModal.depot || 'Casablanca'}</b></span>
                       </div>
                       {viewingBonModal.type !== 'livraison' && (
                         <div className="flex justify-between">
                           <span>Chef du Secteur: <b className="text-slate-800">{viewingBonModal.chefSecteur || '--'}</b></span>
                           <span>Nom Vendeur: <b className="text-slate-800">{viewingBonModal.nomVendeur || '--'}</b></span>
                         </div>
                       )}
                       {viewingBonModal.camionTransfert && (
                         <div className="flex justify-between border-t border-slate-200 pt-1.5 text-blue-700 dark:text-blue-500">
                           <span>{lang === 'fr' ? 'Camion de transfert (Expédition):' : 'شاحنة النقل (الشحن):'}</span>
                           <b className="font-extrabold uppercase">{viewingBonModal.camionTransfert}</b>
                         </div>
                       )}
                     </div>

                    {/* Table AP / AG / AS */}
                    <div className="my-4 border-2 border-slate-900 rounded overflow-hidden">
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 font-black border-b-2 border-slate-900">
                            <th colSpan={2} className="py-1.5 border-r-2 border-slate-900 w-1/3">AP (Coffre)</th>
                            <th colSpan={2} className="py-1.5 border-r-2 border-slate-900 w-1/3">AG (Vitrine)</th>
                            <th colSpan={2} className="py-1.5 w-1/3">AS (Spécial)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[0, 1, 2, 3, 4].map((rIdx) => {
                            const ap1 = viewingBonModal.apRows?.[rIdx * 2] || '';
                            const ap2 = viewingBonModal.apRows?.[rIdx * 2 + 1] || '';
                            const ag1 = viewingBonModal.agRows?.[rIdx * 2] || '';
                            const ag2 = viewingBonModal.agRows?.[rIdx * 2 + 1] || '';
                            const as1 = viewingBonModal.asRows?.[rIdx * 2] || '';
                            const as2 = viewingBonModal.asRows?.[rIdx * 2 + 1] || '';
                            return (
                              <tr key={rIdx} className="border-b border-slate-200">
                                <td className="py-1 border-r border-slate-200 font-mono text-[11px] font-bold">{ap1 || '—'}</td>
                                <td className="py-1 border-r-2 border-slate-900 font-mono text-[11px] font-bold">{ap2 || '—'}</td>
                                <td className="py-1 border-r border-slate-200 font-mono text-[11px] font-bold">{ag1 || '—'}</td>
                                <td className="py-1 border-r-2 border-slate-900 font-mono text-[11px] font-bold">{ag2 || '—'}</td>
                                <td className="py-1 border-r border-slate-200 font-mono text-[11px] font-bold">{as1 || '—'}</td>
                                <td className="py-1 font-mono text-[11px] font-bold">{as2 || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Visas */}
                    <div className="mt-4 pt-3 border-t-2 border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Visas de contrôle enregistrés</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">Visa Vendeur</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.vendeur || 'Non signé'}</span>
                        </div>
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">Chef Secteur</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.chef || 'Non signé'}</span>
                        </div>
                        <div className="p-2 border border-slate-800 rounded bg-slate-50">
                          <b className="block">Frigoriste</b>
                          <span className="font-serif italic font-bold text-blue-700">{viewingBonModal.visasSigned?.frigoriste || 'Non signé'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM REFRIGERATOR DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {fridgeToDelete && (() => {
          const target = fridges.find(f => f.id === fridgeToDelete);
          if (!target) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 border-2 border-red-500/20 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-4 text-slate-800 dark:text-slate-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => { setFridgeToDelete(null); playBip(850, 0.08); }}
                  className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header / Warning Icon */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-950/40 rounded-2xl text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase leading-tight">
                      {lang === 'fr' ? 'Confirmation de suppression' : 'تأكيد الحذف'}
                    </h3>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      {lang === 'fr' ? 'Action Irréversible' : 'إجراء غير قابل للتراجع'}
                    </p>
                  </div>
                </div>

                {/* Main Warning message */}
                <div className="space-y-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  <p>
                    {lang === 'fr' 
                      ? "Êtes-vous absolument sûr de vouloir supprimer définitivement ce réfrigérateur de la base de données de l'inventaire ?"
                      : "هل أنت متأكد تمامًا من رغبتك في حذف هذه الثلاجة نهائيًا من قاعدة بيانات المخزون؟"
                    }
                  </p>
                </div>

                {/* Refrigerator Card Details Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'fr' ? 'ID Interne :' : 'المعرف الداخلي :'}</span>
                    <span className="font-mono font-bold text-slate-850 dark:text-slate-200">{target.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'fr' ? 'N° de Série :' : 'رقم التسلسل :'}</span>
                    <span className="font-mono font-black text-red-600 dark:text-red-400">{target.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'fr' ? 'Dépôt :' : 'المستودع :'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{target.depot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{lang === 'fr' ? 'Modèle / Catégorie :' : 'الموديل / الفئة :'}</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {target.type === 'AS' ? 'AS : 500 L' : target.type === 'AG' ? 'AG : 400 L' : 'AP : 300 L'}
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setFridgeToDelete(null); playBip(850, 0.08); }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer text-center"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteFridge}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{lang === 'fr' ? 'Supprimer' : 'تأكيد الحذف'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* FOOTER NOTICE */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span><b>Zahi Secure IoT Hub</b> - Chiffrement AES-256 localisé</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{lang === 'fr' ? 'Version Logiciel : v4.2.1-Live' : 'نسخة النظام: v4.2.1-Live'}</span>
          <span>•</span>
          <span>8 Regional Depots Monitored</span>
        </div>
      </div>

    </div>
  );
}
