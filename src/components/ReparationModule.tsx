/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  ShieldAlert, 
  Gauge, 
  Timer, 
  Search, 
  Plus, 
  Trash2, 
  Play, 
  Calendar, 
  DollarSign, 
  Hammer, 
  Cpu, 
  MapPin, 
  Clock, 
  Settings,
  ChevronRight,
  Thermometer,
  FileText
} from 'lucide-react';
import { Vehicle } from './VehicleDriverModule';

interface ReparationModuleProps {
  lang: 'fr' | 'ar';
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  currentUser: any;
}

interface RepairTicket {
  id: string;
  vehicleId: string;
  vehicleModel: string;
  vehicleType: 'transport' | 'livraison';
  component: 'Compressor' | 'Refrigerant' | 'Insulation' | 'Sensor' | 'Engine';
  description: string;
  cost: number;
  status: 'A planifier' | 'En cours' | 'Resolu';
  createdAt: string;
  completedAt?: string;
  priority: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
}

export default function ReparationModule({ lang, vehicles, setVehicles, currentUser }: ReparationModuleProps) {
  const isAr = lang === 'ar';

  // --- Translation Dictionary ---
  const t = {
    fr: {
      title: "Système de Réparation & Maintenance",
      subtitle: "Gestion de l'atelier de réparation mécanique, climatisation, et conformité de chaîne du froid pour camions d'expédition et véhicules de dépôt.",
      statsActiveRepairs: "Réparations en cours",
      statsSystemStatus: "Santé Frigo Moyenne",
      statsAlertCount: "Camions en panne",
      statsBudgetSpent: "Budget Maintenance",
      vehicleSelect: "Sélectionner un véhicule",
      allVehicles: "Tous les véhicules",
      transportsOnly: "Camions d'Expédition",
      livraisonsOnly: "Véhicules de Dépôt",
      component: "Composant",
      description: "Description de la panne",
      cost: "Coût estimé (MAD)",
      priority: "Priorité",
      status: "Statut",
      addTicket: "Créer un Ticket de Maintenance",
      ticketList: "Tickets de Maintenance Enregistrés",
      noTickets: "Aucun ticket de maintenance pour le moment.",
      diagnosticPanel: "Diagnostic Intelligent & Scanner IoT",
      runDiagnostic: "Lancer un Diagnostic complet",
      diagnosing: "Analyse des capteurs de température...",
      diagnosticSuccess: "Diagnostic complété avec succès !",
      compressorHealth: "Santé du Compresseur",
      gasLevel: "Niveau de Fluide Frigorigène (R452a)",
      insulationIntegrity: "Étanchéité des Parois",
      sensorCalibration: "Calibrage des Sondes",
      engineStatus: "Moteur & Alternateur",
      initiateRepair: "Lancer la Réparation Interactive",
      repairProgress: "Progression de la Réparation",
      complete: "Réparation Terminée ! Le véhicule est opérationnel.",
      activeWorkshop: "Atelier Mécanique Zahi Glaces (Simulateur)",
      vehicleWorkshopEmpty: "Aucun véhicule en cours de réparation dans l'atelier.",
      backToAvailable: "Remettre en service disponible",
      priorityLow: "Basse",
      priorityMedium: "Moyenne",
      priorityHigh: "Haute",
      priorityCritical: "Critique",
      ticketCreated: "Ticket créé avec succès !",
      ticketDeleted: "Ticket supprimé.",
      repairStarted: "Le véhicule est entré à l'atelier de réparation.",
      componentCompressor: "Compresseur de Climatisation",
      componentRefrigerant: "Gaz Réfrigérant & Fuites",
      componentInsulation: "Isolation thermique de la caisse",
      componentSensor: "Sonde de Température IoT",
      componentEngine: "Moteur / Courroie"
    },
    ar: {
      title: "نظام الإصلاح والصيانة الذكي",
      subtitle: "إدارة ورشة الإصلاح الميكانيكي، والتبريد، ومطابقة سلسلة التبريد لشاحنات الشحن (Expédition) ومركبات التوزيع (Dépôts).",
      statsActiveRepairs: "إصلاحات قيد العمل",
      statsSystemStatus: "صحة نظام التبريد",
      statsAlertCount: "المركبات المعطلة",
      statsBudgetSpent: "ميزانية الصيانة",
      vehicleSelect: "اختر المركبة",
      allVehicles: "جميع المركبات",
      transportsOnly: "شاحنات الشحن الكبيرة",
      livraisonsOnly: "سيارات التوزيع للمستودعات",
      component: "العضو / الجزء المعطل",
      description: "وصف العطل بالتفصيل",
      cost: "التكلفة التقديرية (درهم)",
      priority: "الأولوية",
      status: "الحالة",
      addTicket: "إنشاء تذكرة صيانة جديدة",
      ticketList: "سجل تذاكر الصيانة المسجلة",
      noTickets: "لا توجد تذاكر صيانة حالياً.",
      diagnosticPanel: "الفحص الذكي وتشخيص مستشعرات IoT",
      runDiagnostic: "بدأ فحص النظام الشامل",
      diagnosing: "جاري تحليل مستشعرات درجة الحرارة ونظام الفريون...",
      diagnosticSuccess: "اكتمل الفحص والتشخيص بنجاح!",
      compressorHealth: "كفاءة الضاغط (Compressor)",
      gasLevel: "مستوى غاز الفريون (R452a)",
      insulationIntegrity: "إغلاق وعزل الصندوق الخلفي",
      sensorCalibration: "معايرة مستشعر الحرارة الذكي",
      engineStatus: "المحرك والدينامو المغذي",
      initiateRepair: "بدء عملية الإصلاح التفاعلية",
      repairProgress: "تقدم عملية الإصلاح الحالية",
      complete: "اكتمل الإصلاح بنجاح! المركبة جاهزة للعمل.",
      activeWorkshop: "ورشة الصيانة الميكانيكية لشركة زاهي للمثلجات (محاكاة)",
      vehicleWorkshopEmpty: "الورشة فارغة حالياً. لا توجد مركبات قيد الإصلاح.",
      backToAvailable: "إعادة المركبة إلى الخدمة النشطة",
      priorityLow: "منخفضة",
      priorityMedium: "متوسطة",
      priorityHigh: "عالية",
      priorityCritical: "حرجة جداً",
      ticketCreated: "تم إنشاء تذكرة الصيانة بنجاح!",
      ticketDeleted: "تم حذف تذكرة الصيانة.",
      repairStarted: "دخلت المركبة إلى ورشة الصيانة والإصلاح.",
      componentCompressor: "ضاغط التبريد الرئيسي",
      componentRefrigerant: "غاز التبريد والتسريب",
      componentInsulation: "العزل الحراري لهيكل الصندوق",
      componentSensor: "معايرة مستشعر الحرارة الرقمي",
      componentEngine: "سير التبريد والمحرك"
    }
  };

  const currT = isAr ? t.ar : t.fr;

  // --- States ---
  const [tickets, setTickets] = useState<RepairTicket[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_repair_tickets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'TCK-001',
        vehicleId: 'TRK-EXP-103',
        vehicleModel: 'Renault Trucks T-High',
        vehicleType: 'transport',
        component: 'Compressor',
        description: 'Compresseur de climatisation bloqué. Perte totale du froid (-15°C au lieu de -22°C).',
        cost: 6500,
        status: 'En cours',
        createdAt: '2026-07-02T10:00:00Z',
        priority: 'Critique'
      },
      {
        id: 'TCK-002',
        vehicleId: 'VAN-LIV-203',
        vehicleModel: 'Isuzu Elf Freezer',
        vehicleType: 'livraison',
        component: 'Refrigerant',
        description: 'Légère baisse de pression du gaz R452a, recharge nécessaire avant la prochaine tournée.',
        cost: 1200,
        status: 'A planifier',
        createdAt: '2026-07-03T14:30:00Z',
        priority: 'Moyenne'
      }
    ];
  });

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'transport' | 'livraison'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<'Compressor' | 'Refrigerant' | 'Insulation' | 'Sensor' | 'Engine'>('Compressor');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCost, setTicketCost] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Basse' | 'Moyenne' | 'Haute' | 'Critique'>('Moyenne');

  // Interactive diagnostic states
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);
  const [diagnosticVehicleId, setDiagnosticVehicleId] = useState('');

  // Interactive Repair simulation states
  const [simulatingVehicleId, setSimulatingVehicleId] = useState<string | null>(null);
  const [repairStep, setRepairStep] = useState(0); // 0: Idle, 1: Disassembly, 2: Fixing, 3: Testing, 4: Complete
  const [repairProgress, setRepairProgress] = useState(0);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('zahi_repair_tickets', JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  // Handle simulated repair interval
  useEffect(() => {
    let timer: any;
    if (simulatingVehicleId && repairProgress < 100) {
      timer = setInterval(() => {
        setRepairProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(timer);
            setRepairStep(4);
            // Auto update ticket status and vehicle status
            setTickets(prevTickets => prevTickets.map(t => {
              if (t.vehicleId === simulatingVehicleId && t.status === 'En cours') {
                return { ...t, status: 'Resolu', completedAt: new Date().toISOString() };
              }
              return t;
            }));
            
            // Auto update vehicle status to Disponible
            setVehicles(prevVehicles => prevVehicles.map(v => {
              if (v.id === simulatingVehicleId) {
                return { ...v, status: 'Disponible', currentTemp: -20.0, isRefrigerationOn: true };
              }
              return v;
            }));
            return 100;
          }
          // Set repair step based on progress
          if (next < 30) setRepairStep(1);
          else if (next < 70) setRepairStep(2);
          else setRepairStep(3);
          
          return next;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [simulatingVehicleId, repairProgress]);

  // --- Handlers ---
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !ticketDescription || !ticketCost) return;

    const matchedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!matchedVehicle) return;

    const newTicket: RepairTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: selectedVehicleId,
      vehicleModel: matchedVehicle.model,
      vehicleType: matchedVehicle.type,
      component: selectedComponent,
      description: ticketDescription,
      cost: Number(ticketCost),
      status: 'A planifier',
      createdAt: new Date().toISOString(),
      priority: ticketPriority
    };

    setTickets(prev => [newTicket, ...prev]);
    
    // Set vehicle status to En maintenance
    setVehicles(prevVehicles => prevVehicles.map(v => {
      if (v.id === selectedVehicleId) {
        return { ...v, status: 'En maintenance' };
      }
      return v;
    }));

    // Reset Form
    setSelectedVehicleId('');
    setTicketDescription('');
    setTicketCost('');
    setTicketPriority('Moyenne');
  };

  const handleDeleteTicket = (ticketId: string, vehicleId: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف تذكرة الصيانة هذه؟' : 'Voulez-vous supprimer ce ticket ?')) {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      // Put vehicle back to Disponible if they have no other active tickets
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return { ...v, status: 'Disponible' };
        }
        return v;
      }));
    }
  };

  const handleStartRepair = (vehicleId: string) => {
    // Put vehicle in En maintenance
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return { ...v, status: 'En maintenance' };
      }
      return v;
    }));

    // Update tickets
    setTickets(prev => prev.map(t => {
      if (t.vehicleId === vehicleId && t.status === 'A planifier') {
        return { ...t, status: 'En cours' };
      }
      return t;
    }));

    // Launch simulation
    setSimulatingVehicleId(vehicleId);
    setRepairProgress(0);
    setRepairStep(1);
  };

  const handleRunDiagnostic = (vehicleId: string) => {
    if (!vehicleId) return;
    setIsDiagnosing(true);
    setDiagnosticResult(null);

    // Simulate diagnostic check
    setTimeout(() => {
      const isOk = Math.random() > 0.3;
      setDiagnosticResult({
        compressor: isOk ? 95 : 42,
        gas: isOk ? 98 : 64,
        insulation: isOk ? 92 : 78,
        sensors: 100,
        engine: isOk ? 96 : 50,
        recommendation: isOk 
          ? (isAr ? "جميع الأنظمة تعمل بكفاءة تامة وسلسلة التبريد مستقرة." : "Tous les systèmes fonctionnent de manière optimale. Aucun défaut détecté.")
          : (isAr ? "دواعي صيانة عاجلة لضاغط التبريد مع تسرب خفيف للفريون." : "Compresseur frigorifique fatigué ou fuite de fluide R452a détectée.")
      });
      setIsDiagnosing(false);
    }, 1500);
  };

  // --- Calculations ---
  const activeRepairsCount = tickets.filter(t => t.status === 'En cours').length;
  const planifiedTicketsCount = tickets.filter(t => t.status === 'A planifier').length;
  const totalCostSpent = tickets.reduce((sum, t) => sum + t.cost, 0);

  // Filter vehicles that can be submitted for repair
  const filterAvailableVehicles = vehicles;

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    if (selectedCategory !== 'all' && t.vehicleType !== selectedCategory) return false;
    const q = searchQuery.toLowerCase();
    return t.vehicleModel.toLowerCase().includes(q) || t.vehicleId.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Creative Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Wrench className="h-64 w-64" />
        </div>
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-6 w-6 text-teal-200 animate-spin-slow" />
            {currT.title}
          </h2>
          <p className="text-xs text-teal-100 max-w-2xl leading-relaxed">
            {currT.subtitle}
          </p>
        </div>
        <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/20 text-xxs font-mono shrink-0">
          {isAr ? "مدير الصيانة:" : "Chef d'atelier:"} <b>{currentUser.name}</b>
        </div>
      </div>

      {/* 2. Interactive KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currT.statsActiveRepairs}</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-lg"><Clock className="h-4 w-4 animate-pulse" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{activeRepairsCount + planifiedTicketsCount}</h3>
            <p className="text-[10px] text-amber-500 mt-1 font-semibold flex items-center gap-1">
              <span>{activeRepairsCount} {isAr ? "تحت الإصلاح" : "en atelier"}</span>
              <span>•</span>
              <span>{planifiedTicketsCount} {isAr ? "مجدولة" : "en attente"}</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currT.statsSystemStatus}</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg"><Activity className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-500 font-mono">96.4%</h3>
            <p className="text-[10px] text-slate-400 mt-1">{isAr ? "كفاءة مبردات شاحنات زاهي" : "Efficacité globale du froid Zahi"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currT.statsAlertCount}</span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg"><ShieldAlert className="h-4 w-4 text-rose-500 animate-bounce" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-500 font-mono">
              {vehicles.filter(v => v.status === 'Alerte' || v.currentTemp > -18).length}
            </h3>
            <p className="text-[10px] text-rose-400 mt-1 font-medium">{isAr ? "تجاوزت حرارتها -18 درجة" : "Problème thermique détecté"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currT.statsBudgetSpent}</span>
            <div className="p-1.5 bg-teal-50 dark:bg-teal-950/20 text-teal-500 rounded-lg"><DollarSign className="h-4 w-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-teal-500 font-mono">{totalCostSpent.toLocaleString()} MAD</h3>
            <p className="text-[10px] text-slate-400 mt-1">{isAr ? "إجمالي المنفق على الصيانة" : "Total des coûts engagés"}</p>
          </div>
        </div>

      </div>

      {/* 3. Interactive Diagnostic & Mechanic Workshop simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Diagnostic Simulator & Visual Diagram */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-teal-500" />
              {currT.diagnosticPanel}
            </h3>
            <span className="text-[9px] px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-sm font-bold uppercase">IoT Scanner</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <p className="text-xxs text-slate-400 leading-relaxed">
                {isAr 
                  ? "اختر مركبة مبردة مخصصة للآيس كريم لمطابقة تشخيص الحرارة، وفحص صحة ضاغط الفريون، ومعايرة مستشعرات IoT عن بُعد."
                  : "Sélectionnez un camion ou une camionnette frigorifique pour effectuer un test d'intégrité de la chaîne du froid, d'efficience du compresseur et de calibrage des sondes IoT."}
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">{currT.vehicleSelect}</label>
                <select
                  value={diagnosticVehicleId}
                  onChange={(e) => {
                    setDiagnosticVehicleId(e.target.value);
                    setDiagnosticResult(null);
                  }}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden"
                >
                  <option value="">{isAr ? "-- اختر مركبة مبردة --" : "-- Choisir un véhicule --"}</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.id}) - {v.type === 'transport' ? 'Expédition' : 'Dépôt'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleRunDiagnostic(diagnosticVehicleId)}
                disabled={!diagnosticVehicleId || isDiagnosing}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:dark:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Activity className="h-4 w-4 animate-pulse" />
                {isDiagnosing ? currT.diagnosing : currT.runDiagnostic}
              </button>
            </div>

            {/* Diagnostic Interactive Circular gauges */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 p-4 flex flex-col justify-center items-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isDiagnosing ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-3"
                  >
                    <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xxs font-mono text-teal-500 animate-pulse">{isAr ? "جاري الاتصال بوحدة الـ ECU..." : "Connexion au boîtier ECU..."}</p>
                  </motion.div>
                ) : diagnosticResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-3"
                  >
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider text-center">{currT.diagnosticSuccess}</h4>
                    
                    <div className="space-y-2 text-xxs">
                      {/* Gauge bars */}
                      <div>
                        <div className="flex justify-between font-bold mb-0.5 text-slate-500">
                          <span>{currT.compressorHealth}</span>
                          <span className={diagnosticResult.compressor > 60 ? 'text-emerald-500' : 'text-rose-500'}>{diagnosticResult.compressor}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${diagnosticResult.compressor}%` }} className={`h-full ${diagnosticResult.compressor > 60 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-0.5 text-slate-500">
                          <span>{currT.gasLevel}</span>
                          <span className={diagnosticResult.gas > 70 ? 'text-emerald-500' : 'text-rose-500'}>{diagnosticResult.gas}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${diagnosticResult.gas}%` }} className={`h-full ${diagnosticResult.gas > 70 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-0.5 text-slate-500">
                          <span>{currT.insulationIntegrity}</span>
                          <span className="text-emerald-500">{diagnosticResult.insulation}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${diagnosticResult.insulation}%` }} className="h-full bg-emerald-500" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-0.5 text-slate-500">
                          <span>{currT.engineStatus}</span>
                          <span className={diagnosticResult.engine > 60 ? 'text-emerald-500' : 'text-amber-500'}>{diagnosticResult.engine}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${diagnosticResult.engine}%` }} className={`h-full ${diagnosticResult.engine > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 bg-teal-500/5 dark:bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20 leading-relaxed font-semibold">
                      {diagnosticResult.recommendation}
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-2 py-4">
                    <Gauge className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto animate-bounce" />
                    <p className="text-xxs text-slate-400 font-semibold">{isAr ? "الرجاء اختيار مركبة والضغط على فحص" : "Choisissez un véhicule pour lancer l'analyse."}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mechanic Live Workshop Repair Simulator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-500 animate-spin-slow" />
                {currT.activeWorkshop}
              </h3>
            </div>

            {simulatingVehicleId ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-lg shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                      {vehicles.find(v => v.id === simulatingVehicleId)?.model}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 block">{simulatingVehicleId}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xxs font-bold">
                    <span className="text-amber-500 flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 animate-spin" />
                      {repairStep === 1 ? (isAr ? "تفكيك نظام التبريد..." : "Démontage du circuit...") :
                       repairStep === 2 ? (isAr ? "استبدال الأجزاء المعطلة وصيانة الفريون..." : "Remplacement du compresseur...") :
                       repairStep === 3 ? (isAr ? "اختبار ضغط التبريد (-20 درجة)..." : "Test de compression frigo...") :
                       (isAr ? "اكتمل الإصلاح!" : "Conformité validée !")}
                    </span>
                    <span className="font-mono">{repairProgress}%</span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                    <motion.div 
                      className="bg-amber-500 h-full rounded-full"
                      animate={{ width: `${repairProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>

                {/* Animated Mechanics Garage Scene */}
                <div className="h-24 relative bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 overflow-hidden flex items-center justify-center">
                  {/* Background grid */}
                  <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900 opacity-30" />
                  
                  {/* Workshop elements */}
                  <motion.div 
                    animate={{ x: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="flex items-center gap-4 relative z-10"
                  >
                    <Hammer className="h-6 w-6 text-amber-500 animate-bounce" />
                    <Wrench className="h-6 w-6 text-teal-500 animate-spin-slow" />
                    <Truck className="h-10 w-10 text-slate-400 dark:text-slate-600 animate-pulse" />
                  </motion.div>

                  <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-bold text-slate-400">
                    <span>{isAr ? "الأدوات اليدوية" : "Outillage manuel"}</span>
                    <span>{isAr ? "الغاز R452a" : "Fluide R452a"}</span>
                  </div>
                </div>

                {repairProgress >= 100 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xxs font-bold rounded-lg text-center flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {currT.complete}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Wrench className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xxs text-slate-400 font-semibold leading-relaxed">
                  {currT.vehicleWorkshopEmpty}
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-medium">
                  {isAr ? "*ابدأ عملية إصلاح لتتبع التقدم هنا" : "*Lancez une réparation pour suivre la progression ici."}
                </div>
              </div>
            )}
          </div>

          {simulatingVehicleId && repairProgress >= 100 && (
            <button
              type="button"
              onClick={() => {
                setSimulatingVehicleId(null);
                setRepairProgress(0);
                setRepairStep(0);
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xxs transition-colors cursor-pointer mt-4"
            >
              {currT.backToAvailable}
            </button>
          )}
        </div>

      </div>

      {/* 4. Ticket Creation form & Tickets Grid list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Ticket Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Plus className="h-4.5 w-4.5 text-emerald-500" />
            {currT.addTicket}
          </h3>

          <form onSubmit={handleAddTicket} className="space-y-3">
            {/* Vehicle selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{currT.vehicleSelect}</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="">{isAr ? "-- اختر مركبة --" : "-- Choisir véhicule --"}</option>
                {filterAvailableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.model} ({v.id}) - {v.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Component */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{currT.component}</label>
              <select
                value={selectedComponent}
                onChange={(e) => setSelectedComponent(e.target.value as any)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="Compressor">{currT.componentCompressor}</option>
                <option value="Refrigerant">{currT.componentRefrigerant}</option>
                <option value="Insulation">{currT.componentInsulation}</option>
                <option value="Sensor">{currT.componentSensor}</option>
                <option value="Engine">{currT.componentEngine}</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{currT.description}</label>
              <textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                required
                rows={3}
                placeholder={isAr ? "تفاصيل إضافية عن العطل والحرارة..." : "Détails de l'anomalie de température ou problème frigo..."}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Cost */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{currT.cost}</label>
                <input
                  type="number"
                  value={ticketCost}
                  onChange={(e) => setTicketCost(e.target.value)}
                  required
                  placeholder="e.g. 1500"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{currT.priority}</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="Basse">{currT.priorityLow}</option>
                  <option value="Moyenne">{currT.priorityMedium}</option>
                  <option value="Haute">{currT.priorityHigh}</option>
                  <option value="Critique">{currT.priorityCritical}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              {currT.addTicket}
            </button>
          </form>
        </div>

        {/* Tickets Grid list */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Sub Filters & Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl self-start sm:self-auto w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedCategory === 'all' ? 'bg-slate-900 dark:bg-slate-800 text-white' : 'text-slate-500'
                }`}
              >
                {currT.allVehicles}
              </button>
              <button
                onClick={() => setSelectedCategory('transport')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedCategory === 'transport' ? 'bg-slate-900 dark:bg-slate-800 text-white' : 'text-slate-500'
                }`}
              >
                {currT.transportsOnly}
              </button>
              <button
                onClick={() => setSelectedCategory('livraison')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedCategory === 'livraison' ? 'bg-slate-900 dark:bg-slate-800 text-white' : 'text-slate-500'
                }`}
              >
                {currT.livraisonsOnly}
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder={isAr ? "البحث في تذاكر الصيانة..." : "Rechercher un ticket..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tickets Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xxs text-slate-400 font-semibold">{currT.noTickets}</p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isCrit = ticket.priority === 'Critique' || ticket.priority === 'Haute';
                
                return (
                  <div
                    key={ticket.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all ${
                      isCrit 
                        ? 'border-rose-100 dark:border-rose-950/40 bg-gradient-to-b from-white to-rose-50/10 dark:from-slate-900 dark:to-rose-950/5' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm ${
                          ticket.vehicleType === 'transport'
                            ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                            : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {ticket.vehicleType === 'transport' ? 'Expédition' : 'Dépôt'}
                        </span>

                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                          ticket.priority === 'Critique' ? 'bg-rose-100 text-rose-700' :
                          ticket.priority === 'Haute' ? 'bg-orange-100 text-orange-700' :
                          ticket.priority === 'Moyenne' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {ticket.vehicleModel}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 block">{ticket.vehicleId} • Ticket {ticket.id}</span>
                      </div>

                      {/* Component info */}
                      <div className="my-2.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850 flex items-center gap-2">
                        {ticket.component === 'Compressor' ? <Cpu className="h-4 w-4 text-teal-500" /> :
                         ticket.component === 'Refrigerant' ? <Thermometer className="h-4 w-4 text-sky-500 animate-pulse" /> :
                         ticket.component === 'Insulation' ? <ShieldAlert className="h-4 w-4 text-amber-500" /> :
                         ticket.component === 'Sensor' ? <Activity className="h-4 w-4 text-indigo-500" /> :
                         <Settings className="h-4 w-4 text-violet-500 animate-spin-slow" />}
                        <div className="min-w-0">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">{currT.component}</span>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate block">
                            {ticket.component === 'Compressor' ? currT.componentCompressor :
                             ticket.component === 'Refrigerant' ? currT.componentRefrigerant :
                             ticket.component === 'Insulation' ? currT.componentInsulation :
                             ticket.component === 'Sensor' ? currT.componentSensor :
                             currT.componentEngine}
                          </span>
                        </div>
                      </div>

                      {/* Description text */}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic mb-3">
                        "{ticket.description}"
                      </p>
                    </div>

                    {/* Bottom Status & Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xxs mt-2">
                      <div className="font-mono font-black text-slate-700 dark:text-slate-200">
                        {ticket.cost.toLocaleString()} MAD
                      </div>

                      <div className="flex items-center gap-2">
                        {ticket.status === 'A planifier' && (
                          <button
                            type="button"
                            onClick={() => handleStartRepair(ticket.vehicleId)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-slate-950" />
                            {isAr ? "إصلاح الآن" : "Réparer"}
                          </button>
                        )}

                        {ticket.status === 'En cours' && (
                          <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold rounded-md flex items-center gap-1 animate-pulse text-[10px]">
                            <Clock className="h-3 w-3" />
                            {isAr ? "جاري العمل" : "En cours"}
                          </span>
                        )}

                        {ticket.status === 'Resolu' && (
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold rounded-md flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            {isAr ? "تم الإصلاح" : "Résolu"}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(ticket.id, ticket.vehicleId)}
                          className="p-1 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
