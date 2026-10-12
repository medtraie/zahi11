/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemState, Transfer, TransferItem, Product } from '../types';
import { translations } from '../translations';
import { generateBarcodeSVG } from '../utils/export';
import { Vehicle } from './VehicleDriverModule';
import { 
  ArrowRight, 
  Truck, 
  CheckCircle, 
  Plus, 
  Calendar, 
  Trash2, 
  Scan, 
  Thermometer, 
  ShieldAlert, 
  Layers,
  Search,
  Package
} from 'lucide-react';

interface TransferModuleProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  onCreateTransfer: (transfer: {
    source: string;
    destination: string;
    items: TransferItem[];
    carrierName: string;
    notes: string;
  }) => void;
  onUpdateTransferStatus: (
    transferId: string,
    status: 'In Transit' | 'Received',
    scannedCartons?: number,
    lossCount?: number,
    tempAlert?: boolean,
    notes?: string
  ) => void;
  currentUser: any;
  vehicles?: Vehicle[];
}

export default function TransferModule({
  state,
  lang,
  onCreateTransfer,
  onUpdateTransferStatus,
  currentUser,
  vehicles = []
}: TransferModuleProps) {
  const t = translations[lang];

  // Transfer creation states
  const [source, setSource] = useState('Magasin Usine');
  const [destination, setDestination] = useState('Magasin MICZ');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [carrierName, setCarrierName] = useState('Transport Ghazali Truck #15');
  const [notes, setNotes] = useState('');

  // Item builder states
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [itemQty, setItemQty] = useState(50);

  // Scan simulation modal states
  const [activeScanTransfer, setActiveScanTransfer] = useState<Transfer | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [isTempAlert, setIsTempAlert] = useState(false);
  const [scanningCompleted, setScanningCompleted] = useState(false);
  const [discrepancyDetected, setDiscrepancyDetected] = useState(false);

  // Filter transfers
  const [searchFilter, setSearchFilter] = useState('');

  // Guide valid path combinations based on the physical flow requirement:
  // Magasin Usine Zahi ➔ Magasin MICZ ➔ Magasin Zone Logistique ➔ Dépôts régionaux
  const handleSourceChange = (val: string) => {
    setSource(val);
    if (val === 'Magasin Usine') {
      setDestination('Magasin MICZ');
    } else if (val === 'Magasin MICZ') {
      setDestination('Magasin Zone Logistique');
    } else if (val === 'Magasin Zone Logistique') {
      setDestination('Dépôt Casablanca');
    } else {
      setDestination('Magasin Zone Logistique'); // Return flow
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || itemQty <= 0) return;
    const prod = state.products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in builder
    const existsIdx = transferItems.findIndex(i => i.productId === selectedProductId);
    if (existsIdx >= 0) {
      const updated = [...transferItems];
      updated[existsIdx].quantity += itemQty;
      setTransferItems(updated);
    } else {
      setTransferItems([...transferItems, {
        productId: selectedProductId,
        productName: prod.name,
        quantity: itemQty
      }]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== idx));
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferItems.length === 0) {
      alert(lang === 'fr' ? 'Veuillez ajouter au moins un produit au transfert' : 'يرجى إضافة منتج واحد على الأقل للتحويل');
      return;
    }

    onCreateTransfer({
      source,
      destination,
      items: transferItems,
      carrierName,
      notes
    });

    setTransferItems([]);
    setNotes('');
    alert(lang === 'fr' ? 'Transfert enregistré et cartons déduits du stock de départ !' : 'تم شحن التحويل وحجز كراتين الآيس كريم من مخزن الانطلاق !');
  };

  // Barcode scanner simulation
  const handleOpenScanner = (transfer: Transfer) => {
    setActiveScanTransfer(transfer);
    setScannedCount(0);
    setIsTempAlert(false);
    setScanningCompleted(false);
    setDiscrepancyDetected(false);
  };

  const handleScanOne = () => {
    if (!activeScanTransfer) return;
    const totalQty = activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0);
    if (scannedCount < totalQty) {
      setScannedCount(scannedCount + 1);
    }
  };

  const handleScanAll = () => {
    if (!activeScanTransfer) return;
    const totalQty = activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0);
    setScannedCount(totalQty);
  };

  const handleScanWithLoss = () => {
    if (!activeScanTransfer) return;
    const totalQty = activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0);
    // Simulate losing 4 cartons in transport
    const partial = Math.max(0, totalQty - 4);
    setScannedCount(partial);
    setDiscrepancyDetected(true);
  };

  const handleConfirmReceipt = () => {
    if (!activeScanTransfer) return;
    const totalQty = activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0);
    const losses = Math.max(0, totalQty - scannedCount);

    onUpdateTransferStatus(
      activeScanTransfer.id,
      'Received',
      scannedCount,
      losses,
      isTempAlert,
      lang === 'fr' ? `Réceptionné via scanner de cartons. Pertes: ${losses}.` : `تم الاستلام والمسح بالباركود. الهدر: ${losses}.`
    );

    setActiveScanTransfer(null);
    alert(lang === 'fr' ? 'Réception validée et stock crédité à destination !' : 'تم استلام الشحنة وإضافتها لمخزن الوجهة !');
  };

  const filteredTransfers = state.transfers.filter(t => 
    t.trackingNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.source.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.carrierName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. New Transfer Creator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creation Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            {t.newTransfer}
          </h3>

          <form onSubmit={handleSubmitTransfer} className="space-y-4">
            
            {/* Step routing indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.sourceLocation}</label>
                <select
                  value={source}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="Magasin Usine">Magasin Usine Zahi</option>
                  <option value="Magasin MICZ">Magasin MICZ</option>
                  <option value="Magasin Zone Logistique">Magasin Zone Logistique</option>
                </select>
              </div>

              <div className="flex items-center justify-center pt-3 md:pt-0">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                  ➔
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.destLocation}</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  {/* Lock downstream path according to source for demonstration */}
                  {source === 'Magasin Usine' && <option value="Magasin MICZ">Magasin MICZ</option>}
                  {source === 'Magasin MICZ' && <option value="Magasin Zone Logistique">Magasin Zone Logistique</option>}
                  {source === 'Magasin Zone Logistique' && (
                    <>
                      {Object.keys(state.depots).map(n => (
                        <option key={n} value={`Dépôt ${n}`}>{`Dépôt ${n}`}</option>
                      ))}
                    </>
                  )}
                  {source.startsWith('Dépôt') && <option value="Magasin Zone Logistique">Magasin Zone Logistique</option>}
                </select>
              </div>
            </div>

            {/* Product item picker */}
            <div className="p-4 bg-blue-50/40 dark:bg-slate-900/20 rounded-xl border border-blue-100/50 dark:border-slate-850">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{lang === 'fr' ? 'Ajouter des cartons au transfert' : 'إضافة كراتين للشحنة'}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  {state.products.map(p => {
                    // Find quantity of this product at source location to assist
                    let avail = 0;
                    if (source.startsWith('Dépôt')) {
                      const d = state.depots[source.replace('Dépôt ', '')];
                      avail = d?.stock.find(s => s.productId === p.id)?.quantity || 0;
                    } else {
                      avail = state.stockPositions.find(sp => sp.productId === p.id && sp.location === source)?.quantity || 0;
                    }

                    return (
                      <option key={p.id} value={p.id}>{p.name} ({avail} cartons dispos)</option>
                    );
                  })}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(Math.max(1, Number(e.target.value)))}
                    className="w-20 text-xs px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-mono font-bold text-slate-800 dark:text-slate-200"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {lang === 'fr' ? 'Ajouter' : 'إضافة'}
                  </button>
                </div>
              </div>

              {/* Items Table in current builder */}
              {transferItems.length > 0 && (
                <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <table className="w-full text-xxs text-left text-slate-600 dark:text-slate-300">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-850">
                        <th className="py-2">{t.product}</th>
                        <th className="py-2 text-right">{t.quantity}</th>
                        <th className="py-2 text-center">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {transferItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-semibold text-slate-800 dark:text-slate-100">{item.productName}</td>
                          <td className="py-2 text-right font-bold font-mono text-blue-600 dark:text-blue-400">{item.quantity} ctn</td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {lang === 'fr' ? 'Camion de Transport (Expédition)' : 'شاحنة النقل (الشحن)'}
                </label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none font-semibold"
                  required
                >
                  {vehicles && vehicles.filter(v => v.type === 'transport').length > 0 ? (
                    vehicles.filter(v => v.type === 'transport').map(v => (
                      <option key={v.id} value={`${v.model} - ${v.id}`}>
                        {v.model} - {v.id} ({v.plateNumber})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Scania R450 Streamline - TRK-EXP-101">Scania R450 Streamline - TRK-EXP-101 (Inter-Entrepôt)</option>
                      <option value="Volvo FH16 Globetrotter - TRK-EXP-102">Volvo FH16 Globetrotter - TRK-EXP-102 (Inter-Entrepôt)</option>
                      <option value="Renault Trucks T-High - TRK-EXP-103">Renault Trucks T-High - TRK-EXP-103 (Inter-Entrepôt)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.notes}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
                  placeholder="Informations supplémentaires..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Truck className="h-4 w-4" />
              {t.sendTransfer}
            </button>

          </form>
        </div>

        {/* Informative Supply Chain Path Legend */}
        <div className="bg-slate-55 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-blue-500" />
              {lang === 'fr' ? 'Règles de Transit Zahi' : 'قواعد النقل في شركة زاهي'}
            </h4>
            <p className="text-xxs text-slate-500 leading-relaxed mb-4">
              {lang === 'fr' 
                ? 'Le transport physique des cartons d\'ice cream obéit à un itinéraire strict pour garantir le FEFO et maintenir le froid industriel à -18°C. Les stocks ne peuvent pas sauter d\'étape.' 
                : 'يخضع نقل كراتين الآيس كريم لمسار صارم للحفاظ على التبريد عند -18 درجة مئوية وتطبيق نظام FEFO. لا يمكن تخطي أي محطة.'}
            </p>

            <div className="space-y-3.5">
              <div className="flex gap-3 text-xxs">
                <div className="h-5 w-5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">Magasin Usine ➔ MICZ</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'fr' ? 'Sortie d\'usine après certification qualité.' : 'خروج من المصنع بعد فحص الجودة.'}</p>
                </div>
              </div>

              <div className="flex gap-3 text-xxs">
                <div className="h-5 w-5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">MICZ ➔ Zone Logistique</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'fr' ? 'Acheminement vers le hub central marocain.' : 'التوجيه نحو المركز اللوجستي الوطني.'}</p>
                </div>
              </div>

              <div className="flex gap-3 text-xxs">
                <div className="h-5 w-5 bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">Zone Logistique ➔ Dépôts Régionaux</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lang === 'fr' ? 'Expédition finale vers Casablanca, Marrakech, etc.' : 'التوزيع على مخازن المدن (كازا، مراكش...)'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Scan className="h-4 w-4 text-indigo-500 shrink-0" />
            <p className="text-[10px] text-slate-400">
              {lang === 'fr' 
                ? 'Un scan physique des cartons à l\'arrivée est obligatoire pour détecter les écarts de livraison.' 
                : 'يتطلب الاستلام إجراء مسح بالباركود للتحقق من سلامة الأعداد.'}
            </p>
          </div>
        </div>

      </div>

      {/* 2. Barcode scan simulation popup / section */}
      {activeScanTransfer && (
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white rounded-2xl shadow-xl flex flex-col md:flex-row gap-6 items-center animate-fade-in">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2 py-0.5 rounded-full">
                  {lang === 'fr' ? 'SCANNER DE CARTONS INTÉGRÉ' : 'جهاز المسح اللاسلكي للباركود'}
                </span>
                <h4 className="text-sm font-black mt-1.5">
                  {lang === 'fr' ? 'Réception du Transfert' : 'تأكيد واستلام الشحنة'} {activeScanTransfer.trackingNumber}
                </h4>
              </div>
              <button 
                onClick={() => setActiveScanTransfer(null)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1.5 p-3.5 bg-slate-850 rounded-xl border border-slate-800 font-medium">
              <p><span className="text-slate-400">{t.sourceLocation} :</span> {activeScanTransfer.source}</p>
              <p><span className="text-slate-400">{t.destLocation} :</span> {activeScanTransfer.destination}</p>
              <p><span className="text-slate-400">{lang === 'fr' ? 'Cartons expédiés' : 'الكراتين المشحونة'} :</span> {activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0)} cartons</p>
              <p><span className="text-slate-400">{t.carrier} :</span> {activeScanTransfer.carrierName}</p>
            </div>

            {/* Temperature logger */}
            <div className="flex items-center gap-3 p-3 bg-slate-850 rounded-xl border border-slate-800">
              <Thermometer className="h-5 w-5 text-rose-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{lang === 'fr' ? 'Température au transport' : 'درجة حرارة الحاوية أثناء النقل'}</p>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      checked={!isTempAlert}
                      onChange={() => setIsTempAlert(false)}
                    />
                    <span className="text-emerald-400">-{activeScanTransfer.items[0]?.productId === 'prod-02' ? '20' : '18'}°C (OK)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      checked={isTempAlert}
                      onChange={() => setIsTempAlert(true)}
                    />
                    <span className="text-rose-500">-12°C (ALERTE CHALEUR)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Scanning tools */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleScanOne}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Scan className="h-4 w-4" />
                {lang === 'fr' ? 'Scanner 1 Carton' : 'مسح كرتونة واحدة'}
              </button>
              <button
                type="button"
                onClick={handleScanAll}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                {lang === 'fr' ? 'Scanner Tout (100%)' : 'مسح كل الشحنة'}
              </button>
              <button
                type="button"
                onClick={handleScanWithLoss}
                className="px-4 py-2 bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-900/30 rounded-lg text-xs font-bold cursor-pointer"
              >
                {lang === 'fr' ? 'Simuler Perte (-4 ctn)' : 'محاكاة ضياع (عجز -٤)'}
              </button>
            </div>
          </div>

          {/* Visual barcode mockup container */}
          <div className="w-full md:w-64 bg-slate-850 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-between min-h-[220px]">
            <div className="w-full text-center">
              <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider">{lang === 'fr' ? 'Progression de la Réception' : 'تقدم مسح الشحنة'}</p>
              <h5 className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {scannedCount} / {activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0)}
              </h5>
              <p className="text-[10px] text-slate-500 mt-0.5">cartons confirmés</p>
            </div>

            {/* Generated visual barcode */}
            <div className="my-4 py-2 px-1 bg-white rounded flex flex-col items-center justify-center">
              <div dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(activeScanTransfer.trackingNumber) }} />
            </div>

            {scannedCount === activeScanTransfer.items.reduce((s, i) => s + i.quantity, 0) ? (
              <button
                onClick={handleConfirmReceipt}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                {lang === 'fr' ? 'Confirmer Réception Conforme' : 'تأكيد واستلام الشحنة'}
              </button>
            ) : scannedCount > 0 ? (
              <button
                onClick={handleConfirmReceipt}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4" />
                {lang === 'fr' ? 'Valider avec Écart (Perte)' : 'إغلاق الشحنة مع تسجيل العجز'}
              </button>
            ) : (
              <p className="text-[10px] text-slate-500 italic text-center">
                {lang === 'fr' ? 'Prêt à scanner.' : 'بانتظار مسح الباركود.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. Historical Transfers List */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-500" />
            {t.historyTransfers}
          </h3>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher...' : 'بحث...'}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Numéro Suivi' : 'رقم الشحنة'}</th>
                <th className="px-4 py-3 font-bold">{t.sourceLocation}</th>
                <th className="px-4 py-3 font-bold">{t.destLocation}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Produits expédiés' : 'المنتجات المشحونة'}</th>
                <th className="px-4 py-3 text-center font-bold">{t.status}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Expédié le' : 'تاريخ الشحن'}</th>
                <th className="px-4 py-3 text-center font-bold">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {lang === 'fr' ? 'Aucun transfert trouvé.' : 'لا توجد تحويلات مخزنية متوفرة.'}
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(tr => {
                  const totalQty = tr.items.reduce((s, i) => s + i.quantity, 0);
                  const isPendingReceipt = tr.status === 'In Transit' || tr.status === 'Pending';

                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {tr.trackingNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">{tr.source}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">{tr.destination}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{totalQty} cartons total</p>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {tr.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tr.status === 'Received' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] rounded-full font-bold">REÇU</span>
                        )}
                        {tr.status === 'In Transit' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] rounded-full font-bold animate-pulse">EN TRANSIT</span>
                        )}
                        {tr.status === 'Pending' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] rounded-full font-bold">EXPÉDIÉ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(tr.sentAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPendingReceipt ? (
                          <button
                            onClick={() => handleOpenScanner(tr)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xxs font-black cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          >
                            <Scan className="h-3 w-3" />
                            {lang === 'fr' ? 'Scanner' : 'مسح واستلام'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xxs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
