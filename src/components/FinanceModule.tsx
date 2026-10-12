/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemState } from '../types';
import { translations } from '../translations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon, 
  Percent, 
  Activity, 
  Sliders, 
  RefreshCw,
  Coins
} from 'lucide-react';

interface FinanceModuleProps {
  state: SystemState;
  lang: 'fr' | 'ar';
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

export default function FinanceModule({ state, lang }: FinanceModuleProps) {
  const t = translations[lang];

  // Price adjustment factor simulator (to adjust profit margins dynamically)
  const [classiquePriceFactor, setClassiquePriceFactor] = useState(1.0);
  const [premiumPriceFactor, setPremiumPriceFactor] = useState(1.0);
  const [gourmetPriceFactor, setGourmetPriceFactor] = useState(1.0);
  const [magicienPriceFactor, setMagicienPriceFactor] = useState(1.0);

  // Global counts
  const factoryStockPositions = state.stockPositions;
  const regionalStockPositions = Object.values(state.depots).reduce((arr: any[], d: any) => [...arr, ...d.stock], []);

  // Calculate financials
  const getProductPriceFactor = (category: string) => {
    if (category === 'GAMME CLASSIQUE') return classiquePriceFactor;
    if (category === 'GAMME PREMIUM') return premiumPriceFactor;
    if (category === 'GAMME GOURMET') return gourmetPriceFactor;
    if (category === 'GAMME MAGICIEN') return magicienPriceFactor;
    return 1.0;
  };

  // 1. Current Valuation
  let totalCostValuation = 0;
  let simulatedSellValuation = 0;

  // Add factory positions
  factoryStockPositions.forEach(sp => {
    const prod = state.products.find(p => p.id === sp.productId);
    if (prod) {
      const multiplier = getProductPriceFactor(prod.category);
      totalCostValuation += sp.quantity * prod.unitPriceCost * 10;
      simulatedSellValuation += sp.quantity * prod.unitPriceSell * multiplier * 10;
    }
  });

  // Add depots positions
  regionalStockPositions.forEach(sp => {
    const prod = state.products.find(p => p.id === sp.productId || p.name === sp.productName);
    if (prod) {
      const multiplier = getProductPriceFactor(prod.category);
      totalCostValuation += sp.quantity * prod.unitPriceCost * 10;
      simulatedSellValuation += sp.quantity * prod.unitPriceSell * multiplier * 10;
    }
  });

  const totalMargin = simulatedSellValuation - totalCostValuation;
  const marginPercentage = simulatedSellValuation > 0 ? (totalMargin / simulatedSellValuation) * 100 : 0;

  // Sales performance chart data
  const categorySalesData = [
    { name: 'GAMME CLASSIQUE', cost: 0, revenue: 0 },
    { name: 'GAMME PREMIUM', cost: 0, revenue: 0 },
    { name: 'GAMME GOURMET', cost: 0, revenue: 0 },
    { name: 'GAMME MAGICIEN', cost: 0, revenue: 0 }
  ];

  state.products.forEach(p => {
    // Find all stock of this product
    const qty = state.stockPositions.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0) +
      Object.values(state.depots).reduce((sum, d) => sum + d.stock.filter(s => s.productId === p.id).reduce((s, x) => s + x.quantity, 0), 0);
    
    const catObj = categorySalesData.find(c => c.name === p.category);
    if (catObj) {
      const multiplier = getProductPriceFactor(p.category);
      catObj.cost += qty * p.unitPriceCost * 10;
      catObj.revenue += qty * p.unitPriceSell * multiplier * 10;
    }
  });

  // Depot Financial Comparison
  const depotFinancials = Object.entries(state.depots).map(([name, depot]) => {
    let cost = 0;
    let revenue = 0;
    depot.stock.forEach(item => {
      const prod = state.products.find(p => p.id === item.productId || p.name === item.productName);
      if (prod) {
        const multiplier = getProductPriceFactor(prod.category);
        cost += item.quantity * prod.unitPriceCost * 10;
        revenue += item.quantity * prod.unitPriceSell * multiplier * 10;
      }
    });
    return {
      name,
      value: Math.round(revenue),
      margin: Math.round(revenue - cost)
    };
  });

  const handleResetSimulator = () => {
    setClassiquePriceFactor(1.0);
    setPremiumPriceFactor(1.0);
    setGourmetPriceFactor(1.0);
    setMagicienPriceFactor(1.0);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KPIs Financials */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.revenueValuation}</span>
            <div className="p-1.5 bg-blue-600 text-white rounded-lg"><DollarSign className="h-4 w-4" /></div>
          </div>
          <h3 className="text-xl font-black font-mono text-slate-800 dark:text-slate-100 mt-4">
            {Math.round(simulatedSellValuation).toLocaleString()} DH
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'fr' ? 'Valeur totale de vente' : 'القيمة الإجمالية بسعر البيع'}</p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{lang === 'fr' ? 'Valeur au Prix de Revient' : 'تقييم التكلفة الإجمالية'}</span>
            <div className="p-1.5 bg-violet-600 text-white rounded-lg"><Coins className="h-4 w-4" /></div>
          </div>
          <h3 className="text-xl font-black font-mono text-slate-800 dark:text-slate-100 mt-4">
            {Math.round(totalCostValuation).toLocaleString()} DH
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'fr' ? 'Coût total d\'achat/fabrication' : 'إجمالي تكلفة الإنتاج والمواد'}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-slate-900 dark:to-emerald-950/20 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">{t.profitMargin}</span>
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg"><TrendingUp className="h-4 w-4" /></div>
          </div>
          <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-4">
            +{Math.round(totalMargin).toLocaleString()} DH
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">{lang === 'fr' ? 'Bénéfices bruts estimés' : 'هامش الربح الصافي المتوقع'}</p>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850">
          <div className="flex justify-between items-start">
            <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{lang === 'fr' ? 'Taux de Marge Moyen' : 'معدل هامش الربح'}</span>
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg"><Percent className="h-4 w-4" /></div>
          </div>
          <h3 className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-4">
            {marginPercentage.toFixed(1)}%
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'fr' ? 'Marge bénéficiaire sur CA' : 'معدل الربحية من المبيعات'}</p>
        </div>

      </div>

      {/* 2. Interactive Commercial Pricing Simulator */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-500" />
            {lang === 'fr' ? 'Simulateur Commercial : Ajustement des Marges' : 'محاكي الاستراتيجيات التجارية وتسعير الآيس كريم'}
          </h4>
          <button
            onClick={handleResetSimulator}
            className="p-1 text-xs text-slate-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {lang === 'fr' ? 'Réinitialiser Prix' : 'إعادة تعيين الأسعار'}
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-normal mb-6">
          {lang === 'fr' 
            ? 'Glissez les curseurs ci-dessous pour modifier les prix de vente conseillés aux épiceries et supermarchés de chaque gamme. Les valeurs financières et marges globales ci-dessus se recalculeront instantanément.' 
            : 'قم بضبط مستويات التسعير والتخفيضات التجارية لكل فئة من الآيس كريم لمعاينة تأثيرها المباشر على الأرباح والتدفقات النقدية والتقييمات المالية.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200">GAMME CLASSIQUE</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{(classiquePriceFactor * 100).toFixed(0)}% du tarif</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.05}
              value={classiquePriceFactor}
              onChange={(e) => setClassiquePriceFactor(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">{lang === 'fr' ? 'TWINNY, CAPITANO, BROCHETTE, DELICIO, GOLDEN GLOBE.' : 'المنتجات الكلاسيكية: تويني، كابيتانو، بروشيت، ديليسيو.'}</p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200">GAMME PREMIUM</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{(premiumPriceFactor * 100).toFixed(0)}% du tarif</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.05}
              value={premiumPriceFactor}
              onChange={(e) => setPremiumPriceFactor(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">{lang === 'fr' ? 'TWINY Premium, CROQUANTY, PRESTIGE, OMEGA, POT FLEURY.' : 'المنتجات الممتازة: بريستيج، كروكانتي، أوميغا، بوت فلوري.'}</p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200">GAMME GOURMET</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{(gourmetPriceFactor * 100).toFixed(0)}% du tarif</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.05}
              value={gourmetPriceFactor}
              onChange={(e) => setGourmetPriceFactor(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">{lang === 'fr' ? 'PANDA Vanille Chocolat/Nougat, OCEANO, COBRA Classique.' : 'المنتجات الفاخرة: باندا عائلي لتر، أوشيانو، كوبرا.'}</p>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-850">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200">GAMME MAGICIEN</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{(magicienPriceFactor * 100).toFixed(0)}% du tarif</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.5}
              step={0.05}
              value={magicienPriceFactor}
              onChange={(e) => setMagicienPriceFactor(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">{lang === 'fr' ? 'MAGNUM, SOLERO, COBRA Premium, ALADINO, POPEYE, PASTEK.' : 'منتجات ساحر الأطفال: ماغنوم، سوليرو، بوباي، باستيك.'}</p>
          </div>

        </div>
      </div>

      {/* 3. Charts performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category breakdown profit */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
            <PieIcon className="h-4.5 w-4.5 text-blue-500" />
            {lang === 'fr' ? 'Coût vs Revenu par Catégorie d\'Ice cream' : 'مقارنة التكلفة بالإيراد لكل فئة'}
          </h4>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" />
                <YAxis fontSize={11} stroke="#94A3B8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="cost" name={lang === 'fr' ? 'Coût (Prix Revient)' : 'التكلفة'} fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name={lang === 'fr' ? 'Valeur Vente (CA)' : 'قيمة المبيعات'} fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Depot value shares */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-violet-500" />
            {lang === 'fr' ? 'Valeur Financière du Stock par Dépôt Régional' : 'القيمة المالية لمخازن الأقاليم الميدانية'}
          </h4>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={depotFinancials} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" />
                <YAxis fontSize={11} stroke="#94A3B8" />
                <Tooltip />
                <Area type="monotone" dataKey="value" name={lang === 'fr' ? 'Valeur Stock' : 'قيمة المخزون'} stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.15} />
                <Area type="monotone" dataKey="margin" name={lang === 'fr' ? 'Bénéfice Estimé' : 'الربح المتوقع'} stroke="#10B981" fill="#10B981" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
