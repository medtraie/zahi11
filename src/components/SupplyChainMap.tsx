/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StockPosition, Transfer } from '../types';
import { 
  Building, 
  Warehouse, 
  ArrowRight, 
  Truck, 
  MapPin, 
  Sparkles, 
  Compass,
  AlertCircle,
  Thermometer,
  Snowflake,
  CheckCircle2,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface SupplyChainMapProps {
  stockPositions: StockPosition[];
  transfers: Transfer[];
  depots: Record<string, any>;
  lang: 'fr' | 'ar';
}

export default function SupplyChainMap({
  stockPositions,
  transfers,
  depots,
  lang
}: SupplyChainMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>('usine'); // Default to usine for immediate rich detail

  // Helper to get total stock at a specific location
  const getStockCount = (locationName: string) => {
    if (locationName.startsWith('Dépôt ')) {
      const depotName = locationName.replace('Dépôt ', '');
      const d = depots[depotName];
      return d ? d.stock.reduce((sum: number, s: any) => sum + s.quantity, 0) : 0;
    }
    return stockPositions
      .filter(sp => sp.location === locationName)
      .reduce((sum, sp) => sum + sp.quantity, 0);
  };

  // Helper to get products list at a location
  const getProductsList = (locationName: string) => {
    if (locationName.startsWith('Dépôt ')) {
      const depotName = locationName.replace('Dépôt ', '');
      const d = depots[depotName];
      return d ? d.stock : [];
    }
    return stockPositions
      .filter(sp => sp.location === locationName)
      .map(sp => ({ productName: sp.productName, quantity: sp.quantity }));
  };

  const nodes = [
    {
      id: 'usine',
      name: 'Magasin Usine Zahi',
      nameAr: 'مستودع مصنع زاهي الرئيسي',
      label: lang === 'fr' ? '1. Usine Principale' : '١. المصنع الرئيسي',
      icon: <Building className="h-6 w-6" />,
      location: 'Magasin Usine',
      color: 'bg-gradient-to-tr from-sky-600 to-blue-500 shadow-sky-500/20 text-white',
      accentColor: 'text-sky-500',
      borderColor: 'border-sky-500/20 dark:border-sky-500/10',
      glowColor: 'shadow-sky-500/10',
      temp: '-22°C',
      status: lang === 'fr' ? 'Production active' : 'الإنتاج نشط',
      desc: lang === 'fr' ? 'Fabrication et stockage initial des cartons de glaces.' : 'تصنيع وتخزين أولي لكراتين الآيس كريم.'
    },
    {
      id: 'micz',
      name: 'Magasin MICZ',
      nameAr: 'مستودع MICZ اللوجستي',
      label: lang === 'fr' ? '2. Hub MICZ' : '٢. مستودع MICZ',
      icon: <Warehouse className="h-6 w-6" />,
      location: 'Magasin MICZ',
      color: 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-500/20 text-white',
      accentColor: 'text-indigo-500',
      borderColor: 'border-indigo-500/20 dark:border-indigo-500/10',
      glowColor: 'shadow-indigo-500/10',
      temp: '-19°C',
      status: lang === 'fr' ? 'Transit Fluide' : 'عبور سلس للسلع',
      desc: lang === 'fr' ? 'Premier transit intermédiaire de groupage.' : 'المحطة الوسيطة الأولى لفرز وتجميع الشحنات.'
    },
    {
      id: 'zone_log',
      name: 'Magasin Zone Logistique',
      nameAr: 'المنطقة اللوجستية المركزية',
      label: lang === 'fr' ? '3. Zone Logistique' : '٣. المنطقة اللوجستية',
      icon: <Warehouse className="h-6 w-6" />,
      location: 'Magasin Zone Logistique',
      color: 'bg-gradient-to-tr from-violet-600 to-violet-500 shadow-violet-500/20 text-white',
      accentColor: 'text-violet-500',
      borderColor: 'border-violet-500/20 dark:border-violet-500/10',
      glowColor: 'shadow-violet-500/10',
      temp: '-18.5°C',
      status: lang === 'fr' ? 'Dispatching OK' : 'توزيع فوري منظم',
      desc: lang === 'fr' ? 'Plateforme de répartition et dispatching.' : 'منصة التوزيع والفرز اللوجستي المركزي.'
    },
    {
      id: 'depots_all',
      name: '8 Dépôts Régionaux',
      nameAr: '٨ مستودعات إقليمية',
      label: lang === 'fr' ? '4. Distribution Finale' : '٤. التوزيع النهائي',
      icon: <MapPin className="h-6 w-6" />,
      location: '8 Dépôts Régionaux',
      color: 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20 text-white',
      accentColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/10',
      glowColor: 'shadow-emerald-500/10',
      temp: '-18°C',
      status: lang === 'fr' ? 'Couverture Nationale' : 'تغطية وطنية شاملة',
      desc: lang === 'fr' ? 'Stockage régional et distribution finale par camion.' : 'التخزين الإقليمي والتوزيع النهائي للشاحنات.'
    }
  ];

  const activeTransfersInTransit = transfers.filter(t => t.status === 'In Transit');

  // Find color representing product flavor nicely
  const getProductColorClass = (prodName: string) => {
    if (prodName.includes('Vanille')) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30';
    if (prodName.includes('Amande')) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/30';
    if (prodName.includes('Caramel')) return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/30';
    if (prodName.includes('Pistache')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30';
    if (prodName.includes('Chocolat')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/30';
    return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30';
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-sky-500/5 relative overflow-hidden transition-all duration-300">
      
      {/* Absolute floating glowing ice spheres background for 2026 aesthetics */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-400/5 dark:bg-sky-400/2 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/5 dark:bg-indigo-400/2 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 rounded-full flex items-center gap-1">
              <Snowflake className="h-3 w-3 animate-spin" style={{ animationDuration: '10s' }} />
              Zahi Premium Cold Chain
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-sky-500" />
            {lang === 'fr' ? 'Flux Logistique Supply Chain' : 'مخطط تدفق سلسلة الإمداد لوجستياً'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {lang === 'fr' ? 'Suivi dynamique des mouvements physiques de stock (Cliquez sur un entrepôt pour inspecter)' : 'تتبع تفاعلي لحركة المخزون الفعلية (انقر على مستودع للمعاينة)'}
          </p>
        </div>
        
        {/* Active transit count */}
        {activeTransfersInTransit.length > 0 && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded-2xl text-xs font-bold border border-sky-500/20 shadow-lg shadow-sky-500/5"
          >
            <Truck className="h-4 w-4 animate-bounce" />
            <span>{activeTransfersInTransit.length} {lang === 'fr' ? 'en transit' : 'شحنات قيد النقل'}</span>
          </motion.div>
        )}
      </div>

      {/* Modern Pipeline Container */}
      <div className="relative z-10 mb-8 w-full">
        
        {/* Animated Connected SVG Pipeline on Desktop (absolute background) */}
        <div className="hidden xl:block absolute left-[12%] right-[12%] top-[50px] h-1.5 pointer-events-none overflow-visible">
          <svg className="w-full h-full overflow-visible" fill="none">
            {/* Base grey line */}
            <path 
              d="M 0 3 L 800 3" 
              stroke="currentColor" 
              strokeWidth="4" 
              className="text-slate-200 dark:text-slate-800"
              strokeLinecap="round"
            />
            {/* Glowing cold line */}
            <path 
              d="M 0 3 L 800 3" 
              stroke="url(#coldGlow)" 
              strokeWidth="4" 
              strokeLinecap="round"
              className="opacity-90"
            />
            {/* Floating ice dots moving along the pipeline */}
            <circle r="6" fill="#0284c7" className="animate-pulse">
              <animateMotion 
                path="M 0 3 L 800 3" 
                dur="12s" 
                repeatCount="indefinite" 
              />
            </circle>
            <circle r="4" fill="#a855f7" className="opacity-85">
              <animateMotion 
                path="M 0 3 L 800 3" 
                dur="16s" 
                begin="4s"
                repeatCount="indefinite" 
              />
            </circle>
            
            <defs>
              <linearGradient id="coldGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Responsive Flex/Grid of nodes: PERFECT spacing, zero overlaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          {nodes.map((node, index) => {
            const stockQty = node.id === 'depots_all'
              ? Object.values(depots).reduce((sum: number, d: any) => sum + d.stock.reduce((s: number, p: any) => s + p.quantity, 0), 0)
              : getStockCount(node.location);
            
            const isSelected = selectedNode === node.id;
            const hasInTransitFromMe = activeTransfersInTransit.some(t => t.source === node.location);

            return (
              <motion.button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left relative flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-50 dark:bg-slate-950 border-sky-500 dark:border-sky-500/50 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                {/* Node visual icon */}
                <div className="flex items-center gap-4">
                  <div className={`p-4.5 rounded-2xl shrink-0 ${node.color} flex items-center justify-center relative`}>
                    {node.icon}
                    {hasInTransitFromMe && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500">
                      {node.label}
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 whitespace-normal break-words leading-tight">
                      {lang === 'ar' ? node.nameAr : node.name}
                    </h4>
                  </div>
                </div>

                {/* Quantitative Stock display */}
                <div className="flex flex-col items-end sm:items-start justify-center sm:mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono leading-none">
                      {stockQty.toLocaleString()}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      ctn
                    </span>
                  </div>
                  
                  {/* Status pills inside card */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`w-2 h-2 rounded-full ${node.id === 'depots_all' ? 'bg-emerald-500' : 'bg-sky-500'} animate-pulse`} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {node.temp}
                    </span>
                  </div>
                </div>

                {/* Glowing selection underline for visual weight */}
                {isSelected && (
                  <motion.div 
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-t-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Expandable Details Container below: takes 100% width, no squeeze */}
      <AnimatePresence mode="wait">
        {selectedNodeData && (
          <motion.div
            key={selectedNode}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl relative z-10"
          >
            {/* Header info for selected element */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ar' ? selectedNodeData.nameAr : selectedNodeData.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedNodeData.desc}
                  </p>
                </div>
              </div>

              {/* Quality & Control indicators */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5" />
                  {lang === 'fr' ? 'Température :' : 'درجة الحرارة :'} {selectedNodeData.temp}
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  FEFO / FIFO OK
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-1 rounded-full">
                  ONSSA APPROVED
                </span>
              </div>
            </div>

            {/* Structured details display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Stats & Operations overview */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                    {lang === 'fr' ? 'Indicateurs clés' : 'مؤشرات الأداء'}
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{lang === 'fr' ? 'Statut du Centre' : 'حالة المرفق'}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md text-[11px]">
                        {selectedNodeData.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{lang === 'fr' ? 'Dernier Scan' : 'آخر مسح رقمي'}</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {lang === 'fr' ? 'À l\'instant (RFID)' : 'الآن (RFID)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{lang === 'fr' ? 'Mode de Rotation' : 'نظام تدوير السلع'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">FEFO (First-Expired)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'fr' 
                      ? 'Capteurs télémétriques actifs. Liaison sécurisée par ondes radioélectriques avec la centrale.'
                      : 'أجهزة استشعار الحرارة والكمية نشطة. الربط اللوجستي المركزي يعمل بكفاءة.'}
                  </p>
                </div>
              </div>

              {/* Right Column: High Visual Product Grid with progress bars */}
              <div className="lg:col-span-8">
                <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  {lang === 'fr' ? 'Répartition des Produits en Stock' : 'توزيع تشكيلة المنتجات في المخزون'}
                </h5>

                {selectedNode === 'depots_all' ? (
                  /* Regional Depots listing */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {Object.values(depots).map((d: any) => {
                      const sum = d.stock.reduce((s: number, p: any) => s + p.quantity, 0);
                      return (
                        <div key={d.name} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-950 dark:text-slate-50 bg-white dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 px-2 py-1 rounded-lg shadow-xs">
                            {sum} ctn
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Single location product detail with colored bars */
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                    {getProductsList(selectedNodeData.name).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        {lang === 'fr' ? 'Aucun produit disponible.' : 'لا يوجد منتجات في هذا المركز حالياً.'}
                      </p>
                    ) : (
                      getProductsList(selectedNodeData.name).map((item: any, i: number) => {
                        const maxCapacity = 3000; // Reference for visual percentage
                        const percentage = Math.min(100, (item.quantity / maxCapacity) * 100);
                        const visualColor = getProductColorClass(item.productName || item.name);

                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className={`text-xxs font-bold px-2 py-0.5 rounded-full border ${visualColor} max-w-[280px] truncate`}>
                                {item.productName || item.name}
                              </span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {item.quantity} ctn
                              </span>
                            </div>
                            {/* Smooth loading percentage bar */}
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
