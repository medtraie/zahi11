/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SystemState, TruckData, Delivery, Product } from '../types';
import { translations } from '../translations';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Signature, 
  CheckCircle2, 
  Clock, 
  Package, 
  DollarSign, 
  RotateCcw, 
  Play, 
  ShieldAlert,
  ArrowRight,
  User,
  Compass
} from 'lucide-react';

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

  // Mobile App Internal States
  const [mobilePage, setMobilePage] = useState<'home' | 'deliveries' | 'end_day'>('home');
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  
  // Offline Simulation State
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Signature Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // GPS Sim coordinates
  const [gpsCoords, setGpsCoords] = useState({ lat: 33.5731, lng: -7.5898 });

  // Returns and Losses forms
  const [unsoldReturns, setUnsoldReturns] = useState<any[]>([]);
  const [unsoldLosses, setUnsoldLosses] = useState<any[]>([]);

  useEffect(() => {
    if (truck) {
      // Jitter GPS coordinates slightly based on truck depot
      const latBase = truck.depotName === 'Marrakech' ? 31.6295 : 33.5731;
      const lngBase = truck.depotName === 'Marrakech' ? -7.9811 : -7.5898;
      setGpsCoords({ lat: latBase, lng: lngBase });
      
      // Initialize closing returns draft structures
      setUnsoldReturns(truck.stock.map(s => ({ productId: s.productId, productName: s.productName, quantity: 0, reason: 'Retour invendu' })));
      setUnsoldLosses(truck.stock.map(s => ({ productId: s.productId, productName: s.productName, quantity: 0, reason: 'Casse camion' })));
    }
  }, [truck, activeTruckId]);

  if (!truck) {
    return <div className="text-center py-12 text-slate-500">Aucun camion configuré pour ce chauffeur.</div>;
  }

  // Jitter GPS motion simulation
  const handleSimulateGPSMotion = () => {
    setGpsCoords(prev => ({
      lat: prev.lat + (Math.random() - 0.5) * 0.002,
      lng: prev.lng + (Math.random() - 0.5) * 0.002
    }));
  };

  // Drawing Canvas helpers
  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1E293B';
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
  };

  // Handle Delivery Submission
  const handleValidateDelivery = (paymentMethod: 'Cash' | 'Credit' | 'Cheque') => {
    if (!activeDelivery) return;

    let signatureBase64 = '';
    const canvas = canvasRef.current;
    if (canvas) {
      signatureBase64 = canvas.toDataURL('image/png');
    }

    const payload = {
      truckId: truck.id,
      clientName: activeDelivery.clientName,
      items: activeDelivery.items,
      signature: signatureBase64,
      gps: gpsCoords,
      paymentMethod
    };

    if (offlineMode) {
      // Offline mode: queue delivery in local state
      setOfflineQueue([...offlineQueue, payload]);
      // Locally mark client as delivered in state so screen updates
      activeDelivery.status = 'Delivered';
      activeDelivery.deliveredAt = new Date().toISOString();
      alert(lang === 'fr' ? 'Mode Hors-ligne : Livraison mise en attente de synchronisation.' : 'وضع عدم الاتصال: تم حفظ التسليم محلياً في قائمة الانتظار للمزامنة.');
    } else {
      // Online mode: commit immediately to Express backend
      onDeliverClient(
        payload.truckId,
        payload.clientName,
        payload.items,
        payload.signature,
        payload.gps,
        payload.paymentMethod
      );
      alert(lang === 'fr' ? t.deliverySuccess : t.deliverySuccess);
    }

    setActiveDelivery(null);
  };

  // Synchronize Offline Queue
  const handleSyncQueue = () => {
    if (offlineQueue.length === 0) return;

    // Process all pending deliveries sequentially
    offlineQueue.forEach(p => {
      onDeliverClient(p.truckId, p.clientName, p.items, p.signature, p.gps, p.paymentMethod);
    });

    setOfflineQueue([]);
    setOfflineMode(false);
    onRefresh();
    alert(lang === 'fr' ? t.syncSuccess : t.syncSuccess);
  };

  // Submit closing shift returns
  const handleShiftClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out items with 0 quantities
    const returnsToSubmit = unsoldReturns.filter(r => r.quantity > 0);
    const lossesToSubmit = unsoldLosses.filter(l => l.quantity > 0);

    onCloseTournee(truck.id, returnsToSubmit, lossesToSubmit);
    
    alert(lang === 'fr' ? 'Rapport de fin de tournée transmis au dépôt !' : 'تم استلام المرتجعات والخسائر وإغلاق خط السير اليومي !');
    setMobilePage('home');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Selector bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Smartphone className="h-5 w-5 text-indigo-500" />
            {t.phoneSimulator}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium">
            {lang === 'fr' ? 'Tester la logistique du dernier kilomètre comme un chauffeur Zahi.' : 'محاكاة كاملة لتطبيق شاحنة التوزيع وسائقي شركة زاهي الميدانيين.'}
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={activeTruckId}
            onChange={(e) => setActiveTruckId(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none"
          >
            {state.trucks.map(t => (
              <option key={t.id} value={t.id}>{t.id} - {t.driverName} ({t.depotName})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Physical Phone Simulator Framework Wrapper */}
      <div className="flex justify-center items-center py-4">
        
        {/* Android / iOS dark Bezel Container */}
        <div className="relative w-80 h-[640px] bg-slate-950 rounded-[48px] border-[10px] border-slate-900 shadow-2xl flex flex-col overflow-hidden ring-4 ring-slate-800/10">
          
          {/* Ear Speaker & Camera notch cutout */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex justify-center items-center">
            <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
            <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-800 ml-2 mb-1" />
          </div>

          {/* Phone Screen body */}
          <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col pt-6 font-sans select-none relative">
            
            {/* Status Bar */}
            <div className="h-8 px-5 flex items-center justify-between text-xxs font-bold text-slate-400 bg-slate-950 z-30 select-none">
              <span>09:41</span>
              
              <div className="flex items-center gap-1.5">
                {offlineMode ? (
                  <span className="flex items-center gap-1 text-rose-500 font-extrabold text-[9px] animate-pulse">
                    <WifiOff className="h-3 w-3" />
                    HORS-LIGNE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-extrabold text-[9px]">
                    <Wifi className="h-3 w-3" />
                    EN LIGNE
                  </span>
                )}
                <span className="h-3 w-4.5 bg-slate-800 border border-slate-700 rounded-xs relative flex items-center px-0.5">
                  <span className="h-full w-3 bg-emerald-500 rounded-xs" />
                </span>
              </div>
            </div>

            {/* Offline Simulation Control Panel inside top of screen */}
            <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center gap-2 z-20">
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className={`px-2 py-1 text-[9px] font-black rounded-md flex items-center gap-1 cursor-pointer transition-all ${
                  offlineMode 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-rose-950/40 text-rose-300 border border-rose-900/30'
                }`}
              >
                {offlineMode ? (lang === 'fr' ? 'Aller En-ligne' : 'تشغيل الإنترنت') : (lang === 'fr' ? 'Aller Hors-ligne' : 'قطع الإنترنت')}
              </button>

              {offlineQueue.length > 0 && (
                <button
                  onClick={handleSyncQueue}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black rounded-md animate-pulse cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Sync ({offlineQueue.length})</span>
                </button>
              )}
            </div>

            {/* Mobile View Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-16 space-y-4">
              
              {/* PAGE 1: HOME/DASHBOARD SCREEN */}
              {mobilePage === 'home' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Driver Header Info */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md">
                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">{t.driverName}</p>
                    <h5 className="text-sm font-black text-white">{truck.driverName}</h5>
                    <div className="flex items-center justify-between text-[10px] text-blue-100 mt-2 pt-2 border-t border-blue-500/30">
                      <span>{t.truckId} : <b className="font-mono">{truck.id}</b></span>
                      <span>Dépôt : {truck.depotName}</span>
                    </div>
                  </div>

                  {/* Active Tournée */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5">
                    <Compass className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t.activeTournee}</p>
                      <p className="text-xs font-bold text-slate-200 truncate">{truck.tournee}</p>
                    </div>
                  </div>

                  {/* Mon Stock Camion Tracker */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lang === 'fr' ? 'Mon Stock Camion' : 'رصيد بضائع الشاحنة'}</h5>
                    
                    <div className="space-y-1.5">
                      {truck.stock.map(s => {
                        const inTruck = s.loaded - s.delivered - s.returned - s.lost;
                        return (
                          <div key={s.productId} className="p-3 bg-slate-950 border border-slate-850/50 rounded-xl flex justify-between items-center text-xs">
                            <span className="truncate font-semibold text-slate-300 pr-1">{s.productName}</span>
                            <span className="font-mono font-bold text-blue-400 shrink-0 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/30">{inTruck} ctn</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick stats and action */}
                  <button
                    onClick={() => setMobilePage('deliveries')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <Play className="h-4 w-4" />
                    {lang === 'fr' ? 'Commencer mes Livraisons' : 'بدء جولة التسليم للعملاء'}
                  </button>

                  <button
                    onClick={() => setMobilePage('end_day')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {lang === 'fr' ? 'Clôturer la Tournée' : 'إنهاء وإغلاق اليوم'}
                  </button>

                </div>
              )}

              {/* PAGE 2: DELIVERIES ROUTE SCREEN */}
              {mobilePage === 'deliveries' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.clientList}</h5>
                    <button onClick={() => setMobilePage('home')} className="text-xxs text-slate-400 hover:text-white">✕ Back</button>
                  </div>

                  {/* Active delivery details */}
                  {activeDelivery ? (
                    <div className="p-4 bg-slate-950 border border-indigo-900/40 rounded-2xl space-y-4">
                      <div className="border-b border-slate-850 pb-2 flex justify-between items-start">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Client</p>
                          <h6 className="text-xs font-bold text-white">{activeDelivery.clientName}</h6>
                        </div>
                        <button onClick={() => setActiveDelivery(null)} className="text-xxs text-slate-400">Cancel</button>
                      </div>

                      {/* Items to deliver */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Commandes</p>
                        {activeDelivery.items.map(item => (
                          <div key={item.productId} className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-medium truncate">{item.productName}</span>
                            <span className="font-mono font-bold text-indigo-400">{item.quantity} cartons</span>
                          </div>
                        ))}
                      </div>

                      {/* Simulated GPS Coordinate updating */}
                      <div className="p-2.5 bg-slate-900 rounded-xl flex items-center justify-between text-[10px]">
                        <div>
                          <p className="text-slate-500 font-bold uppercase tracking-wider">{t.gpsCoords}</p>
                          <p className="font-mono text-slate-300 mt-0.5">{gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSimulateGPSMotion}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold"
                        >
                          GPS Jitter
                        </button>
                      </div>

                      {/* Signature canvas panel */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t.clientSignature}</label>
                        <div className="bg-white rounded-xl overflow-hidden border border-slate-800">
                          <canvas
                            ref={canvasRef}
                            width={260}
                            height={90}
                            onMouseDown={handleStartDrawing}
                            onMouseMove={handleDraw}
                            onMouseUp={handleStopDrawing}
                            onMouseLeave={handleStopDrawing}
                            onTouchStart={handleStartDrawing}
                            onTouchMove={handleDraw}
                            onTouchEnd={handleStopDrawing}
                            className="w-full bg-slate-100 touch-none cursor-crosshair"
                          />
                        </div>
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={handleClearSignature}
                            className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xxs font-bold"
                          >
                            {t.clearSignature}
                          </button>
                          <span className="text-[9px] text-slate-500 italic">Dessinez avec votre doigt/souris</span>
                        </div>
                      </div>

                      {/* Validate buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleValidateDelivery('Cash')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xxs font-black cursor-pointer"
                        >
                          {lang === 'fr' ? 'Valider (Espèces)' : 'دفع نقدي'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleValidateDelivery('Cheque')}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xxs font-black cursor-pointer"
                        >
                          {lang === 'fr' ? 'Valider (Chèque)' : 'دفع بشيك'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {truck.deliveries.map(del => {
                        const isPending = del.status === 'Pending';
                        const isDelivered = del.status === 'Delivered';
                        return (
                          <div key={del.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-slate-200">{del.clientName}</p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {del.items.reduce((s, i) => s + i.quantity, 0)} cartons à livrer
                              </p>
                            </div>

                            {isPending ? (
                              <button
                                onClick={() => setActiveDelivery(del)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xxs font-black cursor-pointer"
                              >
                                {lang === 'fr' ? 'Livrer' : 'تسليم'}
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 text-[9px] rounded-lg font-black tracking-wider uppercase">
                                ✓ Livré
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 3: SHIFT CLOSING / END OF DAY RETURNS SCREEN */}
              {mobilePage === 'end_day' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.unsoldReturns}</h5>
                    <button onClick={() => setMobilePage('home')} className="text-xxs text-slate-400 hover:text-white">✕ Back</button>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal">
                    {lang === 'fr' 
                      ? 'Renvoyer les cartons de glace invendus au congélateur du dépôt et enregistrer les pertes en fin de journée.' 
                      : 'إرجاع الآيس كريم غير المباع لمخزن الديبو وتسجيل أي تلفيات حدثت أثناء الرحلة.'}
                  </p>

                  <form onSubmit={handleShiftClosingSubmit} className="space-y-4">
                    
                    {/* Unsold Returns picker */}
                    <div className="space-y-2">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.returnQty} (Invendus)</p>
                      {unsoldReturns.map((r, i) => (
                        <div key={r.productId} className="flex justify-between items-center gap-2 text-xxs">
                          <span className="truncate flex-1 text-slate-300 font-medium">{r.productName}</span>
                          <input
                            type="number"
                            value={r.quantity}
                            onChange={(e) => {
                              const updated = [...unsoldReturns];
                              updated[i].quantity = Math.max(0, Number(e.target.value));
                              setUnsoldReturns(updated);
                            }}
                            className="w-12 text-center bg-slate-900 border border-slate-800 text-white py-1 rounded"
                            min={0}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Losses/Damages on truck picker */}
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">{t.lostQty} (Casses / Fondus)</p>
                      {unsoldLosses.map((l, i) => (
                        <div key={l.productId} className="flex justify-between items-center gap-2 text-xxs">
                          <span className="truncate flex-1 text-slate-300 font-medium">{l.productName}</span>
                          <input
                            type="number"
                            value={l.quantity}
                            onChange={(e) => {
                              const updated = [...unsoldLosses];
                              updated[i].quantity = Math.max(0, Number(e.target.value));
                              setUnsoldLosses(updated);
                            }}
                            className="w-12 text-center bg-slate-900 border border-slate-800 text-white py-1 rounded"
                            min={0}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {t.submitEndOfDay}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Simulated Smartphone Bottom Nav Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-slate-950 border-t border-slate-850 px-6 flex items-center justify-between z-30">
              <button 
                onClick={() => setMobilePage('home')}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'home' ? 'text-indigo-500' : 'text-slate-500'}`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Shift</span>
              </button>

              <button 
                onClick={() => setMobilePage('deliveries')}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'deliveries' ? 'text-indigo-500' : 'text-slate-500'}`}
              >
                <MapPin className="h-4 w-4" />
                <span>{lang === 'fr' ? 'Tournée' : 'التسليم'}</span>
              </button>

              <button 
                onClick={() => setMobilePage('end_day')}
                className={`flex flex-col items-center gap-1 text-[9px] font-bold ${mobilePage === 'end_day' ? 'text-indigo-500' : 'text-slate-500'}`}
              >
                <Clock className="h-4 w-4" />
                <span>Clôture</span>
              </button>
            </div>

            {/* Apple Home Indicator line */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-800 rounded-full z-40" />

          </div>
        </div>

      </div>
    </div>
  );
}
