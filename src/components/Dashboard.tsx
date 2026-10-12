/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemState, Product, User } from '../types';
import { translations } from '../translations';
import { 
  Database, 
  IceCream, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Thermometer, 
  Clock, 
  Truck, 
  MapPin, 
  Activity, 
  RefreshCw,
  Search,
  Layers,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  PlusCircle,
  X,
  AlertOctagon,
  ArrowUpRight,
  Factory,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  onRefresh?: () => void;
  currentUser?: User;
  onNavigateTab?: (tab: string) => void;
  onReportLoss?: (lossData: {
    location: string;
    type: 'damaged' | 'expired';
    quantity: number;
    productId: string;
    batchId?: string;
    notes?: string;
  }) => Promise<void>;
}

type TimeFilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function Dashboard({ 
  state, 
  lang, 
  onRefresh, 
  currentUser, 
  onNavigateTab,
  onReportLoss 
}: DashboardProps) {
  const t = translations[lang];

  // 1. Time / Recharge Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() => new Date().toLocaleTimeString());

  // 2. Product & Gamme Filters for Stock Table
  const [selectedGamme, setSelectedGamme] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState<string>('');

  // 3. Loss Declaration Modal state (interconnected with Déclarer Pertes / Écarts)
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [lossDepotName, setLossDepotName] = useState<string>('Magasin Usine');
  const [lossProductId, setLossProductId] = useState<string>('');
  const [lossType, setLossType] = useState<'damaged' | 'expired'>('damaged');
  const [lossQty, setLossQty] = useState<number>(5);
  const [lossNotes, setLossNotes] = useState<string>('');
  const [isSubmittingLoss, setIsSubmittingLoss] = useState(false);
  const [lossSuccessMsg, setLossSuccessMsg] = useState<string | null>(null);

  // 4. Depot history modal
  const [historyDepotName, setHistoryDepotName] = useState<string | null>(null);

  // Handle Refresh
  const handleReloadData = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setLastRefreshedAt(new Date().toLocaleTimeString());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Helper date filter predicate
  const isDateInFilter = (dateStr?: string) => {
    if (!dateStr) return true;
    const itemDate = dateStr.split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    if (timeFilter === 'all') return true;
    if (timeFilter === 'today') return itemDate === today;

    if (timeFilter === 'week') {
      const target = new Date(itemDate).getTime();
      const now = new Date().getTime();
      const diffDays = (now - target) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    if (timeFilter === 'month') {
      const target = new Date(itemDate).getTime();
      const now = new Date().getTime();
      const diffDays = (now - target) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }

    if (timeFilter === 'custom') {
      return itemDate >= customStartDate && itemDate <= customEndDate;
    }

    return true;
  };

  // KPI Calculations
  const totalStockCount = useMemo(() => {
    const factory = state.stockPositions.reduce((sum, sp) => sum + sp.quantity, 0);
    const depots = Object.values(state.depots).reduce(
      (sum, d) => sum + d.stock.reduce((s, p) => s + p.quantity, 0), 
      0
    );
    const trucks = state.trucks.reduce(
      (sum, trk) => sum + trk.stock.reduce((s, p) => s + (p.loaded - p.delivered - p.returned - p.lost), 0), 
      0
    );
    return factory + depots + trucks;
  }, [state]);

  const productionInPeriod = useMemo(() => {
    return state.batches
      .filter(b => isDateInFilter(b.productionDate))
      .reduce((sum, b) => sum + b.quantity, 0);
  }, [state.batches, timeFilter, customStartDate, customEndDate]);

  const activeTransfers = useMemo(() => {
    return state.transfers.filter(tr => tr.status === 'In Transit' || tr.status === 'Pending').length;
  }, [state.transfers]);

  const totalLossesInPeriod = useMemo(() => {
    // 1. Factory batch losses in period
    const batchLosses = state.batches
      .filter(b => isDateInFilter(b.productionDate))
      .reduce((sum, b) => sum + (b.quantityDamaged || 0) + (b.quantityExpired || 0), 0);

    // 2. Transfer losses
    const transferLosses = state.transfers
      .filter(tr => isDateInFilter(tr.date))
      .reduce((sum, tr) => sum + (tr.lossCount || 0), 0);

    // 3. Depot adjustments declared as losses / damaged in period
    const depotLosses = Object.values(state.depots).reduce((sum, d) => {
      const adjSum = d.adjustments
        .filter(a => (a.type === 'damaged' || a.type === 'lost') && isDateInFilter(a.date))
        .reduce((s, a) => s + a.quantity, 0);
      return sum + adjSum;
    }, 0);

    return batchLosses + transferLosses + depotLosses;
  }, [state, timeFilter, customStartDate, customEndDate]);

  // Unique Gammes
  const allGammes = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [state.products]);

  // Products with Stock Breakdown
  const productsStockList = useMemo(() => {
    return state.products.map(p => {
      const factoryQty = state.stockPositions
        .filter(sp => sp.productId === p.id && sp.location.includes('Usine'))
        .reduce((sum, s) => sum + s.quantity, 0);

      const miczQty = state.stockPositions
        .filter(sp => sp.productId === p.id && (sp.location.includes('MICZ') || sp.location.includes('Logistique')))
        .reduce((sum, s) => sum + s.quantity, 0);

      const depotsQty = Object.values(state.depots).reduce((sum, d) => {
        return sum + d.stock.filter(s => s.productId === p.id).reduce((s, x) => s + x.quantity, 0);
      }, 0);

      const totalQty = factoryQty + miczQty + depotsQty;

      return {
        ...p,
        factoryQty,
        miczQty,
        depotsQty,
        totalQty,
      };
    });
  }, [state]);

  // Filtered Products for Gamme Table
  const filteredProducts = useMemo(() => {
    return productsStockList.filter(p => {
      const matchesGamme = selectedGamme === 'ALL' || p.category === selectedGamme;
      const matchesSearch = !productSearch || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(productSearch.toLowerCase());
      return matchesGamme && matchesSearch;
    });
  }, [productsStockList, selectedGamme, productSearch]);

  // Warehouse Breakdown Data for 2026 Table
  const warehouseBreakdown = useMemo(() => {
    const usineStock = state.stockPositions
      .filter(s => s.location === 'Magasin Usine')
      .reduce((sum, s) => sum + s.quantity, 0);

    const miczStock = state.stockPositions
      .filter(s => s.location === 'Magasin MICZ')
      .reduce((sum, s) => sum + s.quantity, 0);

    const zoneLogStock = state.stockPositions
      .filter(s => s.location === 'Magasin Zone Logistique')
      .reduce((sum, s) => sum + s.quantity, 0);

    const depotsEntries = Object.entries(state.depots).map(([name, depot]) => {
      const depotStock = depot.stock.reduce((s, item) => s + item.quantity, 0);
      return {
        name: `Dépôt ${name}`,
        rawName: name,
        type: 'Dépôt Régional',
        stock: depotStock,
        temp: name === 'Marrakech' ? -16.5 : -18.8,
        trucks: depot.trucksCount,
        isDepot: true,
      };
    });

    const trucksStock = state.trucks.reduce((sum, trk) => {
      return sum + trk.stock.reduce((s, p) => s + (p.loaded - p.delivered - p.returned - p.lost), 0);
    }, 0);

    const baseFacilities = [
      {
        name: lang === 'fr' ? 'Magasin Usine' : 'مستودع المصنع المركزي',
        rawName: 'Magasin Usine',
        type: lang === 'fr' ? 'Unité de Production' : 'وحدة الإنتاج',
        stock: usineStock,
        temp: -19.5,
        trucks: 4,
        isDepot: false,
      },
      {
        name: 'Magasin MICZ',
        rawName: 'Magasin MICZ',
        type: lang === 'fr' ? 'Hub Central' : 'مركز لوجستي محوري',
        stock: miczStock,
        temp: -18.2,
        trucks: 3,
        isDepot: false,
      },
      {
        name: lang === 'fr' ? 'Zone Logistique' : 'المنطقة اللوجستية',
        rawName: 'Magasin Zone Logistique',
        type: lang === 'fr' ? 'Plateforme Transit' : 'منصة عبور',
        stock: zoneLogStock,
        temp: -17.4,
        trucks: 2,
        isDepot: false,
      },
    ];

    const allLocations = [...baseFacilities, ...depotsEntries];
    if (trucksStock > 0) {
      allLocations.push({
        name: lang === 'fr' ? 'Flotte Camions (En Tournée)' : 'شاحنات التوزيع (في الطريق)',
        rawName: 'Camions',
        type: lang === 'fr' ? 'Stock Mobile' : 'مخزون متنقل',
        stock: trucksStock,
        temp: -20.0,
        trucks: state.trucks.length,
        isDepot: false,
      });
    }

    return allLocations;
  }, [state, lang]);

  // Submit Quick Loss Declaration (Connected to Production Usine / losses API)
  const handleSubmitLossDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lossProductId) {
      alert(lang === 'fr' ? 'Veuillez sélectionner un produit.' : 'يرجى اختيار المنتج.');
      return;
    }
    if (lossQty <= 0) {
      alert(lang === 'fr' ? 'Veuillez entrer une quantité valide.' : 'يرجى إدخال كمية صحيحة.');
      return;
    }

    setIsSubmittingLoss(true);
    try {
      if (onReportLoss) {
        await onReportLoss({
          location: lossDepotName,
          type: lossType,
          quantity: Number(lossQty),
          productId: lossProductId,
          notes: lossNotes || `Déclaré depuis le Tableau de Bord par ${currentUser?.name || 'Admin'}`
        });
      } else {
        await fetch('/api/losses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: lossDepotName,
            type: lossType,
            quantity: Number(lossQty),
            productId: lossProductId,
            notes: lossNotes,
            user: currentUser
          })
        });
        if (onRefresh) await onRefresh();
      }

      setLossSuccessMsg(lang === 'fr' 
        ? `Perte de ${lossQty} cartons enregistrée avec succès pour ${lossDepotName} !`
        : `تم تسجيل هدر ${lossQty} كرتونة بنجاح في ${lossDepotName} !`);

      setTimeout(() => {
        setLossSuccessMsg(null);
        setIsLossModalOpen(false);
        setLossNotes('');
        setLossQty(5);
      }, 1500);

    } catch (err: any) {
      alert(err.message || 'Erreur lors de la déclaration');
    } finally {
      setIsSubmittingLoss(false);
    }
  };

  // Quick Open Loss Modal for a specific depot
  const handleOpenLossForDepot = (depotName: string) => {
    setLossDepotName(depotName);
    if (state.products.length > 0 && !lossProductId) {
      setLossProductId(state.products[0].id);
    }
    setIsLossModalOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR: TITLE + REAL-TIME BADGE + ADVANCED RECHARGE FILTER */}
      {/* ========================================================================= */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {lang === 'fr' ? 'Tableau de Bord Exécutif' : 'لوحة التحكم والمتابعة اللحظية'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                {lang === 'fr' ? 'Temps Réel' : 'بيانات لحظية'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>{lang === 'fr' ? 'Dernière actualisation :' : 'آخر مزامنة :'}</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lastRefreshedAt}</span>
            </p>
          </div>
        </div>

        {/* Advanced Time Filters & Reload Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          
          {/* Quick period buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === 'today'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Aujourd\'hui' : 'اليوم'}
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === 'week'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Semaine' : 'أسبوعياً'}
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === 'month'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Mois' : 'شهرياً'}
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Global' : 'الكل'}
            </button>
            <button
              onClick={() => setTimeFilter('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                timeFilter === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{lang === 'fr' ? 'Plage' : 'فترة'}</span>
            </button>
          </div>

          {/* Custom Date Range Picker when 'custom' selected */}
          {timeFilter === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700"
            >
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg text-xs font-mono font-semibold border border-slate-200 dark:border-slate-700 outline-none"
              />
              <span className="text-slate-400">→</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg text-xs font-mono font-semibold border border-slate-200 dark:border-slate-700 outline-none"
              />
            </motion.div>
          )}

          {/* Reload Button */}
          <button
            onClick={handleReloadData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            title={lang === 'fr' ? 'Recharger les données en direct' : 'تحديث البيانات لحظياً'}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'fr' ? 'Recharger' : 'تحديث'}</span>
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. REFINED 4-CARD KPI GRID (Livraisons & CA Removed) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Stock Global (Cartons) */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-slate-50 to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 p-5 rounded-3xl border border-sky-100 dark:border-sky-900/40 shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                {t.totalStock}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 font-mono tracking-tight">
                {totalStockCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl shadow-md shadow-sky-500/25 shrink-0">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-100/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'fr' ? 'Cartons en stock' : 'كرتونة متوفرة'}</span>
            <span className="font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 rounded-full text-[10px]">
              {state.products.length} {lang === 'fr' ? 'références' : 'منتج'}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Production sur la période */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-slate-50 to-yellow-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/40 shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                {timeFilter === 'today' ? t.todayProduction : (lang === 'fr' ? 'Production (Période)' : 'الإنتاج بالفترة')}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 font-mono tracking-tight">
                {productionInPeriod.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl shadow-md shadow-amber-500/25 shrink-0">
              <IceCream className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'fr' ? 'Cartons fabriqués' : 'كرتونة مصنعة'}</span>
            <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full text-[10px]">
              {state.batches.filter(b => isDateInFilter(b.productionDate)).length} {lang === 'fr' ? 'lots' : 'دفعة'}
            </span>
          </div>
        </motion.div>

        {/* Card 3: Transferts Actifs */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-50 to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                {lang === 'fr' ? 'Transferts Actifs' : 'التحويلات الجارية'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 font-mono tracking-tight">
                {activeTransfers}
              </h3>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/25 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-100/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'fr' ? 'Expéditions en transit' : 'شحنات قيد النقل'}</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full text-[10px]">
              {state.transfers.length} {lang === 'fr' ? 'total' : 'إجمالي'}
            </span>
          </div>
        </motion.div>

        {/* Card 4: Pertes & Écarts Déclarés */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-slate-50 to-red-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/30 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/40 shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                {lang === 'fr' ? 'Pertes & Écarts' : 'الهدر والتلف المسجل'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                {totalLossesInPeriod.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl shadow-md shadow-rose-500/25 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{lang === 'fr' ? 'Casse & Expirations' : 'تالف / منتهي الصلاحية'}</span>
            <button
              onClick={() => handleOpenLossForDepot('Magasin Usine')}
              className="font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="h-3 w-3" />
              <span>{lang === 'fr' ? 'Déclarer' : 'تسجيل'}</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: NIVEAU DE STOCK GLOBAL PAR PRODUIT (PAR GAMME - 2026 DESIGN) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              {lang === 'fr' ? 'Niveau de Stock Global par Produit & Gamme' : 'مستويات المخزون الإجمالي للمنتجات حسب كل فئة'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'fr' 
                ? 'Consolidation en temps réel des stocks entre l\'Usine centrale, les hubs et tous les dépôts régionaux.'
                : 'رؤية مركزية لحظية للمخزون متطابقة بين المصنع والمستودعات الإقليمية.'}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher un produit, code...' : 'بحث باسم المنتج أو الكود...'}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Gamme Pills Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedGamme('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedGamme === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {lang === 'fr' ? 'Toutes les gammes' : 'كل الفئات'} ({productsStockList.length})
          </button>
          {allGammes.map(gamme => {
            const count = productsStockList.filter(p => p.category === gamme).length;
            const isSelected = selectedGamme === gamme;
            return (
              <button
                key={gamme}
                onClick={() => setSelectedGamme(gamme)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{gamme}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modern 2026 Products Stock Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">{lang === 'fr' ? 'Produit' : 'المنتج'}</th>
                <th className="px-4 py-3">{lang === 'fr' ? 'Gamme' : 'الفئة'}</th>
                <th className="px-4 py-3 text-center">{lang === 'fr' ? 'Stock Usine' : 'مخزون المصنع'}</th>
                <th className="px-4 py-3 text-center">{lang === 'fr' ? 'Stock Dépôts' : 'مخزون الفروع'}</th>
                <th className="px-4 py-3 text-right">{lang === 'fr' ? 'Total (Cartons)' : 'الإجمالي'}</th>
                <th className="px-4 py-3 text-center">{lang === 'fr' ? 'Statut' : 'الحالة'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {lang === 'fr' ? 'Aucun produit trouvé dans cette gamme.' : 'لا توجد منتجات مطابقة لهذا البحث.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.totalQty === 0;
                  const isLowStock = p.totalQty > 0 && p.totalQty < 150;

                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Product Name & Barcode */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0"
                            style={{ backgroundColor: p.image && p.image.startsWith('#') ? p.image : '#3b82f6' }}
                          >
                            <IceCream className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {p.barcode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Gamme Badge */}
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Usine */}
                      <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {p.factoryQty.toLocaleString()}
                      </td>

                      {/* Stock Dépôts */}
                      <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {p.depotsQty.toLocaleString()}
                      </td>

                      {/* Total Cartons */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                          {p.totalQty.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">cartons</span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                            <XCircle className="h-3 w-3" />
                            {lang === 'fr' ? 'Rupture' : 'نفذ'}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                            <AlertTriangle className="h-3 w-3" />
                            {lang === 'fr' ? 'Faible' : 'منخفض'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                            <CheckCircle2 className="h-3 w-3" />
                            {lang === 'fr' ? 'En Stock' : 'متوفر'}
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 px-1">
          <span>
            {lang === 'fr' ? 'Affichage de' : 'عرض'} <b>{filteredProducts.length}</b> {lang === 'fr' ? 'produits sur' : 'من أصل'} <b>{state.products.length}</b>
          </span>
          <span className="font-mono">
            {lang === 'fr' ? 'Total cartons dans cette sélection :' : 'مجموع الكراتين بهذه الفئة :'} <b className="text-slate-800 dark:text-slate-200">{filteredProducts.reduce((s, p) => s + p.totalQty, 0).toLocaleString()}</b>
          </span>
        </div>

      </div>



      {/* ========================================================================= */}
      {/* 5. SECTION: PERFORMANCE & PERTES DES DÉPÔTS (CONNECTED TO DÉCLARER PERTES) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                {lang === 'fr' ? 'Performance et Pertes des Dépôts Régionaux' : 'متابعة أداء وهدر المستودعات الإقليمية'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {lang === 'fr' ? 'Lié à "Déclarer Pertes / Écarts"' : 'مرتبط بقسم هدر الإنتاج'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'fr' 
                ? 'Données de pertes et de retours synchronisées automatiquement avec les déclarations d\'écarts de l\'Usine.'
                : 'البيانات مرتبطة لحظياً بتسجيلات الهدر والتلف المصرح بها وتحديث المخزون التلقائي.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('production')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'fr' ? 'Aller à Production Usine' : 'الانتقال إلى إنتاج المصنع'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Depots Loss & Performance Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">{lang === 'fr' ? 'Dépôt' : 'المستودع'}</th>
                <th className="px-4 py-3 text-center">{lang === 'fr' ? 'Camions' : 'الشاحنات'}</th>
                <th className="px-4 py-3 text-right">{lang === 'fr' ? 'Stock Total (Cartons)' : 'إجمالي المخزون'}</th>
                <th className="px-4 py-3 text-right">{lang === 'fr' ? 'Pertes Déclarées' : 'الهدر المسجل'}</th>
                <th className="px-4 py-3 text-right">{lang === 'fr' ? 'Retours Clients' : 'المرتجعات'}</th>
                <th className="px-4 py-3 text-center">{lang === 'fr' ? 'Statut Stock' : 'حالة المخزون'}</th>
                <th className="px-4 py-3 text-center">{lang === 'fr' ? 'Action Directe' : 'إجراء مباشر'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {Object.entries(state.depots).map(([name, depot]) => {
                const totalStock = depot.stock.reduce((s, item) => s + item.quantity, 0);
                
                // Losses declared for this depot matching the period filter
                const lostCount = depot.adjustments
                  .filter(a => (a.type === 'lost' || a.type === 'damaged') && isDateInFilter(a.date))
                  .reduce((s, item) => s + item.quantity, 0);

                const returnCount = depot.returns
                  .filter(r => isDateInFilter(r.date))
                  .reduce((s, item) => s + item.quantity, 0);

                const isLow = totalStock < 300;

                return (
                  <tr key={name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span>{name}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{depot.trucksCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {totalStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-500">
                      {lostCount > 0 ? `-${lostCount} ctn` : '0'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-500">
                      {returnCount > 0 ? `+${returnCount} ctn` : '0'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLow ? (
                        <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/40 text-[10px] rounded-full font-bold">
                          {lang === 'fr' ? 'FAIBLE' : 'منخفض'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/40 text-[10px] rounded-full font-bold">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenLossForDepot(name)}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="h-3 w-3" />
                          <span>{lang === 'fr' ? 'Déclarer Perte' : 'تسجيل هدر'}</span>
                        </button>
                        {depot.adjustments.length > 0 && (
                          <button
                            onClick={() => setHistoryDepotName(name)}
                            className="px-2 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            title={lang === 'fr' ? 'Voir historique des ajustements' : 'سجل التعديلات'}
                          >
                            {depot.adjustments.length}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. ADVANCED ALERT SYSTEMS (FEFO TRACKER & COLD-CHAIN TEMPERATURES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FEFO Tracker */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              {t.fefoPanel}
            </h3>
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-200/30">
              {lang === 'fr' ? 'Alerte Expirations Proches' : 'تنبيه الصلاحية FEFO'}
            </span>
          </div>

          <div className="space-y-2.5">
            {state.batches.filter(b => b.status === 'active').length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                {lang === 'fr' ? 'Aucun lot actif enregistré.' : 'لا توجد دفعات إنتاج نشطة.'}
              </p>
            ) : (
              [...state.batches]
                .filter(b => b.status === 'active')
                .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                .slice(0, 4)
                .map(b => {
                  const expiryDate = new Date(b.expirationDate);
                  const today = new Date();
                  const diffTime = expiryDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isUrgent = diffDays < 90;

                  return (
                    <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{b.productName}</span>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded font-mono">
                            {b.batchNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {lang === 'fr' ? 'Expiration :' : 'تاريخ الصلاحية :'} <span className="font-mono">{b.expirationDate}</span> ({b.quantity} ctn)
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                          isUrgent 
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/40' 
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/40'
                        }`}>
                          {diffDays} j
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
                          {isUrgent ? (lang === 'fr' ? 'À distribuer d\'urgence' : 'عاجل FEFO') : 'Normal'}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Cold-chain Temperature Monitoring */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-rose-500" />
              {lang === 'fr' ? 'Contrôle Températures Chaîne du Froid' : 'تتبع درجات حرارة سلسلة التبريد'}
            </h3>
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Magasin Usine', temp: -19.5, max: -18 },
              { name: 'Magasin MICZ', temp: -18.2, max: -18 },
              { name: 'Magasin Zone Log.', temp: -17.4, max: -18 },
              { name: 'Dépôt Casablanca', temp: -18.8, max: -18 },
              { name: 'Dépôt Marrakech', temp: -16.5, max: -18 },
              { name: 'Dépôt Tanger', temp: -19.0, max: -18 },
            ].map((t, idx) => {
              const isAlert = t.temp > t.max;
              return (
                <div key={idx} className={`p-3 rounded-2xl border transition-all ${
                  isAlert 
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.name}</span>
                    {isAlert ? (
                      <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-100 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-full animate-pulse">
                        <ShieldAlert className="h-3 w-3" />
                        ALERTE !
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-bold">
                        CONFORME
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-xl font-black ${isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {t.temp}°C
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Max {t.max}°C)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 7. MODAL: DÉCLARER PERTES / ÉCARTS (CONNECTED DIRECTLY TO USINE) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isLossModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20">
                    <AlertOctagon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {lang === 'fr' ? 'Déclarer Pertes / Écarts' : 'تسجيل هدر أو فارق مخزون'}
                    </h3>
                    <p className="text-xxs text-slate-500 dark:text-slate-400">
                      {lang === 'fr' ? `Site concerné : ${lossDepotName}` : `الموقع : ${lossDepotName}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLossModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitLossDeclaration} className="p-6 space-y-4">
                
                {lossSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{lossSuccessMsg}</span>
                  </div>
                )}

                {/* Location Selection */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'fr' ? 'Site / Emplacement' : 'المستودع / الموقع'}
                  </label>
                  <select
                    value={lossDepotName}
                    onChange={(e) => setLossDepotName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                  >
                    <option value="Magasin Usine">{lang === 'fr' ? 'Magasin Usine (Central)' : 'مستودع المصنع'}</option>
                    <option value="Magasin MICZ">Magasin MICZ</option>
                    <option value="Magasin Zone Logistique">Magasin Zone Logistique</option>
                    {Object.keys(state.depots).map(d => (
                      <option key={d} value={d}>Dépôt {d}</option>
                    ))}
                  </select>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'fr' ? 'Produit concerné' : 'المنتج'}
                  </label>
                  <select
                    value={lossProductId}
                    onChange={(e) => setLossProductId(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                  >
                    <option value="">{lang === 'fr' ? '-- Choisir le produit --' : '-- اختر المنتج --'}</option>
                    {state.products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Motif de la perte' : 'نوع الهدر'}
                    </label>
                    <select
                      value={lossType}
                      onChange={(e) => setLossType(e.target.value as 'damaged' | 'expired')}
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                    >
                      <option value="damaged">{lang === 'fr' ? 'Casse / Avarie' : 'كسر / تلف'}</option>
                      <option value="expired">{lang === 'fr' ? 'Expiration (Périmé)' : 'انتهاء صلاحية'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Quantité (Cartons)' : 'الكمية (كرتونة)'}
                    </label>
                    <input 
                      type="number"
                      min={1}
                      max={1000}
                      value={lossQty}
                      onChange={(e) => setLossQty(Number(e.target.value))}
                      required
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'fr' ? 'Notes / Justification' : 'ملاحظات وتبرير الفارق'}
                  </label>
                  <input 
                    type="text"
                    value={lossNotes}
                    onChange={(e) => setLossNotes(e.target.value)}
                    placeholder={lang === 'fr' ? 'Ex: Rupture chaîne du froid, choc manutention...' : 'مثال: تلف أثناء النقل...'}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsLossModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLoss}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingLoss ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{lang === 'fr' ? 'Enregistrer la Perte' : 'تأكيد التسجيل'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 8. MODAL: HISTORIQUE DES AJUSTEMENTS D'UN DÉPÔT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {historyDepotName && state.depots[historyDepotName] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {lang === 'fr' ? `Historique des Pertes & Écarts - Dépôt ${historyDepotName}` : `سجل الهدر والتسويات - مستودع ${historyDepotName}`}
                  </h3>
                  <p className="text-xxs text-slate-400">
                    {state.depots[historyDepotName].adjustments.length} {lang === 'fr' ? 'opérations enregistrées' : 'عمليات مسجلة'}
                  </p>
                </div>
                <button 
                  onClick={() => setHistoryDepotName(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto space-y-2.5">
                {state.depots[historyDepotName].adjustments.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    {lang === 'fr' ? 'Aucun ajustement enregistré.' : 'لا توجد تسويات مسجلة.'}
                  </p>
                ) : (
                  state.depots[historyDepotName].adjustments.map((adj) => (
                    <div key={adj.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {adj.productName}
                        </div>
                        <div className="text-xxs text-slate-400 font-mono mt-0.5">
                          {adj.date} • {adj.notes || adj.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-rose-500">
                          -{adj.quantity} ctn
                        </span>
                        <span className="text-[10px] block text-slate-400 uppercase font-semibold">
                          {adj.type === 'damaged' ? (lang === 'fr' ? 'Casse' : 'تلف') : (lang === 'fr' ? 'Perte' : 'فارق')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
                <button
                  onClick={() => setHistoryDepotName(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                >
                  {lang === 'fr' ? 'Fermer' : 'إغلاق'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function Building2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  );
}
