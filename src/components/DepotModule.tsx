/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import { SystemState, DepotData, Product, TruckData } from '../types';
import { translations } from '../translations';
import { exportToCSV } from '../utils/export';
import { 
  MapPin, 
  Database, 
  Truck, 
  Plus, 
  AlertTriangle, 
  FileSpreadsheet, 
  Printer, 
  Download,
  X, 
  RefreshCw,
  Clock,
  History,
  Edit2
} from 'lucide-react';

interface DepotModuleProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  onLoadTruck: (truckId: string, items: Array<{ productId: string; productName: string; quantity: number }>, tournee: string) => void;
  onAddDepotAdjustment: (depotName: string, productId: string, type: 'damaged' | 'lost' | 'correction', quantity: number, notes: string) => void;
  onAddDepotReturn: (depotName: string, productId: string, quantity: number, reason: string) => void;
  onAddDepot: (name: string) => Promise<boolean>;
  onUpdateDepotStartingStock: (depotName: string, productId: string, startingStock: number, quantity: number) => Promise<boolean>;
  currentUser: any;
}

export default function DepotModule({
  state,
  lang,
  onLoadTruck,
  onAddDepotAdjustment,
  onAddDepotReturn,
  onAddDepot,
  onUpdateDepotStartingStock,
  currentUser
}: DepotModuleProps) {
  const t = translations[lang];

  const ALL_DEFAULT_DEPOTS = [
    'Casablanca', 'Marrakech', 'Agadir', 'Fès', 'Tanger', 'Oujda', 'Meknès', 'Safi', 'Rabat', 'Laâyoune', 'Berrechid'
  ];

  // Available depot list: merge default depots with any stored depots in state
  const availableDepotNames = Array.from(new Set([
    ...ALL_DEFAULT_DEPOTS,
    ...Object.keys(state.depots || {})
  ]));

  // Pick active depot
  const initialDepot = currentUser.depot || 'Casablanca';
  const [activeDepotName, setActiveDepotName] = useState<string>(() => {
    if (currentUser.depot) return currentUser.depot;
    if (state.depots && state.depots['Casablanca']) return 'Casablanca';
    const keys = Object.keys(state.depots || {});
    return keys[0] || 'Casablanca';
  });
  
  // Expanded Truck Stock States
  const [expandedTruckId, setExpandedTruckId] = useState<string | null>(null);
  const [truckViewTabs, setTruckViewTabs] = useState<Record<string, 'stock' | 'movements'>>({});
  
  // Forms States
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [loadItems, setLoadItems] = useState<Array<{ productId: string; productName: string; quantity: number }>>([]);
  const [loadTournee, setLoadTournee] = useState('Tournée Centre-ville Epiceries');
  const [selectedProdToLoad, setSelectedProdToLoad] = useState('');
  const [loadQty, setLoadQty] = useState(20);

  // Local adjustment form states
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjType, setAdjType] = useState<'damaged' | 'lost' | 'correction'>('damaged');
  const [adjQty, setAdjQty] = useState(10);
  const [adjNotes, setAdjNotes] = useState('');

  // Add Depot State
  const [showAddDepotForm, setShowAddDepotForm] = useState(false);
  const [newDepotName, setNewDepotName] = useState('');

  // Edit Stock State
  const [editingProduct, setEditingProduct] = useState<{ productId: string; productName: string; startingStock: number; quantity: number } | null>(null);

  // Interactive Report Search State
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // Safe fallback if activeDepotName is not yet in state.depots
  const activeDepot: DepotData = (state.depots && state.depots[activeDepotName]) || {
    name: activeDepotName,
    trucksCount: 0,
    stock: (state.products || []).map(p => ({ productId: p.id, productName: p.name, quantity: 0, startingStock: 0 })),
    returns: [],
    adjustments: []
  };
  const activeDepotTrucks = (state.trucks || []).filter(t => t.depotName === activeDepotName);

  const handleAddLoadItem = () => {
    if (!selectedProdToLoad || loadQty <= 0) return;
    const prod = state.products.find(p => p.id === selectedProdToLoad);
    if (!prod) return;

    // Validate Depot Stock before adding to draft
    const inStock = activeDepot.stock.find(s => s.productId === selectedProdToLoad)?.quantity || 0;
    const alreadyAdded = loadItems.find(i => i.productId === selectedProdToLoad)?.quantity || 0;
    
    if (inStock < alreadyAdded + loadQty) {
      alert(lang === 'fr' 
        ? `Stock insuffisant au dépôt pour "${prod.name}"! Disponible: ${inStock}, Déjà prévus: ${alreadyAdded}` 
        : `الكمية غير كافية بالمستودع لمنتج "${prod.name}"! المتوفر: ${inStock}، المخطط له: ${alreadyAdded}`
      );
      return;
    }

    const existsIdx = loadItems.findIndex(i => i.productId === selectedProdToLoad);
    if (existsIdx >= 0) {
      const updated = [...loadItems];
      updated[existsIdx].quantity += loadQty;
      setLoadItems(updated);
    } else {
      setLoadItems([...loadItems, {
        productId: selectedProdToLoad,
        productName: prod.name,
        quantity: loadQty
      }]);
    }
  };

  const handleRemoveLoadItem = (productId: string) => {
    setLoadItems(loadItems.filter(i => i.productId !== productId));
  };

  const handleLoadTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckId || loadItems.length === 0) return;

    onLoadTruck(selectedTruckId, loadItems, loadTournee);
    
    setLoadItems([]);
    setShowLoadForm(false);
    alert(lang === 'fr' ? 'Camion chargé avec succès !' : 'تم شحن الشاحنة وحسم البضائع من المستودع الإقليمي !');
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId || adjQty <= 0) return;

    onAddDepotAdjustment(activeDepotName, adjProductId, adjType, adjQty, adjNotes);
    
    setAdjProductId('');
    setAdjNotes('');
    setShowAdjForm(false);
    alert(lang === 'fr' ? 'Ajustement de stock validé !' : 'تمت تسوية وتحديث المخزون المحلي !');
  };

  // CSV Excel export function
  const handleExportCSV = () => {
    const headers = ["Produit", "Stock de depart", "Retours", "Ecarts/Pertes", "Stock Final", "Date Rapport"];
    const rows = activeDepot.stock.map(item => {
      const startingStock = item.startingStock !== undefined ? item.startingStock : item.quantity;
      const returns = activeDepot.returns.filter(r => r.productId === item.productId).reduce((s, r) => s + r.quantity, 0);
      const losses = activeDepot.adjustments.filter(a => a.productId === item.productId && (a.type === 'lost' || a.type === 'damaged')).reduce((s, a) => s + a.quantity, 0);
      return [
        item.productName,
        String(startingStock),
        String(returns),
        String(losses),
        String(item.quantity),
        new Date().toLocaleDateString()
      ];
    });
    
    exportToCSV(`Rapport_Stock_Depot_${activeDepotName}`, headers, rows);
  };

  // Simple PDF Report simulation printing
  const handlePrintPDF = () => {
    const JsPDFClass = (jsPDF as any).jsPDF || jsPDF;
    const doc = new JsPDFClass('p', 'pt', 'a4');
    let pageNum = 1;

    // Helper to draw a beautiful header on each page
    const drawPageHeader = (page: number) => {
      // Top background accent card
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(40, 40, 515, 80, 'F');
      
      // Bottom accent bar (emerald-500)
      doc.setFillColor(16, 185, 129);
      doc.rect(40, 120, 515, 4, 'F');
      
      // Text branding
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ZAHI ICE CREAM CO.", 55, 75);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("RAPPORT JOURNALIER D'ACTIVITE & SUIVI LOGISTIQUE", 55, 95);
      doc.text("SYSTEME DE GESTION DE STOCK & DISTRIBUTION", 55, 107);
      
      // Right side details
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`DEPOT : ${activeDepotName.toUpperCase()}`, 380, 75);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`EDITE LE : ${new Date().toLocaleString('fr-FR')}`, 380, 92);
      doc.text(`PAGE : ${page}`, 380, 104);
    };

    // Draw page 1 header
    drawPageHeader(pageNum);
    let y = 145;

    // Helper to check space and insert new page if needed
    const checkNewPage = (heightNeeded: number) => {
      if (y + heightNeeded > 780) {
        doc.addPage();
        pageNum++;
        drawPageHeader(pageNum);
        y = 145;
      }
    };

    // SECTION 1: RAPPORT DE STOCK QUOTIDIEN (EPURE)
    checkNewPage(40);
    doc.setFillColor(248, 250, 252); // slate-50 background for section title
    doc.rect(40, y, 515, 24, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(1);
    doc.line(40, y, 40, y + 24); // vertical emerald/slate bar

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("1. RAPPORT DE STOCK QUOTIDIEN (EPURE)", 50, y + 16);
    y += 34;

    // Table Headers for Stock
    checkNewPage(25);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(40, y, 515, 22, 'F');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("PRODUIT", 50, y + 14);
    doc.text("STOCK INITIAL", 240, y + 14, { align: "center" });
    doc.text("RETOURS (+)", 320, y + 14, { align: "center" });
    doc.text("ECARTS / PERTES (-)", 410, y + 14, { align: "center" });
    doc.text("STOCK FINAL", 515, y + 14, { align: "right" });
    y += 22;

    // Table Body for Stock
    filteredStock.forEach((item, index) => {
      const startingStock = item.startingStock !== undefined ? item.startingStock : item.quantity;
      const returns = activeDepot.returns.filter(r => r.productId === item.productId).reduce((s, r) => s + r.quantity, 0);
      const losses = activeDepot.adjustments.filter(a => a.productId === item.productId && (a.type === 'lost' || a.type === 'damaged')).reduce((s, a) => s + a.quantity, 0);

      checkNewPage(20);
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(40, y, 515, 20, 'F');
      }

      doc.setDrawColor(241, 245, 249); // subtle line
      doc.setLineWidth(0.5);
      doc.line(40, y + 20, 555, y + 20);

      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      let pName = item.productName;
      if (pName.length > 38) pName = pName.substring(0, 36) + "...";
      doc.text(pName, 50, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`${startingStock} ctn`, 240, y + 13, { align: "center" });

      if (returns > 0) {
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.setFont("helvetica", "bold");
        doc.text(`+${returns} ctn`, 320, y + 13, { align: "center" });
      } else {
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text("-", 320, y + 13, { align: "center" });
      }

      if (losses > 0) {
        doc.setTextColor(239, 68, 68); // rose-500
        doc.setFont("helvetica", "bold");
        doc.text(`-${losses} ctn`, 410, y + 13, { align: "center" });
      } else {
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text("-", 410, y + 13, { align: "center" });
      }

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.text(`${item.quantity} ctn`, 515, y + 13, { align: "right" });

      y += 20;
    });

    y += 20;

    // SECTION 2: HISTORIQUE DES CAMIONS DE TRANSPORT (EXPEDITION)
    checkNewPage(45);
    doc.setFillColor(248, 250, 252);
    doc.rect(40, y, 515, 24, 'F');
    doc.setDrawColor(59, 130, 246); // blue-500 line
    doc.setLineWidth(1);
    doc.line(40, y, 40, y + 24);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("2. HISTORIQUE DES CAMIONS DE TRANSPORT (EXPEDITION)", 50, y + 16);
    y += 34;

    const relevantTransfers = state.transfers.filter(tr => 
      tr.source === `Dépôt ${activeDepotName}` || 
      tr.destination === `Dépôt ${activeDepotName}` ||
      tr.source === activeDepotName ||
      tr.destination === activeDepotName
    );

    if (relevantTransfers.length === 0) {
      checkNewPage(40);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Aucun transfert de camion enregistré pour ce dépôt.", 50, y + 15);
      y += 30;
    } else {
      // Table Headers for Transfers
      checkNewPage(25);
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(40, y, 515, 22, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("EXPEDITION / CODE", 48, y + 14);
      doc.text("SENS / MOUVEMENT", 135, y + 14);
      doc.text("ITINERAIRE", 225, y + 14);
      doc.text("CHAUFFEUR / NOTES", 345, y + 14);
      doc.text("VOLUME", 465, y + 14, { align: "center" });
      doc.text("STATUT", 515, y + 14);
      y += 22;

      relevantTransfers.forEach((tr, index) => {
        const isOutgoing = tr.source === `Dépôt ${activeDepotName}` || tr.source === activeDepotName;
        const totalQty = tr.items.reduce((s, i) => s + i.quantity, 0);

        checkNewPage(32);
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(40, y, 515, 30, 'F');
        }

        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.5);
        doc.line(40, y + 30, 555, y + 30);

        // Tracking code & date
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(tr.trackingNumber, 48, y + 11);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        const formattedDate = new Date(tr.sentAt).toLocaleDateString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        doc.text(formattedDate, 48, y + 21);

        // Movement sense
        if (isOutgoing) {
          doc.setFillColor(254, 243, 199); // amber-100
          doc.rect(130, y + 5, 75, 15, 'F');
          doc.setTextColor(180, 83, 9); // amber-800
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.text("EXPEDITION", 167, y + 15, { align: "center" });
        } else {
          doc.setFillColor(209, 250, 229); // emerald-100
          doc.rect(130, y + 5, 75, 15, 'F');
          doc.setTextColor(6, 95, 70); // emerald-800
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.text("RECEPTION", 167, y + 15, { align: "center" });
        }

        // Itinerary
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        const srcDisplay = tr.source.replace('Dépôt ', '');
        const dstDisplay = tr.destination.replace('Dépôt ', '');
        doc.text(`De: ${srcDisplay}`, 225, y + 11);
        doc.text(`Vers: ${dstDisplay}`, 225, y + 21);

        // Carrier & driver
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        let carrier = tr.carrierName;
        if (carrier.length > 20) carrier = carrier.substring(0, 18) + "...";
        doc.text(carrier, 345, y + 11);

        if (tr.notes) {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7);
          let notesText = tr.notes;
          if (notesText.length > 22) notesText = notesText.substring(0, 20) + "...";
          doc.text(`"${notesText}"`, 345, y + 21);
        }

        // Volume
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(`${totalQty} ctn`, 465, y + 16, { align: "center" });

        // Status badge
        doc.setFontSize(7.5);
        if (tr.status === 'Received') {
          doc.setFillColor(209, 250, 229);
          doc.rect(500, y + 5, 45, 15, 'F');
          doc.setTextColor(6, 95, 70);
          doc.setFont("helvetica", "bold");
          doc.text("RECU", 522, y + 15, { align: "center" });
        } else if (tr.status === 'In Transit') {
          doc.setFillColor(219, 234, 254);
          doc.rect(500, y + 5, 45, 15, 'F');
          doc.setTextColor(30, 64, 175);
          doc.setFont("helvetica", "bold");
          doc.text("TRANSIT", 522, y + 15, { align: "center" });
        } else {
          doc.setFillColor(254, 243, 199);
          doc.rect(500, y + 5, 45, 15, 'F');
          doc.setTextColor(180, 83, 9);
          doc.setFont("helvetica", "bold");
          doc.text("EXPEDIE", 522, y + 15, { align: "center" });
        }

        y += 30;
      });
    }

    // SIGNATURES BOX
    checkNewPage(120);
    y += 25;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(40, y, 555, y);
    y += 18;

    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Signatures Officielles & Certifications Logistiques :", 50, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Rapport genere de facon securisee par l'auditeur logistique de Zahi Ice Cream.`, 50, y);
    y += 45;

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(50, y, 200, y);
    doc.line(380, y, 530, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Chef de Depot Regional", 50, y);
    doc.text("Auditeur Logistique & Controle", 380, y);
    y += 12;

    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("[Signature & Cachet]", 50, y);
    doc.text("[Signature & Visa]", 380, y);

    // Save PDF
    doc.save(`Rapport_Journalier_Zahi_Depot_${activeDepotName}.pdf`);
  };

  // Filter report products
  const filteredStock = activeDepot.stock.filter(item => 
    item.productName.toLowerCase().includes(reportSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Depot Header Selector & ALL REGIONAL DEPOTS NAVIGATION */}
      <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-center">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-sans">
                  {lang === 'fr' ? 'Dépôts Régionaux' : 'المستودعات الجهوية والإقليمية'}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full font-bold">
                  {availableDepotNames.length} {lang === 'fr' ? 'DÉPÔTS ACTIFS' : 'مستودعات نشطة'}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-full font-bold">
                  {activeDepotName} ({activeDepotTrucks.length} {lang === 'fr' ? 'CAMIONS' : 'شاحنات'})
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {lang === 'fr' ? 'Supervision logistique régionale, transferts et livraisons de tous les dépôts.' : 'الإشراف اللوجستي الإقليمي، تسويات المخازن وتعبئة الشاحنات لجميع المستودعات.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!currentUser.depot && (
              <button
                onClick={() => setShowAddDepotForm(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm"
                title={lang === 'fr' ? 'Créer Nouveau Dépôt' : 'إضافة مستودع جديد'}
              >
                <Plus className="h-4 w-4" />
                <span>{lang === 'fr' ? 'Nouveau Dépôt' : 'إضافة مستودع'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ALL REGIONAL DEPOTS PILLS / TABS (ALL DEPOTS VISIBLE AT ONCE) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {lang === 'fr' ? 'Sélectionner un Dépôt Régional :' : 'اختر المستودع الإقليمي للتصفح والمتابعة :'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {availableDepotNames.length} / {availableDepotNames.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableDepotNames.map(name => {
              const isActive = name.toLowerCase() === activeDepotName.toLowerCase();
              const dTrucks = state.trucks ? Object.values(state.trucks).filter(t => t.depot?.toLowerCase() === name.toLowerCase()) : [];
              const dStock = (state.depots && state.depots[name]?.stock) || [];
              const totalItems = dStock.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveDepotName(name)}
                  disabled={!!currentUser.depot && currentUser.depot !== name}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 font-black scale-102 ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                  <span>{name}</span>
                  <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive 
                      ? 'bg-emerald-700/80 text-white' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {dTrucks.length} {lang === 'fr' ? 'cam.' : 'ش.'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Depot stats grid & forms toggle buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Local Stock level list */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-blue-500" />
              {t.localStock}
            </h4>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowLoadForm(true); setShowAdjForm(false); }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xxs font-black cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {lang === 'fr' ? 'Charger Camion' : 'تعبئة شاحنة'}
              </button>
              <button
                onClick={() => { setShowAdjForm(true); setShowLoadForm(false); }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xxs font-black cursor-pointer"
              >
                {lang === 'fr' ? 'Ajuster Stock' : 'تعديل مخزني'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeDepot.stock.map(item => {
              const isLow = item.quantity < 100;
              const startingStock = item.startingStock !== undefined ? item.startingStock : item.quantity;
              return (
                <div key={item.productId} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.productName}</h5>
                    <div className="flex gap-4 mt-2 text-[11px] text-slate-500 font-medium">
                      <span>{lang === 'fr' ? 'Stock de départ :' : 'المخزون الافتتاحي :'} <strong className="text-slate-700 dark:text-slate-300 font-bold">{startingStock} ctn</strong></span>
                      <span>{lang === 'fr' ? 'Stock actuel :' : 'المخزون الحالي :'} <strong className="text-blue-600 dark:text-blue-400 font-black">{item.quantity} ctn</strong></span>
                    </div>
                    {isLow && (
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.2 rounded mt-1.5 inline-block">
                        {lang === 'fr' ? 'Rapprovisionnement requis !' : 'انخفاض المخزون !'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => setEditingProduct({
                        productId: item.productId,
                        productName: item.productName,
                        startingStock: startingStock,
                        quantity: item.quantity
                      })}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xxs font-black cursor-pointer transition-colors flex items-center gap-1 border border-slate-200/50 dark:border-slate-800"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{lang === 'fr' ? 'Ajuster / Modifier' : 'تعديل المخزون الافتتاحي والحالي'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GESTION DE STOCK MOBILE DES CAMIONS */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-900 gap-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 whitespace-normal">
                <Truck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>{lang === 'fr' ? 'Stock Mobile des Camions' : 'إدارة المخزون المتنقل للشاحنات'}</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">
                {lang === 'fr' ? `Suivi des stocks chargés et livraisons pour les camions de ${activeDepotName}.` : `متابعة السلع والتحركات لجميع بائعي شاحنات مستودع ${activeDepotName}.`}
              </p>
            </div>
            <span className="text-xxs font-extrabold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 rounded-full font-mono uppercase shrink-0">
              {activeDepotTrucks.length} {lang === 'fr' ? 'Camions' : 'شاحنات'}
            </span>
          </div>

          {activeDepotTrucks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              {lang === 'fr' ? 'Aucun camion actif assigné à ce dépôt.' : 'لا توجد شاحنات نشطة مسجلة في هذا المستودع.'}
            </div>
          ) : (
            <div className="space-y-3">
              {activeDepotTrucks.map(trk => {
                const isExpanded = expandedTruckId === trk.id;
                const truckViewTab = truckViewTabs[trk.id] || 'stock';
                
                // Calculate total cartons currently in truck
                const totalLoaded = trk.stock.reduce((sum, s) => sum + s.loaded, 0);
                const totalDelivered = trk.stock.reduce((sum, s) => sum + s.delivered, 0);
                const totalReturned = trk.stock.reduce((sum, s) => sum + s.returned, 0);
                const totalLost = trk.stock.reduce((sum, s) => sum + s.lost, 0);
                const remainingCartons = totalLoaded - totalDelivered - totalReturned - totalLost;

                return (
                  <div key={trk.id} className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
                    <div 
                      onClick={() => setExpandedTruckId(isExpanded ? null : trk.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{trk.id}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium">{trk.driverName}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            {lang === 'fr' ? 'Tournée :' : 'الجولة :'} <span className="text-slate-600 dark:text-slate-300 font-bold">{trk.tournee}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-slate-900 dark:text-slate-100">{remainingCartons} ctn</span>
                          <p className="text-[9px] text-slate-400 font-semibold">{lang === 'fr' ? 'en stock mobile' : 'بالمخزن المتنقل'}</p>
                        </div>
                        <span className="text-slate-400 text-xs">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-850 p-4 bg-white dark:bg-slate-950/50 space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg max-w-xs">
                          <button
                            type="button"
                            onClick={() => setTruckViewTabs(prev => ({ ...prev, [trk.id]: 'stock' }))}
                            className={`flex-1 py-1 px-2.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              truckViewTab === 'stock'
                                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {lang === 'fr' ? 'Stock Embarqué' : 'البضاعة المحملة'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTruckViewTabs(prev => ({ ...prev, [trk.id]: 'movements' }))}
                            className={`flex-1 py-1 px-2.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              truckViewTab === 'movements'
                                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {lang === 'fr' ? 'Mouvements Stock' : 'حركة المخزون'}
                          </button>
                        </div>

                        {truckViewTab === 'stock' ? (
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                              {lang === 'fr' ? 'Détail de l\'inventaire mobile :' : 'تفاصيل الجرد المتنقل للشاحنة :'}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {trk.stock.map(sItem => {
                                const remaining = sItem.loaded - sItem.delivered - sItem.returned - sItem.lost;
                                return (
                                  <div key={sItem.productId} className="p-3 bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-880 rounded-xl flex justify-between items-center text-xs">
                                    <div className="min-w-0 flex-1 pr-2">
                                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={sItem.productName}>{sItem.productName}</span>
                                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                                        {lang === 'fr' 
                                          ? `Chargés: ${sItem.loaded} | Livrés: ${sItem.delivered} | Retours: ${sItem.returned}`
                                          : `محمل: ${sItem.loaded} | مباع: ${sItem.delivered} | مرتجع: ${sItem.returned}`
                                        }
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-black font-mono text-blue-600 dark:text-blue-400">{remaining}</span>
                                      <p className="text-[9px] text-slate-400 font-semibold">{lang === 'fr' ? 'restants' : 'متبقي'}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (() => {
                          const movements: Array<{
                            id: string;
                            type: 'load' | 'delivery';
                            date: string;
                            title: string;
                            details: string;
                            quantity: number;
                            badgeColor: string;
                          }> = [];

                          trk.stock.forEach((s, idx) => {
                            if (s.loaded > 0) {
                              movements.push({
                                id: `load-${trk.id}-${s.productId}-${idx}`,
                                type: 'load',
                                date: '', 
                                title: lang === 'fr' ? 'Chargement Stock' : 'تعبئة وشحن بضاعة',
                                details: `${s.productName}`,
                                quantity: s.loaded,
                                badgeColor: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                              });
                            }
                          });

                          trk.deliveries.forEach(del => {
                            movements.push({
                              id: del.id,
                              type: 'delivery',
                              date: del.deliveredAt || '',
                              title: del.clientName,
                              details: del.items.map(it => `${it.productName} (${it.quantity} ctn)`).join(', '),
                              quantity: del.items.reduce((sum, item) => sum + item.quantity, 0),
                              badgeColor: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            });
                          });

                          return (
                            <div className="space-y-2.5">
                              <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                {lang === 'fr' ? 'Mouvements récents de stock (Chargements & Ventes) :' : 'حركات المخزون والتوزيع (تعبئة ومبيعات) :'}
                              </h5>
                              {movements.length === 0 ? (
                                <p className="text-xxs text-slate-400 italic py-2">
                                  {lang === 'fr' ? 'Aucun mouvement enregistré pour ce camion.' : 'لم يتم تسجيل أي حركة مخزنية لهذه الشاحنة بعد.'}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {movements.map(m => (
                                    <div key={m.id} className="p-3 bg-slate-50/60 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between gap-2.5 text-xxs">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-slate-700 dark:text-slate-200">{m.title}</span>
                                          <span className={`px-1.5 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-wider ${m.badgeColor}`}>
                                            {m.type === 'load' ? (lang === 'fr' ? 'Chargé' : 'شحن وتعبئة') : (lang === 'fr' ? 'Vente Livrée' : 'مبيعات مسلّمة')}
                                          </span>
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400 font-medium">
                                          {lang === 'fr' ? 'Détails : ' : 'التفاصيل : '}
                                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                                            {m.details}
                                          </span>
                                        </div>
                                        {m.date && (
                                          <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            <span>{new Date(m.date).toLocaleString()}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="sm:text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-1 font-mono border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                                        <div className="font-extrabold text-blue-600 dark:text-blue-400">
                                          {m.quantity} ctn
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic loading forms */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
          
          {/* LOAD TRUCK FORM */}
          {showLoadForm ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-880 pb-2 gap-2">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2 whitespace-normal leading-snug break-words">
                  <Truck className="h-5 w-5 text-blue-500 shrink-0" />
                  <span>{t.loadTruck}</span>
                </h4>
                <button onClick={() => setShowLoadForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleLoadTruckSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{t.selectTruck}</label>
                  <select
                    value={selectedTruckId}
                    onChange={(e) => setSelectedTruckId(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="">-- Sélectionnez --</option>
                    {activeDepotTrucks.map(t => (
                      <option key={t.id} value={t.id}>{t.id} - {t.driverName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{t.assignTournee}</label>
                  <input
                    type="text"
                    value={loadTournee}
                    onChange={(e) => setLoadTournee(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Carton picker to load */}
                <div className="p-4 bg-blue-50/20 dark:bg-slate-900/40 rounded-xl border border-blue-100/50 dark:border-slate-800/80 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{lang === 'fr' ? 'Ajouter Produit' : 'اختر الصنف للتعبئة'}</label>
                    <select
                      value={selectedProdToLoad}
                      onChange={(e) => setSelectedProdToLoad(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="">-- {lang === 'fr' ? 'Choisir' : 'اختر الصنف'} --</option>
                      {activeDepot.stock.map(s => (
                        <option key={s.productId} value={s.productId}>{s.productName} ({s.quantity} ctn)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2.5">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{lang === 'fr' ? 'Quantité' : 'الكمية'}</label>
                      <input
                        type="number"
                        value={loadQty}
                        onChange={(e) => setLoadQty(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-200"
                        min={1}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLoadItem}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1 transition-all h-[38px]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{lang === 'fr' ? 'Ajouter' : 'إضافة'}</span>
                    </button>
                  </div>

                  {loadItems.length > 0 && (
                    <div className="mt-2.5 border-t border-slate-200/50 dark:border-slate-800 pt-3 space-y-1.5">
                      {loadItems.map(item => (
                        <div key={item.productId} className="flex justify-between items-center text-xxs bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                          <span className="truncate flex-1 font-bold text-slate-700 dark:text-slate-300">{item.productName}</span>
                          <span className="font-extrabold font-mono text-blue-600 dark:text-blue-400 px-2 shrink-0">{item.quantity} ctn</span>
                          <button type="button" onClick={() => handleRemoveLoadItem(item.productId)} className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer shrink-0 px-1">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loadItems.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 transition-all"
                >
                  <Truck className="h-4 w-4" />
                  {lang === 'fr' ? 'Lancer le Chargement' : 'تأكيد وشحن الشاحنة'}
                </button>
              </form>
            </div>
          ) : showAdjForm ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                  {lang === 'fr' ? 'Ajustement Local' : 'إجراء تسوية مخزنية'}
                </h4>
                <button onClick={() => setShowAdjForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.product}</label>
                  <select
                    value={adjProductId}
                    onChange={(e) => setAdjProductId(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="">-- Sélectionnez --</option>
                    {activeDepot.stock.map(s => (
                      <option key={s.productId} value={s.productId}>{s.productName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{lang === 'fr' ? 'Type d\'ajustement' : 'نوع التسوية'}</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="damaged">{lang === 'fr' ? 'Cartons Endommagés' : 'كراتين تالفة / مكسورة'}</option>
                    <option value="lost">{lang === 'fr' ? 'Pertes ou Vol constaté' : 'خسائر أو ضياع (عجز)'}</option>
                    <option value="correction">{lang === 'fr' ? 'Correction d\'inventaire' : 'تصحيح أخطاء جرد'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.quantity} (Cartons)</label>
                  <input
                    type="number"
                    value={adjQty}
                    onChange={(e) => setAdjQty(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t.notes}</label>
                  <input
                    type="text"
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                    placeholder="Pourquoi cet écart ?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  {lang === 'fr' ? 'Soumettre l\'ajustement' : 'حفظ وتثبيت التسوية'}
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
              <Truck className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'fr' ? 'Activités de Distribution' : 'أنشطة التوزيع الميداني'}
                </p>
                <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-1 leading-normal font-sans">
                  {lang === 'fr' 
                    ? 'Cliquez sur charger camion pour affecter du stock aux vendeurs de tournée.' 
                    : 'قم بتعبئة الشاحنات لإرسال المنتجات للبيع بالتجزئة في المدن.'}
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Historique des Camions de Transport (Expéditions) */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Truck className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
              {lang === 'fr' ? "Historique des Camions de Transport (Expédition)" : "سجل شاحنات النقل الكبير (الشحنات والواردات)"}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium font-sans mt-1">
              {lang === 'fr' 
                ? `Historique des expéditions et réceptions de marchandises par camions de transport pour le dépôt ${activeDepotName}.` 
                : `سجل الشحنات والواردات اللوجستية التي تمت بواسطة شاحنات النقل الكبرى لمستودع ${activeDepotName}.`}
            </p>
          </div>
          <span className="text-xxs font-extrabold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 rounded-full font-mono uppercase shrink-0">
            {state.transfers.filter(tr => 
              tr.source === `Dépôt ${activeDepotName}` || 
              tr.destination === `Dépôt ${activeDepotName}` ||
              tr.source === activeDepotName ||
              tr.destination === activeDepotName
            ).length} {lang === 'fr' ? 'Transferts' : 'شحنات'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'N° Expédition / Suivi' : 'رقم الشحنة'}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Sens / Type' : 'نوع الحركة'}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Itinéraire' : 'مسار الرحلة'}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Transporteur / Chauffeur' : 'الناقل / الشاحنة'}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Volume / Contenu' : 'المحتوى والكمية'}</th>
                <th className="px-4 py-3 text-center font-bold">{lang === 'fr' ? 'Statut' : 'الحالة'}</th>
                <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Date Expédition' : 'تاريخ الشحن'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {(() => {
                const relevantTransfers = state.transfers.filter(tr => 
                  tr.source === `Dépôt ${activeDepotName}` || 
                  tr.destination === `Dépôt ${activeDepotName}` ||
                  tr.source === activeDepotName ||
                  tr.destination === activeDepotName
                );

                if (relevantTransfers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                        {lang === 'fr' ? 'Aucun transfert de transport enregistré pour ce dépôt.' : 'لا توجد شحنات نقل مسجلة لهذا المستودع بعد.'}
                      </td>
                    </tr>
                  );
                }

                return relevantTransfers.map(tr => {
                  const isOutgoing = tr.source === `Dépôt ${activeDepotName}` || tr.source === activeDepotName;
                  const totalQty = tr.items.reduce((s, i) => s + i.quantity, 0);
                  
                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex flex-col">
                          <span>{tr.trackingNumber}</span>
                          {tr.temperatureAlert && (
                            <span className="text-[8px] mt-1 bg-red-100 text-red-850 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded font-extrabold max-w-max uppercase">
                              🚨 {lang === 'fr' ? 'Alerte Temp' : 'تنبيه الحرارة'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isOutgoing ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                            ↗ {lang === 'fr' ? 'Expédition / Sortie' : 'شحنة صادرة'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                            ↘ {lang === 'fr' ? 'Réception / Entrée' : 'واردة ومستلمة'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        <div className="flex flex-col text-[11px] space-y-0.5">
                          <span className="text-slate-400 font-medium">
                            {lang === 'fr' ? 'De :' : 'من :'}{' '}
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{tr.source}</strong>
                          </span>
                          <span className="text-slate-400 font-medium">
                            {lang === 'fr' ? 'Vers :' : 'إلى :'}{' '}
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{tr.destination}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{tr.carrierName}</p>
                        {tr.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[150px]" title={tr.notes}>
                            "{tr.notes}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-850 dark:text-slate-100 font-mono">{totalQty} ctn</p>
                        <div className="text-[10px] text-slate-400 mt-0.5 max-w-[180px] truncate font-sans" title={tr.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}>
                          {tr.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {tr.status === 'Received' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] rounded-full font-bold">REÇU</span>
                          )}
                          {tr.status === 'In Transit' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-850 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] rounded-full font-bold animate-pulse">EN TRANSIT</span>
                          )}
                          {tr.status === 'Pending' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-850 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] rounded-full font-bold">EXPÉDIÉ</span>
                          )}
                          {tr.lossCount > 0 && (
                            <span className="text-[9px] text-rose-500 font-extrabold font-mono">
                              -{tr.lossCount} {lang === 'fr' ? 'perdus' : 'مفقود'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 text-xxs">
                        {new Date(tr.sentAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-MA', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Daily Report Section (Printable layout / exports) */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-emerald-500" />
              {t.dailyReport}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium font-sans">
              {lang === 'fr' ? 'Rapport officiel consolidé d\'inventaire pour les auditeurs et comptables.' : 'التقرير اليومي الموحد للجرد المخزني المعتمد للمحاسبين الماليين.'}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xxs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              {t.exportExcel}
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-initial px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xxs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-500 animate-bounce" />
              {t.printPDF}
            </button>
          </div>
        </div>

        {/* Interactive Search Field for the table */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={lang === 'fr' ? '🔍 Filtrer le rapport de stock...' : '🔍 تصفية تقرير المخزون...'}
            value={reportSearchTerm}
            onChange={(e) => setReportSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Modern Printable / Interactive report */}
        <div className="p-6 bg-slate-55 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-4">
          <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-150">ZAHI ICE CREAM CO.</h5>
              <p className="text-[10px] text-slate-400">{lang === 'fr' ? 'Rapport de Stock Quotidien (Épuré)' : 'تقرير المخزون اليومي (المبسط)'}</p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
              <p>{lang === 'fr' ? 'Dépôt : ' : 'المستودع : '} {activeDepotName}</p>
              <p>{lang === 'fr' ? 'Date : ' : 'التاريخ : '} {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5">{t.product}</th>
                  <th className="py-2.5 text-center">{lang === 'fr' ? 'Stock de départ' : 'المخزون الافتتاحي'}</th>
                  <th className="py-2.5 text-center">{lang === 'fr' ? 'Retours (+)' : 'المرتجعات (+)'}</th>
                  <th className="py-2.5 text-center">{lang === 'fr' ? 'Écarts/Pertes (-)' : 'الهدر والتلف (-)'}</th>
                  <th className="py-2.5 text-right">{lang === 'fr' ? 'Stock de fin' : 'رصيد مخزن الختامي'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-850">
                {filteredStock.map(item => {
                  const startingStock = item.startingStock !== undefined ? item.startingStock : item.quantity;
                  const returns = activeDepot.returns.filter(r => r.productId === item.productId).reduce((s, r) => s + r.quantity, 0);
                  const losses = activeDepot.adjustments.filter(a => a.productId === item.productId && (a.type === 'lost' || a.type === 'damaged')).reduce((s, a) => s + a.quantity, 0);

                  return (
                    <tr key={item.productId} className="hover:bg-white/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.productName}</td>
                      <td className="py-3 text-center font-mono text-slate-500 font-medium">{startingStock} ctn</td>
                      <td className="py-3 text-center font-mono text-emerald-600 font-semibold">
                        {returns > 0 ? `+${returns} ctn` : '-'}
                      </td>
                      <td className="py-3 text-center font-mono text-rose-500 font-semibold">
                        {losses > 0 ? `-${losses} ctn` : '-'}
                      </td>
                      <td className="py-3 text-right font-black font-mono text-slate-900 dark:text-white">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[13px]">{item.quantity} ctn</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500">
            <p>{lang === 'fr' ? 'Signature Chef de Dépôt :' : 'توقيع أمين المستودع :'}</p>
            <p className="italic font-bold font-mono">Zahi Logistics System Verified</p>
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW DEPOT */}
      {showAddDepotForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {lang === 'fr' ? 'Nouveau Dépôt Régional' : 'إضافة مستودع إقليمي جديد'}
              </h4>
              <button onClick={() => setShowAddDepotForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {lang === 'fr' ? 'Nom de la Ville / Région' : 'اسم المدينة / الإقليم'}
                </label>
                <input
                  type="text"
                  value={newDepotName}
                  onChange={(e) => setNewDepotName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  placeholder="Ex: Fès, Nador, etc."
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddDepotForm(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === 'fr' ? 'Annuler' : 'إلغاء'}
              </button>
              <button
                onClick={async () => {
                  if (!newDepotName.trim()) {
                    alert(lang === 'fr' ? 'Veuillez saisir un nom valide' : 'يرجى إدخال اسم صحيح');
                    return;
                  }
                  const ok = await onAddDepot(newDepotName.trim());
                  if (ok) {
                    setActiveDepotName(newDepotName.trim());
                    setNewDepotName('');
                    setShowAddDepotForm(false);
                    alert(lang === 'fr' ? 'Dépôt créé avec succès !' : 'تم إنشاء المستودع بنجاح !');
                  }
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer animate-fade-in"
              >
                {lang === 'fr' ? 'Créer' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STARTING & CURRENT STOCK */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-100">
                {lang === 'fr' ? 'Ajuster Stocks' : 'تعديل المخزون للمنتج'}
              </h4>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-black">{lang === 'fr' ? 'Produit :' : 'المنتج :'}</p>
              <p className="text-xs font-black text-slate-800 dark:text-white">{editingProduct.productName}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {lang === 'fr' ? 'Stock de Départ (Opening Stock)' : 'المخزون الافتتاحي (البداية)'}
                </label>
                <input
                  type="number"
                  value={editingProduct.startingStock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, startingStock: Number(e.target.value) })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {lang === 'fr' ? 'Stock Actuel (Current Stock)' : 'المخزون الحالي (المتبقي)'}
                </label>
                <input
                  type="number"
                  value={editingProduct.quantity}
                  onChange={(e) => setEditingProduct({ ...editingProduct, quantity: Number(e.target.value) })}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                  min={0}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === 'fr' ? 'Annuler' : 'إلغاء'}
              </button>
              <button
                onClick={async () => {
                  const ok = await onUpdateDepotStartingStock(activeDepotName, editingProduct.productId, editingProduct.startingStock, editingProduct.quantity);
                  if (ok) {
                    setEditingProduct(null);
                    alert(lang === 'fr' ? 'Stock mis à jour avec succès !' : 'تم تحديث المخزون بنجاح !');
                  }
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === 'fr' ? 'Sauvegarder' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
