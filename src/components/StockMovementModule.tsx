/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  SystemState, 
  Product, 
  Transfer, 
  ProductionBatch, 
  DepotData,
  User
} from '../types';
import { translations } from '../translations';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Boxes, 
  Warehouse, 
  Building, 
  MapPin, 
  Download, 
  Search, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Truck,
  RotateCcw
} from 'lucide-react';

interface StockMovementModuleProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  currentUser?: User;
}

interface MovementItem {
  id: string;
  type: 'production' | 'transfer_in' | 'transfer_out' | 'return' | 'adjustment' | 'delivery';
  date: string;
  code: string;
  source: string;
  destination: string;
  details: string;
  items: { productName: string; quantity: number }[];
  totalQuantity: number;
  status: string;
}

export default function StockMovementModule({ state, lang, currentUser }: StockMovementModuleProps) {
  const t = translations[lang];

  const isDepotManager = currentUser?.role === 'Responsable Dépôt' && currentUser?.depot;

  // Selected Stock Location
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    if (isDepotManager) {
      return `Dépôt ${currentUser.depot}`;
    }
    return 'Magasin Usine';
  });

  React.useEffect(() => {
    if (isDepotManager) {
      setSelectedLocation(`Dépôt ${currentUser.depot}`);
    } else {
      setSelectedLocation('Magasin Usine');
    }
  }, [currentUser?.role, currentUser?.depot]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Available stock options matching the user's requirements:
  // - Magasin Usine Zahi
  // - Magasin MICZ
  // - Magasin Zone Logistique
  // - 8 Depots
  const locationOptions = [
    { id: 'Magasin Usine', label: lang === 'fr' ? 'Magasin Usine Zahi' : 'مستودع مصنع زاهي', type: 'factory', icon: <Building className="h-4 w-4 text-sky-500" /> },
    { id: 'Magasin MICZ', label: lang === 'fr' ? 'Magasin MICZ' : 'مستودع MICZ اللوجستي', type: 'hub', icon: <Warehouse className="h-4 w-4 text-indigo-500" /> },
    { id: 'Magasin Zone Logistique', label: lang === 'fr' ? 'Magasin Zone Logistique' : 'مستودع المنطقة اللوجستية', type: 'zone', icon: <Warehouse className="h-4 w-4 text-purple-500" /> },
    ...Object.keys(state.depots).map(depotName => ({
      id: `Dépôt ${depotName}`,
      label: lang === 'fr' ? `Dépôt ${depotName}` : `مستودع ${depotName}`,
      type: 'depot',
      icon: <MapPin className="h-4 w-4 text-emerald-500" />
    }))
  ];

  const filteredLocationOptions = isDepotManager
    ? locationOptions.filter(o => o.id === `Dépôt ${currentUser.depot}`)
    : locationOptions;

  const activeOption = filteredLocationOptions.find(o => o.id === selectedLocation) || filteredLocationOptions[0] || locationOptions[0];

  // Helper to extract clean Depot Name
  const getCleanDepotName = (loc: string) => loc.replace('Dépôt ', '');

  // 1. GATHER CURRENT STOCK BREAKDOWN
  const getCurrentStock = () => {
    if (selectedLocation.startsWith('Dépôt ')) {
      const depName = getCleanDepotName(selectedLocation);
      const depot = state.depots[depName];
      if (depot) {
        return depot.stock.map(s => ({
          productId: s.productId,
          productName: s.productName,
          quantity: s.quantity,
          startingStock: s.startingStock || s.quantity
        }));
      }
      return [];
    }

    // For Factory, MICZ, Zone Logistique, fetch from stockPositions
    return state.stockPositions
      .filter(sp => sp.location === selectedLocation)
      .map(sp => ({
        productId: sp.productId,
        productName: sp.productName,
        quantity: sp.quantity,
        startingStock: sp.quantity // Fallback
      }));
  };

  const currentStock = getCurrentStock();

  // 2. COMPILE ALL CHRONOLOGICAL MOVEMENTS FOR THE SELECTED LOCATION
  const getMovements = (): MovementItem[] => {
    const list: MovementItem[] = [];

    // -- A. PRODUCTION BATCHES (Only relevant for "Magasin Usine" / Factory)
    if (selectedLocation === 'Magasin Usine') {
      state.batches.forEach(b => {
        list.push({
          id: b.id,
          type: 'production',
          date: b.productionDate,
          code: b.batchNumber,
          source: lang === 'fr' ? 'Ligne de Production' : 'خط الإنتاج',
          destination: lang === 'fr' ? 'Magasin Usine Zahi' : 'مستودع مصنع زاهي',
          details: b.status === 'damaged' ? (lang === 'fr' ? 'Endommagé' : 'تالف') : b.status === 'expired' ? (lang === 'fr' ? 'Expiré' : 'منتهي الصلاحية') : (lang === 'fr' ? 'Production Conforme' : 'إنتاج مطابق للمواصفات'),
          items: [{ productName: b.productName, quantity: b.quantity }],
          totalQuantity: b.quantity,
          status: b.status === 'active' ? 'Conforme' : b.status.toUpperCase()
        });
      });
    }

    // -- B. INTERNAL TRANSFERS (Relevant if Source or Destination is selectedLocation)
    state.transfers.forEach(tr => {
      const isSrc = tr.source === selectedLocation || tr.source === getCleanDepotName(selectedLocation);
      const isDst = tr.destination === selectedLocation || tr.destination === getCleanDepotName(selectedLocation);

      if (isSrc) {
        list.push({
          id: tr.id,
          type: 'transfer_out',
          date: tr.sentAt,
          code: tr.trackingNumber,
          source: tr.source,
          destination: tr.destination,
          details: lang === 'fr' ? `Expédition par ${tr.carrierName}` : `شحن بواسطة ${tr.carrierName}`,
          items: tr.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
          totalQuantity: tr.items.reduce((s, i) => s + i.quantity, 0),
          status: tr.status
        });
      }

      if (isDst) {
        list.push({
          id: tr.id,
          type: 'transfer_in',
          date: tr.receivedAt || tr.sentAt,
          code: tr.trackingNumber,
          source: tr.source,
          destination: tr.destination,
          details: tr.status === 'Received' 
            ? (lang === 'fr' ? `Réceptionné (Ecarts: ${tr.lossCount} cartons)` : `تم الاستلام (فروقات: ${tr.lossCount} كرتونة)`)
            : (lang === 'fr' ? `En cours de transport` : `في الطريق / عبور`),
          items: tr.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
          totalQuantity: tr.items.reduce((s, i) => s + i.quantity, 0),
          status: tr.status
        });
      }
    });

    // -- C. RETURNS & ADJUSTMENTS (Specific to Depot stores)
    if (selectedLocation.startsWith('Dépôt ')) {
      const depName = getCleanDepotName(selectedLocation);
      const depot = state.depots[depName];
      if (depot) {
        // Returns
        depot.returns.forEach(ret => {
          list.push({
            id: ret.id,
            type: 'return',
            date: ret.date,
            code: `RET-${ret.id.substring(0, 5).toUpperCase()}`,
            source: lang === 'fr' ? 'Client' : 'عميل / زبون',
            destination: selectedLocation,
            details: lang === 'fr' ? `Retour client (${ret.reason})` : `مرتجع عميل (${ret.reason})`,
            items: [{ productName: ret.productName, quantity: ret.quantity }],
            totalQuantity: ret.quantity,
            status: 'Complété'
          });
        });

        // Adjustments
        depot.adjustments.forEach(adj => {
          list.push({
            id: adj.id,
            type: 'adjustment',
            date: adj.date,
            code: `ADJ-${adj.id.substring(0, 5).toUpperCase()}`,
            source: selectedLocation,
            destination: lang === 'fr' ? 'Zone Pertes' : 'منطقة التالف والمفقود',
            details: lang === 'fr' ? `Ajustement (${adj.type} - ${adj.notes})` : `تعديل مخزون (${adj.type} - ${adj.notes})`,
            items: [{ productName: adj.productName, quantity: adj.quantity }],
            totalQuantity: adj.quantity,
            status: 'Ajusté'
          });
        });
      }

      // -- D. DELIVERIES (If trucks related to this depot completed sales)
      const relevantTrucks = state.trucks.filter(t => t.depotName === depName);
      relevantTrucks.forEach(truck => {
        truck.deliveries.forEach(del => {
          if (del.status === 'Delivered') {
            list.push({
              id: del.id,
              type: 'delivery',
              date: del.deliveredAt || new Date().toISOString(),
              code: `LIV-${del.id.substring(0, 5).toUpperCase()}`,
              source: selectedLocation,
              destination: `${del.clientName} (${del.city})`,
              details: lang === 'fr' ? `Vente directe Chauffeur - ${truck.driverName}` : `بيع مباشر من السائق - ${truck.driverName}`,
              items: del.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
              totalQuantity: del.items.reduce((s, i) => s + i.quantity, 0),
              status: 'Livré'
            });
          }
        });
      });
    }

    // Sort chronologically (newest first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const allMovements = getMovements();

  // Filters
  const filteredMovements = allMovements.filter(m => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    if (typeFilter === 'all') return matchesSearch;
    if (typeFilter === 'production' && m.type === 'production') return matchesSearch;
    if (typeFilter === 'transfers' && (m.type === 'transfer_in' || m.type === 'transfer_out')) return matchesSearch;
    if (typeFilter === 'returns' && m.type === 'return') return matchesSearch;
    if (typeFilter === 'adjustments' && m.type === 'adjustment') return matchesSearch;
    if (typeFilter === 'deliveries' && m.type === 'delivery') return matchesSearch;
    
    return false;
  });

  // Calculate totals for active stock
  const totalStockQty = currentStock.reduce((sum, s) => sum + s.quantity, 0);
  const totalInflows = allMovements
    .filter(m => m.type === 'production' || m.type === 'transfer_in' || m.type === 'return')
    .reduce((sum, m) => sum + m.totalQuantity, 0);
  const totalOutflows = allMovements
    .filter(m => m.type === 'transfer_out' || m.type === 'adjustment' || m.type === 'delivery')
    .reduce((sum, m) => sum + m.totalQuantity, 0);

  // 3. HANDLER FOR DOWNLOAD STOCK MOVEMENT PDF
  const handleDownloadPDF = () => {
    const JsPDFClass = (jsPDF as any).jsPDF || jsPDF;
    const doc = new JsPDFClass('p', 'pt', 'a4');
    let pageNum = 1;

    // Custom Header function
    const drawHeader = (page: number) => {
      // Background Accent (slate-900)
      doc.setFillColor(15, 23, 42);
      doc.rect(40, 40, 515, 80, 'F');

      // Emerald Line Separator
      doc.setFillColor(16, 185, 129);
      doc.rect(40, 120, 515, 4, 'F');

      // Title & Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("ZAHI ICE CREAM CO. - LOGISTICS", 55, 72);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("FICHE CONSOLIDEE DES MOUVEMENTS DE STOCK & FLUX", 55, 92);
      doc.text("SUIVI DES TRANSFERTS INTERNES, PRODUCTION ET PERTES", 55, 104);

      // Metadata right-aligned
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${activeOption.label.toUpperCase()}`, 540, 72, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`EDITE LE : ${new Date().toLocaleString('fr-FR')}`, 540, 92, { align: "right" });
      doc.text(`PAGE : ${page}`, 540, 104, { align: "right" });
    };

    drawHeader(pageNum);
    let y = 145;

    // Page overflow safety helper
    const checkSpace = (neededHeight: number) => {
      if (y + neededHeight > 780) {
        doc.addPage();
        pageNum++;
        drawHeader(pageNum);
        y = 145;
      }
    };

    // -- BLOCK A: SYNTHESE / KPI
    checkSpace(65);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(40, y, 515, 55, 6, 6, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.roundedRect(40, y, 515, 55, 6, 6, 'D');

    // KPI text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("STOCK ACTUEL DISPONIBLE", 60, y + 20);
    doc.text("TOTAL DES ENTREES (FLUX)", 200, y + 20);
    doc.text("TOTAL DES SORTIES (FLUX)", 350, y + 20);
    doc.text("INDICE D'ACTIVITE", 470, y + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`${totalStockQty} ctn`, 60, y + 38);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`+${totalInflows} ctn`, 200, y + 38);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`-${totalOutflows} ctn`, 350, y + 38);
    doc.setTextColor(59, 130, 246); // blue-500
    doc.text(`${allMovements.length} op`, 470, y + 38);

    y += 75;

    // -- BLOCK B: STOCK ACTUEL BREAKDOWN
    checkSpace(35);
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(40, y, 515, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("I. COMPOSITION ET ETAT DE STOCK DU MAGASIN / DEPOT", 50, y + 13);
    y += 24;

    // Headers
    checkSpace(20);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(40, y, 515, 18, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("NOM DE PRODUIT", 50, y + 12);
    doc.text("STOCK ACTUEL (CARTONS)", 530, y + 12, { align: "right" });
    y += 18;

    if (currentStock.length === 0) {
      checkSpace(25);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Aucun produit en stock enregistré dans cet emplacement.", 50, y + 15);
      y += 25;
    } else {
      currentStock.forEach((st, idx) => {
        checkSpace(18);
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(40, y, 515, 16, 'F');
        }
        doc.setDrawColor(241, 245, 249);
        doc.line(40, y + 16, 555, y + 16);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(st.productName, 50, y + 11);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`${st.quantity} ctn`, 530, y + 11, { align: "right" });
        y += 16;
      });
    }

    y += 25;

    // -- BLOCK C: CHRONIQUE DES MOUVEMENTS ET TRANSFERTS
    checkSpace(35);
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(40, y, 515, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("II. GRAND LIVRE CHRONOLOGIQUE DES MOUVEMENTS DE STOCK", 50, y + 13);
    y += 24;

    // Headers
    checkSpace(20);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(40, y, 515, 18, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("DATE / HEURE", 46, y + 12);
    doc.text("CODE/BATCH", 120, y + 12);
    doc.text("TYPE FLUX", 185, y + 12);
    doc.text("ORIGINE", 255, y + 12);
    doc.text("DESTINATION", 335, y + 12);
    doc.text("VOLUME", 475, y + 12);
    doc.text("STATUT", 522, y + 12);
    y += 18;

    if (filteredMovements.length === 0) {
      checkSpace(25);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Aucun flux ou mouvement de stock correspondant trouvé.", 50, y + 15);
      y += 25;
    } else {
      filteredMovements.forEach((mov, idx) => {
        checkSpace(28);
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(40, y, 515, 24, 'F');
        }
        doc.setDrawColor(241, 245, 249);
        doc.line(40, y + 24, 555, y + 24);

        // Date formatted
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const fDate = new Date(mov.date).toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        doc.text(fDate, 46, y + 14);

        // Code
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(mov.code, 120, y + 14);

        // Type Flux
        let typeStr = mov.type.toUpperCase();
        if (mov.type === 'production') {
          doc.setTextColor(16, 185, 129); // emerald
          typeStr = "PRODUCTION";
        } else if (mov.type === 'transfer_in') {
          doc.setTextColor(59, 130, 246); // blue
          typeStr = "ENTREE (TR)";
        } else if (mov.type === 'transfer_out') {
          doc.setTextColor(217, 119, 6); // amber
          typeStr = "SORTIE (TR)";
        } else if (mov.type === 'return') {
          doc.setTextColor(5, 150, 105);
          typeStr = "RETOUR CLI";
        } else if (mov.type === 'adjustment') {
          doc.setTextColor(225, 29, 72);
          typeStr = "PERTE/AJUS";
        } else if (mov.type === 'delivery') {
          doc.setTextColor(109, 40, 217);
          typeStr = "LIVRAISON";
        }
        doc.text(typeStr, 185, y + 14);

        // Source & Destination
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        let src = mov.source.replace('Dépôt ', '').replace('Magasin ', '');
        let dst = mov.destination.replace('Dépôt ', '').replace('Magasin ', '');
        if (src.length > 15) src = src.substring(0, 13) + "..";
        if (dst.length > 15) dst = dst.substring(0, 13) + "..";
        doc.text(src, 255, y + 14);
        doc.text(dst, 335, y + 14);

        // Volume
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${mov.totalQuantity} ctn`, 475, y + 14);

        // Status
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        if (mov.status === 'Received' || mov.status === 'Conforme' || mov.status === 'Livré' || mov.status === 'Complété' || mov.status === 'Ajusté') {
          doc.setTextColor(16, 185, 129);
          doc.text("OK", 522, y + 14);
        } else {
          doc.setTextColor(217, 119, 6);
          doc.text(mov.status, 522, y + 14);
        }

        // Subtitle line with detailed items list
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        const productsSample = mov.items.map(it => `${it.productName} (${it.quantity} ctn)`).join(', ');
        const summaryText = productsSample.length > 110 ? productsSample.substring(0, 107) + "..." : productsSample;
        doc.text(summaryText, 120, y + 21);

        y += 24;
      });
    }

    // SIGNATURES
    checkSpace(110);
    y += 20;
    doc.setDrawColor(226, 232, 240);
    doc.line(40, y, 555, y);
    y += 15;

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Cadre reservé au contrôle d'audit logistique :", 50, y);
    y += 45;

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(50, y, 180, y);
    doc.line(390, y, 520, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Le Contrôleur de Stock", 50, y);
    doc.text("Visa Direction Logistique", 390, y);

    // Save document
    const cleanFileName = activeOption.label.replace(/\s+/g, '_');
    doc.save(`Mouvements_Stock_${cleanFileName}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Location Selector Grid */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500 animate-pulse" />
              {lang === 'fr' ? 'Mouvements de Stock Consolidés' : 'حركة وتتبع المخزون الموحد'}
            </h2>
            <p className="text-xxs text-slate-400 mt-1">
              {lang === 'fr' 
                ? 'Suivi exhaustif des transferts internes, de la production et des ventes par point de stockage.' 
                : 'تتبع شامل لعمليات الإنتاج، التحويلات الداخلية، المبيعات والمرتجعات لكل مستودع.'}
            </p>
          </div>
          
          <button
            onClick={handleDownloadPDF}
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xxs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" />
            {lang === 'fr' ? 'Télécharger Rapport PDF' : 'تحميل تقرير PDF للكل'}
          </button>
        </div>

        {/* Location Selection Grid */}
        <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
          {lang === 'fr' ? 'Sélectionner l\'Entrepôt / Stock :' : 'اختر المستودع / نقطة المخزون :'}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredLocationOptions.map(option => {
            const isSelected = selectedLocation === option.id;
            return (
              <button
                key={option.id}
                id={`btn-loc-${option.id.replace(/\s+/g, '-')}`}
                onClick={() => setSelectedLocation(option.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/10' 
                    : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="mb-2 p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 shadow-xs">
                  {option.icon}
                </span>
                <span className="text-[10px] font-bold truncate w-full">{option.label}</span>
                <span className="text-[9px] text-slate-400 mt-1">
                  {option.type === 'factory' ? (lang === 'fr' ? 'Usine' : 'مصنع') : option.type === 'hub' ? 'Hub MICZ' : option.type === 'zone' ? 'Zone Log' : (lang === 'fr' ? 'Régional' : 'مستودع')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. KPI Summary Panels for selected Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Current Stock */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Stock Actuel Net' : 'صافي المخزون الحالي'}
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 block">
              {totalStockQty} <span className="text-xxs font-normal text-slate-400">cartons</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {lang === 'fr' ? 'Quantité physique résiduelle' : 'المخزون الفعلي المتوفر'}
            </span>
          </div>
          <div className="h-11 w-11 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        {/* KPI: Inflows */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Flux Entrants (+)' : 'إجمالي التدفقات الواردة'}
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
              +{totalInflows} <span className="text-xxs font-normal text-slate-400">cartons</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {lang === 'fr' ? 'Production ou transferts reçus' : 'إنتاج أو شحنات واردة مستلمة'}
            </span>
          </div>
          <div className="h-11 w-11 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        {/* KPI: Outflows */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Flux Sortants (-)' : 'إجمالي التدفقات الصادرة'}
            </span>
            <span className="text-xl font-black text-rose-500 dark:text-rose-400 block">
              -{totalOutflows} <span className="text-xxs font-normal text-slate-400">cartons</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {lang === 'fr' ? 'Expéditions, pertes ou ventes' : 'شحنات صادرة، مبيعات وتالف'}
            </span>
          </div>
          <div className="h-11 w-11 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        {/* KPI: Operations Index */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Transactions Réelles' : 'سجل العمليات المعالجة'}
            </span>
            <span className="text-xl font-black text-indigo-500 dark:text-indigo-400 block">
              {allMovements.length} <span className="text-xxs font-normal text-slate-400">mouvements</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {lang === 'fr' ? 'Opérations logistiques totales' : 'مجموع التحركات في السجل اليومي'}
            </span>
          </div>
          <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. Main Data Tabs (Current Stock & Movement Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Stock Positions Breakdown at Location */}
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-xxs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <Boxes className="h-4 w-4 text-sky-500" />
              {lang === 'fr' ? 'État Réel du Stock' : 'الحالة الفعلية للمخزون'}
            </h3>
            <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded">
              {currentStock.length} SKU
            </span>
          </div>

          {currentStock.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto animate-bounce" />
              <p className="text-xxs font-bold uppercase">{lang === 'fr' ? 'Aucun Stock Physique' : 'لا يوجد مخزون فعلي حالياً'}</p>
              <p className="text-[9px]">{lang === 'fr' ? 'Cet entrepôt ne dispose d\'aucun produit enregistré.' : 'المستودع فارغ ولا توجد كميات مدخلة.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {currentStock.map(stockItem => (
                <div key={stockItem.productId} className="py-3 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-900/10 px-1 rounded-lg transition-colors">
                  <div className="min-w-0 pr-2">
                    <span className="text-xxs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {stockItem.productName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      {lang === 'fr' ? `Stock initial : ${stockItem.startingStock || stockItem.quantity} ctn` : `المخزون الابتدائي: ${stockItem.startingStock || stockItem.quantity} كرتونة`}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {stockItem.quantity} ctn
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Columns: Movement Timeline History (The meat of the request) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex flex-col">
          
          {/* Timeline Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="text-xxs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <History className="h-4 w-4 text-indigo-500" />
              {lang === 'fr' ? 'Mouvements & Flux Enregistrés' : 'سجل حركات وتدفقات السلع الموثقة'}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type selector */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
              >
                <option value="all">{lang === 'fr' ? 'Tous les types' : 'جميع التدفقات'}</option>
                <option value="production">{lang === 'fr' ? 'Production' : 'الإنتاج فقط'}</option>
                <option value="transfers">{lang === 'fr' ? 'Transferts' : 'التحويلات الداخلية'}</option>
                <option value="returns">{lang === 'fr' ? 'Retours clients' : 'مرتجع عميل'}</option>
                <option value="adjustments">{lang === 'fr' ? 'Pertes/Ajustements' : 'التعديلات والخسائر'}</option>
                <option value="deliveries">{lang === 'fr' ? 'Livraisons' : 'مبيعات وتوزيع'}</option>
              </select>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Filtrer les flux...' : 'بحث في الحركات...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xxs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Timeline Feed list */}
          {filteredMovements.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex-1 flex flex-col items-center justify-center space-y-2">
              <RotateCcw className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-spin" />
              <p className="text-xxs font-black uppercase text-slate-500">{lang === 'fr' ? 'Aucune Opération' : 'لا توجد حركات مخزون'}</p>
              <p className="text-[10px]">{lang === 'fr' ? 'Aucun mouvement ne correspond aux filtres.' : 'لا تطابق أي عمليات فلاتر البحث الحالية.'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 flex-1">
              {filteredMovements.map(mov => {
                const isProduction = mov.type === 'production';
                const isTransferIn = mov.type === 'transfer_in';
                const isTransferOut = mov.type === 'transfer_out';
                const isReturn = mov.type === 'return';
                const isAdjustment = mov.type === 'adjustment';
                const isDelivery = mov.type === 'delivery';

                // Icons and Colors for type of flow
                let flowIcon = <History className="h-4 w-4" />;
                let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
                let flowLabel = '';

                if (isProduction) {
                  flowIcon = <Boxes className="h-4 w-4 text-emerald-500" />;
                  badgeColor = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                  flowLabel = lang === 'fr' ? 'Production (Entrée)' : 'إنتاج ومخزون جديد';
                } else if (isTransferIn) {
                  flowIcon = <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
                  badgeColor = 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
                  flowLabel = lang === 'fr' ? 'Transfert Reçu (Entrée)' : 'تحويل وارد (مستلم)';
                } else if (isTransferOut) {
                  flowIcon = <ArrowUpRight className="h-4 w-4 text-amber-500" />;
                  badgeColor = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
                  flowLabel = lang === 'fr' ? 'Transfert Envoyé (Sortie)' : 'تحويل صادر (شحن)';
                } else if (isReturn) {
                  flowIcon = <RotateCcw className="h-4 w-4 text-teal-500" />;
                  badgeColor = 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30';
                  flowLabel = lang === 'fr' ? 'Retour Client (Entrée)' : 'مرتجع عملاء';
                } else if (isAdjustment) {
                  flowIcon = <AlertTriangle className="h-4 w-4 text-rose-500" />;
                  badgeColor = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
                  flowLabel = lang === 'fr' ? 'Ajustement/Perte (Sortie)' : 'تسوية خسائر / تالف';
                } else if (isDelivery) {
                  flowIcon = <Truck className="h-4 w-4 text-purple-500" />;
                  badgeColor = 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
                  flowLabel = lang === 'fr' ? 'Vente / Livraison (Sortie)' : 'مبيعات وتوزيع';
                }

                return (
                  <div 
                    key={mov.id} 
                    className="p-3.5 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200/60 dark:border-slate-850 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                  >
                    <div className="flex gap-3 items-start min-w-0 flex-1">
                      <div className={`p-2 rounded-xl border ${badgeColor} mt-0.5 flex-shrink-0`}>
                        {flowIcon}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">
                            {mov.code}
                          </span>
                          <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full border bg-white dark:bg-slate-950 uppercase tracking-wider text-slate-500">
                            {flowLabel}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(mov.date).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Itinerary route path */}
                        <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 flex items-center flex-wrap gap-1">
                          <span className="text-slate-400 font-medium">{lang === 'fr' ? 'De :' : 'من :'}</span>
                          <span className="bg-white dark:bg-slate-950 px-1.5 py-0.2 border border-slate-200/50 dark:border-slate-850 rounded text-slate-700 dark:text-slate-300">
                            {mov.source.replace('Dépôt ', '')}
                          </span>
                          <span className="text-indigo-400">➔</span>
                          <span className="text-slate-400 font-medium">{lang === 'fr' ? 'Vers :' : 'إلى :'}</span>
                          <span className="bg-white dark:bg-slate-950 px-1.5 py-0.2 border border-slate-200/50 dark:border-slate-850 rounded text-slate-700 dark:text-slate-300">
                            {mov.destination.replace('Dépôt ', '')}
                          </span>
                        </div>

                        {/* Detail text */}
                        <p className="text-[9.5px] text-slate-400 font-medium italic">
                          {mov.details}
                        </p>

                        {/* Products list with tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mov.items.map((it, idx) => (
                            <span 
                              key={idx} 
                              className="text-[8.5px] px-2 py-0.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-400 rounded-lg font-semibold"
                            >
                              {it.productName} ({it.quantity} ctn)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end gap-1.5 pt-2 md:pt-0 border-t border-slate-150 dark:border-slate-800 md:border-0">
                      <span className="text-[9px] text-slate-400 font-medium md:block hidden">
                        {lang === 'fr' ? 'Volume total' : 'إجمالي الحجم'}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-2 py-1 border border-slate-200/60 dark:border-slate-800 rounded shadow-xs font-mono">
                        {mov.totalQuantity} ctn
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                        mov.status === 'Received' || mov.status === 'Conforme' || mov.status === 'Livré' || mov.status === 'Complété' || mov.status === 'Ajusté'
                          ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-amber-50 dark:bg-amber-950/10 text-amber-600 border border-amber-100 dark:border-amber-900/30'
                      }`}>
                        {mov.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
