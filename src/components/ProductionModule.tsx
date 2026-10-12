/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SystemState, Product, ProductionBatch, DeliveryNote, SupplyRequest, SupplyRequestItem, BonAvoir, BonAvoirItem, BonEncaissement, BonEncaissementItem, BonChange, BonChangeItem } from '../types';
import { translations } from '../translations';
import { generateBarcodeSVG } from '../utils/export';
import { generateBLPdf } from '../utils/blPdfExport';
import { generateSupplyRequestPdf } from '../utils/supplyRequestPdfExport';
import { generateBonAvoirPdf } from '../utils/bonAvoirPdfExport';
import { generateBonEncaissementPdf } from '../utils/bonEncaissementPdfExport';
import { generateBonChangePdf } from '../utils/bonChangePdfExport';
import { 
  Plus, 
  Trash2, 
  IceCream, 
  Clock, 
  Calendar, 
  AlertOctagon, 
  DollarSign, 
  FileText,
  ThermometerSnowflake,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Search,
  Printer,
  ArrowLeft,
  Save,
  MapPin,
  TrendingUp,
  Refrigerator,
  Eye,
  Edit
} from 'lucide-react';

const BL_PRODUCTS_PRESETS = [
  { name: "ALADINO", pcsPerCarton: 75, pricePerCarton: 60.00 },
  { name: "POMMY", pcsPerCarton: 75, pricePerCarton: 60.00 },
  { name: "TRIO", pcsPerCarton: 75, pricePerCarton: 60.00 },
  { name: "MINI GARCIA", pcsPerCarton: 40, pricePerCarton: 64.00 },
  { name: "FRUKTI", pcsPerCarton: 50, pricePerCarton: 80.00 },
  { name: "CITRONNY", pcsPerCarton: 50, pricePerCarton: 100.00 },
  { name: "PASTEK", pcsPerCarton: 35, pricePerCarton: 70.00 },
  { name: "CAPITANO", pcsPerCarton: 36, pricePerCarton: 90.00 },
  { name: "POT FRIO", pcsPerCarton: 24, pricePerCarton: 60.00 },
  { name: "CORNET DELICIO", pcsPerCarton: 40, pricePerCarton: 100.00 },
  { name: "PASTA ZAHI", pcsPerCarton: 36, pricePerCarton: 90.00 },
  { name: "BROCHETTE", pcsPerCarton: 30, pricePerCarton: 75.00 },
  { name: "ICE FRUITY", pcsPerCarton: 32, pricePerCarton: 105.60 },
  { name: "GOLDEN GLOBE", pcsPerCarton: 18, pricePerCarton: 72.00 },
  { name: "OMEGA", pcsPerCarton: 30, pricePerCarton: 125.00 },
  { name: "POUCHY CLASSIQUE", pcsPerCarton: 22, pricePerCarton: 92.40 },
  { name: "POUCHY PREMIUM", pcsPerCarton: 22, pricePerCarton: 92.40 },
  { name: "TWINY CORNET", pcsPerCarton: 18, pricePerCarton: 90.00 },
  { name: "ALDO", pcsPerCarton: 18, pricePerCarton: 90.00 },
  { name: "PRESTIGE CLASSIQUE", pcsPerCarton: 25, pricePerCarton: 150.00 },
  { name: "PRESTIGE AMANDE", pcsPerCarton: 25, pricePerCarton: 200.00 },
  { name: "POT FLEURY", pcsPerCarton: 6, pricePerCarton: 48.00 },
  { name: "COBRA", pcsPerCarton: 20, pricePerCarton: 200.00 },
  { name: "OMEGA PREMIUM", pcsPerCarton: 20, pricePerCarton: 250.00 },
  { name: "COBRA PREMIUM", pcsPerCarton: 20, pricePerCarton: 250.00 },
  { name: "PACK PREMIUM", pcsPerCarton: 20, pricePerCarton: 250.00 },
  { name: "OCEANO", pcsPerCarton: 12, pricePerCarton: 144.00 },
  { name: "PANDA", pcsPerCarton: 6, pricePerCarton: 150.00 },
  { name: "GOURMANDINO", pcsPerCarton: 2, pricePerCarton: 240.00 },
  { name: "LA BUCHE", pcsPerCarton: 1, pricePerCarton: 30.00 },
  { name: "MAGNUM", pcsPerCarton: 20, pricePerCarton: 350.00 },
  { name: "SOLERO", pcsPerCarton: 25, pricePerCarton: 300.00 }
];

const SUPPLY_ITEMS_COL1 = [
  { ref: "Z 01", articleName: "ALADINO FRAISE / PÊCHE" },
  { ref: "Z 03", articleName: "ALADINO ORANGE / BANANE" },
  { ref: "Z 04", articleName: "FRUKTI ORANGE / CITRON" },
  { ref: "Z 05", articleName: "FRUKTI ANANAS / COCO" },
  { ref: "Z 06", articleName: "POMMY VANILLE FRAISE" },
  { ref: "Z 07", articleName: "POMMY VANILLE CHOCOLAT" },
  { ref: "Z 08", articleName: "POMMY VANILLE ORANGE" },
  { ref: "Z 09", articleName: "POMMY VANILLE POMME" },
  { ref: "Z 10", articleName: "TWINNY CORNET FRAISE" },
  { ref: "Z 11", articleName: "TWINNY CORNET CHOCOLAT" },
  { ref: "Z 12", articleName: "PASTEK" },
  { ref: "Z 13", articleName: "MINI GARCIA VANILLE" },
  { ref: "Z 14", articleName: "MINI GARCIA FRAISE" },
  { ref: "Z 15", articleName: "MINI GARCIA CHOCOLAT" },
  { ref: "Z 16", articleName: "MINI GARCIA COCO" },
  { ref: "Z 17", articleName: "POT FRIO CHOCOLAT" },
  { ref: "Z 18", articleName: "POT FRIO FRAISE" },
  { ref: "Z 19", articleName: "POT FRIO CITRON" },
  { ref: "Z 20", articleName: "CAPITANO VANILLE" },
  { ref: "Z 21", articleName: "CAPITANO CHOCOLAT" },
  { ref: "Z 22", articleName: "CAPITANO MANGUE" },
  { ref: "Z 23", articleName: "CAPITANO FRAMBOISE" },
  { ref: "Z 24", articleName: "DELICIO VANILLE" },
  { ref: "Z 25", articleName: "DELICIO FRAISE" },
  { ref: "Z 26", articleName: "DELICIO CHOCOLAT" },
  { ref: "Z 27", articleName: "ICE FRUITY FRAISE" },
  { ref: "Z 28", articleName: "ICE FRUITY CITRON" },
  { ref: "Z 29", articleName: "ICE FRUITY ORANGE" },
  { ref: "Z 30", articleName: "OMEGA YAOURT" },
  { ref: "Z 31", articleName: "OMEGA BISCUIT" },
  { ref: "Z 32", articleName: "OMEGA CHOCOLAT" },
  { ref: "Z 33", articleName: "OMEGA FRAISE" },
  { ref: "Z 34", articleName: "POUCHY CLASSIQUE CHOCO" },
  { ref: "Z 35", articleName: "POUCHY CLASSIQUE FRAISE" },
  { ref: "Z 36", articleName: "GOLDEN GLOBE" },
  { ref: "Z 37", articleName: "BROCHETTE" }
];

const SUPPLY_ITEMS_COL2 = [
  { ref: "Z 38", articleName: "PRESTIGE VANILLE" },
  { ref: "Z 39", articleName: "PRESTIGE VANILLE CHOCO" },
  { ref: "Z 40", articleName: "PRESTIGE VANILLE FRAISE" },
  { ref: "Z 41", articleName: "PRESTIGE VANILLE AMANDE" },
  { ref: "Z 42", articleName: "PRESTIGE CHOCOLAT AMANDE" },
  { ref: "Z 43", articleName: "ALDO CHOCO" },
  { ref: "Z 44", articleName: "ALDO VANILLE" },
  { ref: "Z 45", articleName: "ALDO FRAISE" },
  { ref: "Z 46", articleName: "COBRA VANILLE" },
  { ref: "Z 47", articleName: "COBRA VANILLE FRAISE" },
  { ref: "Z 48", articleName: "COBRA VANILLE CHOCOLAT" },
  { ref: "Z 49", articleName: "OMEGA PREMIUM" },
  { ref: "Z 51", articleName: "COBRA PREMIUM" },
  { ref: "Z 52", articleName: "POUCHY PREMIUM" },
  { ref: "Z 53", articleName: "OCEANO VAN/FRA" },
  { ref: "Z 54", articleName: "OCEANO VAN/CHO" },
  { ref: "Z 55", articleName: "OCEANO NOUG/NOIS" },
  { ref: "Z 56", articleName: "PANDA VAN/CHO" },
  { ref: "Z 57", articleName: "PANDA VAN/FRA" },
  { ref: "Z 58", articleName: "PANDA NOUG/NOIS" },
  { ref: "Z 59", articleName: "POT FLEURY FRAISE" },
  { ref: "Z 60", articleName: "POT FLEURY CHOCOLAT" },
  { ref: "Z 61", articleName: "POT FLEURY YAOURT" },
  { ref: "Z 62", articleName: "POT FLEURY CITRON" },
  { ref: "Z 63", articleName: "PASTA ZAHI" },
  { ref: "Z 64", articleName: "LA BUCHE" },
  { ref: "Z 65", articleName: "MAGNUM DOUBLE CHOCOLAT" },
  { ref: "Z 66", articleName: "MAGNUM AMANDE" },
  { ref: "Z 67", articleName: "MAGNUM CARAMEL" },
  { ref: "Z 68", articleName: "MAGNUM WHITE" },
  { ref: "Z 69", articleName: "MAGNUM FRAISE" },
  { ref: "Z 70", articleName: "SOLERO" },
  { ref: "Z 71", articleName: "GOURMANDINO" }
];

const BON_AVOIR_ITEMS_PRESETS = [
  { qtePcsPreset: 75, productName: "ALADINO", prixCartons: 60.00, prixPieces: 0.80 },
  { qtePcsPreset: 75, productName: "POMMY", prixCartons: 60.00, prixPieces: 0.80 },
  { qtePcsPreset: 18, productName: "TWINY CORNET", prixCartons: 90.00, prixPieces: 5.00 },
  { qtePcsPreset: 35, productName: "PASTEK", prixCartons: 70.00, prixPieces: 2.00 },
  { qtePcsPreset: 40, productName: "MINI GARCIA", prixCartons: 64.00, prixPieces: 1.60 },
  { qtePcsPreset: 36, productName: "CAPITANO", prixCartons: 90.00, prixPieces: 2.50 },
  { qtePcsPreset: 24, productName: "POT FRIO", prixCartons: 60.00, prixPieces: 2.50 },
  { qtePcsPreset: 40, productName: "CORNET DELICIO", prixCartons: 100.00, prixPieces: 2.50 },
  { qtePcsPreset: 32, productName: "ICE FRUITY", prixCartons: 105.60, prixPieces: 3.30 },
  { qtePcsPreset: 36, productName: "PASTA ZAHI", prixCartons: 90.00, prixPieces: 2.50 },
  { qtePcsPreset: 30, productName: "BROCHETTE", prixCartons: 75.00, prixPieces: 2.50 },
  { qtePcsPreset: 22, productName: "POUCHY CLASSIQUE", prixCartons: 92.40, prixPieces: 4.20 },
  { qtePcsPreset: 30, productName: "OMEGA", prixCartons: 125.00, prixPieces: 4.17 },
  { qtePcsPreset: 18, productName: "ALDO", prixCartons: 90.00, prixPieces: 5.00 },
  { qtePcsPreset: 25, productName: "PRESTIGE AMANDE", prixCartons: 200.00, prixPieces: 8.00 },
  { qtePcsPreset: 25, productName: "PRESTIGE CLASSIQUE", prixCartons: 150.00, prixPieces: 6.00 },
  { qtePcsPreset: 6, productName: "POT FLEURY", prixCartons: 48.00, prixPieces: 8.00 },
  { qtePcsPreset: 20, productName: "COBRA", prixCartons: 200.00, prixPieces: 10.00 },
  { qtePcsPreset: 22, productName: "POUCHY PREMIUM", prixCartons: 92.40, prixPieces: 4.20 },
  { qtePcsPreset: 20, productName: "OMEGA PREMIUM", prixCartons: 250.00, prixPieces: 12.50 },
  { qtePcsPreset: 12, productName: "OCEANO", prixCartons: 144.00, prixPieces: 12.00 },
  { qtePcsPreset: 6, productName: "PANDA", prixCartons: 150.00, prixPieces: 25.00 },
  { qtePcsPreset: 2, productName: "GOURMANDINO", prixCartons: 240.00, prixPieces: 120.00 },
  { qtePcsPreset: 20, productName: "MAGNUM", prixCartons: 350.00, prixPieces: 17.50 },
  { qtePcsPreset: 25, productName: "SOLERO", prixCartons: 300.00, prixPieces: 12.00 },
  { qtePcsPreset: 20, productName: "COBRA PREMIUM", prixCartons: 250.00, prixPieces: 12.50 },
  { qtePcsPreset: 1, productName: "LA BUCHE", prixCartons: 30.00, prixPieces: 30.00 }
];

const BON_CHANGE_ITEMS_PRESETS = [
  { qtePcsPreset: 100, productName: "POPEYE", prixCartons: 40.00, prixPieces: 0.40 },
  { qtePcsPreset: 50, productName: "ALADINO", prixCartons: 40.00, prixPieces: 0.80 },
  { qtePcsPreset: 75, productName: "POMMY", prixCartons: 60.00, prixPieces: 0.80 },
  { qtePcsPreset: 35, productName: "TWINY", prixCartons: 56.00, prixPieces: 1.60 },
  { qtePcsPreset: 35, productName: "PASTEK", prixCartons: 70.00, prixPieces: 2.00 },
  { qtePcsPreset: 40, productName: "MINI GARCIA", prixCartons: 64.00, prixPieces: 1.60 },
  { qtePcsPreset: 36, productName: "CAPITANO", prixCartons: 90.00, prixPieces: 2.50 },
  { qtePcsPreset: 24, productName: "POT FRIO", prixCartons: 60.00, prixPieces: 2.50 },
  { qtePcsPreset: 40, productName: "CORNET DELICIO", prixCartons: 100.00, prixPieces: 2.50 },
  { qtePcsPreset: 32, productName: "ICE FRUITY", prixCartons: 105.60, prixPieces: 3.30 },
  { qtePcsPreset: 36, productName: "TWISTY", prixCartons: 90.00, prixPieces: 2.50 },
  { qtePcsPreset: 36, productName: "BROCHETTE", prixCartons: 90.00, prixPieces: 2.50 },
  { qtePcsPreset: 25, productName: "PIRATOS", prixCartons: 100.00, prixPieces: 4.00 },
  { qtePcsPreset: 22, productName: "POUCHY CLASSIQUE", prixCartons: 92.40, prixPieces: 4.20 },
  { qtePcsPreset: 24, productName: "GOLDEN GLOBE", prixCartons: 192.00, prixPieces: 8.00 },
  { qtePcsPreset: 30, productName: "OMEGA", prixCartons: 125.00, prixPieces: 4.17 },
  { qtePcsPreset: 18, productName: "ALDO", prixCartons: 90.00, prixPieces: 5.00 },
  { qtePcsPreset: 25, productName: "PRESTIGE", prixCartons: 200.00, prixPieces: 8.00 },
  { qtePcsPreset: 6, productName: "POT FLEURY", prixCartons: 48.00, prixPieces: 8.00 },
  { qtePcsPreset: 20, productName: "COBRA", prixCartons: 200.00, prixPieces: 10.00 },
  { qtePcsPreset: 18, productName: "POUCHY PREMIUM", prixCartons: 150.00, prixPieces: 8.33 },
  { qtePcsPreset: 20, productName: "PACK PREMIUM", prixCartons: 250.00, prixPieces: 12.50 },
  { qtePcsPreset: 12, productName: "OCEANO", prixCartons: 144.00, prixPieces: 12.00 },
  { qtePcsPreset: 6, productName: "PANDA", prixCartons: 150.00, prixPieces: 25.00 },
  { qtePcsPreset: 2, productName: "GOURMANDINO", prixCartons: 240.00, prixPieces: 120.00 },
  { qtePcsPreset: 20, productName: "MAGNUM", prixCartons: 316.00, prixPieces: 15.80 },
  { qtePcsPreset: 25, productName: "SOLERO", prixCartons: 275.00, prixPieces: 11.00 }
];

interface ProductionModuleProps {
  state: SystemState;
  lang: 'fr' | 'ar';
  onAddBatch: (batch: { productId: string; quantity: number; tempRegistered: number; batchNumber: string; newProduct?: any }) => void;
  onUpdateBatchStatus: (batchId: string, type: 'damaged' | 'expired', qty: number) => void;
  onReportLoss?: (lossData: { location: string; type: 'damaged' | 'expired'; quantity: number; productId: string; batchId?: string }) => Promise<void>;
  currentUser: any;
  initialProductId?: string | null;
  onClearInitialProductId?: () => void;
  onRefreshState?: () => void;
}

export default function ProductionModule({
  state,
  lang,
  onAddBatch,
  onUpdateBatchStatus,
  onReportLoss,
  currentUser,
  initialProductId,
  onClearInitialProductId,
  onRefreshState
}: ProductionModuleProps) {
  const t = translations[lang];

  // Tab switching state
  const [activeTab, setActiveTab] = useState<'production' | 'deliveryNotes' | 'supplyRequests' | 'bonAvoir' | 'bonEncaissement' | 'bonChange'>('production');

  // --- Edit & Preview States ---
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<any>(null);
  const [previewingDocType, setPreviewingDocType] = useState<'bl' | 'sr' | 'ba' | 'be' | 'bc' | null>(null);

  const startEditingBL = (note: any) => {
    setEditingDocId(note.id);
    setClientName(note.clientName);
    setClientCode(note.clientCode || '');
    setBlDate(note.date);
    setCongNumber(note.congNumber || '');
    setCongType(note.congType || 'AP');
    setSourceStockLocation(note.sourceStockLocation || 'Magasin Usine');
    setBlDiscount(note.discount || 0);

    const qtyMap: Record<string, number> = {};
    if (note.items) {
      note.items.forEach((item: any) => {
        qtyMap[item.productName] = item.quantity;
      });
    }
    setBlQuantities(qtyMap);
    setShowNewBLForm(true);
  };

  const startEditingSR = (req: any) => {
    setEditingDocId(req.id);
    setSrDate(req.date);
    setSrRequestNumber(req.requestNumber);
    setSrAgency(req.agency || '');
    setSrChefSecteur(req.chefSecteur || '');
    setSrMagasinier(req.magasinier || '');
    setSrVendeur(req.vendeur || '');
    setSrTotalGlobalDhs(req.totalGlobalDhs?.toString() || '');

    const orderedMap: Record<string, number> = {};
    const deliveredMap: Record<string, number> = {};
    if (req.items) {
      req.items.forEach((item: any) => {
        orderedMap[item.ref] = item.qtyOrdered || 0;
        deliveredMap[item.ref] = item.qtyDelivered || 0;
      });
    }
    setSrOrderedQtys(orderedMap);
    setSrDeliveredQtys(deliveredMap);
    setShowNewSRForm(true);
  };

  const startEditingBA = (ba: any) => {
    setEditingDocId(ba.id);
    setBaNumber(ba.number);
    setBaDate(ba.date);
    setBaClientCodeLeft(ba.clientCodeLeft || '');
    setBaClientCodeRight(ba.clientCodeRight || '');
    setBaCongType(ba.congType || '');
    setBaCongNumber(ba.congNumber || '');

    const cartonMap: Record<string, number> = {};
    const pieceMap: Record<string, number> = {};
    if (ba.items) {
      ba.items.forEach((item: any) => {
        cartonMap[item.productName] = item.cartonsQty || 0;
        pieceMap[item.productName] = item.piecesQty || 0;
      });
    }
    setBaCartonsQtys(cartonMap);
    setBaPiecesQtys(pieceMap);
    setShowNewBAForm(true);
  };

  const startEditingBE = (be: any) => {
    setEditingDocId(be.id);
    setBeNumber(be.number);
    setBeDate(be.date);
    setBeVendeur(be.vendeur || '');
    setBeObservation(be.observation || '');
    setBeVisaCaissier(be.visaCaissier || false);
    setBeVisaVendeur(be.visaVendeur || false);

    if (be.items) {
      setBeItems(be.items.map((item: any) => ({
        date: item.date || '',
        designation: item.designation || '',
        ref: item.ref || '',
        montant: item.montant || 0
      })));
    }
    setShowNewBEForm(true);
  };

  const startEditingBC = (bc: any) => {
    setEditingDocId(bc.id);
    setBcNumber(bc.number);
    setBcDate(bc.date);
    setBcClientCodeLeft(bc.clientCodeLeft || '');
    setBcClientCodeRight(bc.clientCodeRight || '');
    setBcCongType(bc.congType || '');
    setBcCongNumber(bc.congNumber || '');

    if (bc.items) {
      const mappedItems = BON_CHANGE_ITEMS_PRESETS.map(preset => {
        const found = bc.items.find((item: any) => item.productName === preset.productName);
        return {
          productName: preset.productName,
          qtePcsPreset: preset.qtePcsPreset,
          prixCartons: preset.prixCartons,
          prixPieces: preset.prixPieces,
          cartonsQty: found ? found.cartonsQty : 0,
          cartonsMontant: found ? found.cartonsMontant : 0,
          piecesQty: found ? found.piecesQty : 0,
          piecesMontant: found ? found.piecesMontant : 0,
          monGlo: found ? found.monGlo : 0
        };
      });
      setBcItems(mappedItems);
    }
    setShowNewBCForm(true);
  };

  // --- Bon de Change States ---
  const [showNewBCForm, setShowNewBCForm] = useState(false);
  const [bcSearchQuery, setBcSearchQuery] = useState('');
  const [isSavingBC, setIsSavingBC] = useState(false);
  const [bcSuccessMessage, setBcSuccessMessage] = useState('');

  // Form Fields
  const [bcNumber, setBcNumber] = useState('');
  const [bcDate, setBcDate] = useState(new Date().toISOString().split('T')[0]);
  const [bcClientCodeLeft, setBcClientCodeLeft] = useState('');
  const [bcClientCodeRight, setBcClientCodeRight] = useState('');
  const [bcCongType, setBcCongType] = useState<'AP' | 'AG' | 'AS' | ''>('');
  const [bcCongNumber, setBcCongNumber] = useState('');

  const getInitialBcItems = (): BonChangeItem[] => {
    return BON_CHANGE_ITEMS_PRESETS.map(preset => ({
      productName: preset.productName,
      qtePcsPreset: preset.qtePcsPreset,
      prixCartons: preset.prixCartons,
      prixPieces: preset.prixPieces,
      cartonsQty: 0,
      cartonsMontant: 0,
      piecesQty: 0,
      piecesMontant: 0,
      monGlo: 0
    }));
  };

  const [bcItems, setBcItems] = useState<BonChangeItem[]>(getInitialBcItems());

  const handleGenerateBcNumber = () => {
    const randomNum = `C${String(Math.floor(100000 + Math.random() * 900000))}`;
    setBcNumber(randomNum);
  };

  useEffect(() => {
    if (showNewBCForm && !bcNumber) {
      handleGenerateBcNumber();
    }
  }, [showNewBCForm]);

  const handleBcQtyChange = (index: number, field: 'cartonsQty' | 'piecesQty', value: string) => {
    const numValue = Number(value) || 0;
    const updated = [...bcItems];
    const item = updated[index];
    
    if (field === 'cartonsQty') {
      item.cartonsQty = numValue;
      item.cartonsMontant = numValue * item.prixCartons;
    } else if (field === 'piecesQty') {
      item.piecesQty = numValue;
      item.piecesMontant = numValue * item.prixPieces;
    }
    
    item.monGlo = item.cartonsMontant + item.piecesMontant;
    setBcItems(updated);
  };

  const calculateBcTotalGlobal = () => {
    return bcItems.reduce((sum, item) => sum + (item.monGlo || 0), 0);
  };

  const handleBCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBC(true);
    setBcSuccessMessage('');

    const totalGlobal = calculateBcTotalGlobal();
    const isEditing = !!editingDocId;
    const url = isEditing ? `/api/bon-changes/${editingDocId}` : '/api/bon-changes';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: bcNumber,
          date: bcDate,
          clientCodeLeft: bcClientCodeLeft,
          clientCodeRight: bcClientCodeRight,
          congType: bcCongType,
          congNumber: bcCongNumber,
          items: bcItems,
          montantChangeDirhams: totalGlobal,
          user: currentUser
        })
      });

      const data = await response.json();
      if (data.success) {
        setBcSuccessMessage(isEditing
          ? (lang === 'fr' ? 'Bon de change mis à jour avec succès !' : 'تم تحديث بون التغيير بنجاح!')
          : (lang === 'fr' ? 'Bon de change enregistré avec succès !' : 'تم حفظ بون التغيير (Bon de Change) بنجاح!')
        );
        
        if (onRefreshState) {
          onRefreshState();
        }

        // Trigger PDF generation
        generateBonChangePdf(data.bonChange || data.data, lang);

        setTimeout(() => {
          setBcSuccessMessage('');
          setShowNewBCForm(false);
          setBcItems(getInitialBcItems());
          setBcClientCodeLeft('');
          setBcClientCodeRight('');
          setBcCongType('');
          setBcCongNumber('');
          setBcNumber('');
          setEditingDocId(null);
        }, 2000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    } finally {
      setIsSavingBC(false);
    }
  };

  // --- Bon d'Encaissement (Cash Receipt) States ---
  const [showNewBEForm, setShowNewBEForm] = useState(false);
  const [beSearchQuery, setBeSearchQuery] = useState('');
  const [isSavingBE, setIsSavingBE] = useState(false);
  const [beSuccessMessage, setBeSuccessMessage] = useState('');

  // Form Fields
  const [beNumber, setBeNumber] = useState('');
  const [beVendeur, setBeVendeur] = useState('');
  const [beDate, setBeDate] = useState(new Date().toISOString().split('T')[0]);
  const [beObservation, setBeObservation] = useState('');
  const [beVisaCaissier, setBeVisaCaissier] = useState(false);
  const [beVisaVendeur, setBeVisaVendeur] = useState(false);
  
  const [beItems, setBeItems] = useState<BonEncaissementItem[]>([
    { date: '', designation: '', ref: '', montant: 0 }
  ]);

  const handleGenerateBENumber = () => {
    const randomNum = String(Math.floor(100000000 + Math.random() * 900000000));
    setBeNumber(randomNum);
  };

  useEffect(() => {
    if (showNewBEForm && !beNumber) {
      handleGenerateBENumber();
    }
  }, [showNewBEForm]);

  const handleAddBeRow = () => {
    if (beItems.length >= 12) {
      alert(lang === 'fr' ? 'Maximum 12 lignes autorisées.' : 'الحد الأقصى هو 12 سطراً.');
      return;
    }
    setBeItems([...beItems, { date: '', designation: '', ref: '', montant: 0 }]);
  };

  const handleRemoveBeRow = (index: number) => {
    if (beItems.length === 1) return;
    setBeItems(beItems.filter((_, i) => i !== index));
  };

  const handleBeItemChange = (index: number, field: keyof BonEncaissementItem, value: any) => {
    const updated = [...beItems];
    if (field === 'montant') {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setBeItems(updated);
  };

  const calculateBeTotal = () => {
    return beItems.reduce((sum, item) => sum + (item.montant || 0), 0);
  };

  const handleBESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBE(true);
    setBeSuccessMessage('');

    const totalGlobal = calculateBeTotal();
    const isEditing = !!editingDocId;
    const url = isEditing ? `/api/bon-encaissements/${editingDocId}` : '/api/bon-encaissements';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: beNumber,
          vendeur: beVendeur,
          date: beDate,
          items: beItems,
          totalRecu: totalGlobal,
          observation: beObservation,
          visaCaissier: beVisaCaissier,
          visaVendeur: beVisaVendeur,
          user: currentUser
        })
      });

      const data = await response.json();
      if (data.success) {
        setBeSuccessMessage(isEditing
          ? (lang === 'fr' ? 'Bon d\'encaissement mis à jour avec succès !' : 'تم تحديث بون الإيداع بنجاح!')
          : (lang === 'fr' ? 'Bon d\'encaissement enregistré avec succès !' : 'تم حفظ بون الإيداع (Bon d\'Encaissement) بنجاح!')
        );
        
        if (onRefreshState) {
          onRefreshState();
        }

        // Trigger PDF generation
        generateBonEncaissementPdf(data.bonEncaissement || data.data, lang);

        setTimeout(() => {
          setBeSuccessMessage('');
          setShowNewBEForm(false);
          setBeItems([{ date: '', designation: '', ref: '', montant: 0 }]);
          setBeVendeur('');
          setBeObservation('');
          setBeVisaCaissier(false);
          setBeVisaVendeur(false);
          setBeNumber('');
          setEditingDocId(null);
        }, 2000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    } finally {
      setIsSavingBE(false);
    }
  };

  // Form states (Production)
  const [selectedProductId, setSelectedProductId] = useState(state.products[0]?.id || '');
  const [isNewProduct, setIsNewProduct] = useState(false);

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
      setIsNewProduct(false);
      if (onClearInitialProductId) {
        onClearInitialProductId();
      }
    }
  }, [initialProductId, onClearInitialProductId]);

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('GAMME CLASSIQUE');
  const [newUnitCost, setNewUnitCost] = useState(1.8);
  const [newUnitSell, setNewUnitSell] = useState(3.5);
  const [newExpiryDays, setNewExpiryDays] = useState(365);
  const [newTempRequired, setNewTempRequired] = useState(-18);

  const [quantity, setQuantity] = useState(250);
  const [temp, setTemp] = useState(-19);
  const [batchNum, setBatchNum] = useState(`LOT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
  const [isSuccess, setIsSuccess] = useState(false);

  // Damaged reporting state
  const [reportBatchId, setReportBatchId] = useState('');
  const [reportQty, setReportQty] = useState(5);
  const [reportType, setReportType] = useState<'damaged' | 'expired'>('damaged');

  // New generalized loss states
  const [lossLocation, setLossLocation] = useState('Magasin Usine');
  const [lossMethod, setLossMethod] = useState<'batch' | 'product'>('batch');
  const [lossProductId, setLossProductId] = useState(state.products[0]?.id || '');
  const [isReportingLoss, setIsReportingLoss] = useState(false);

  // --- Bon de Livraison (BL) States ---
  const [showNewBLForm, setShowNewBLForm] = useState(false);
  const [blSearchQuery, setBlSearchQuery] = useState('');
  const [presetSearch, setPresetSearch] = useState('');
  const [isSavingBL, setIsSavingBL] = useState(false);
  const [blSuccessMessage, setBlSuccessMessage] = useState('');

  // BL Form fields
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [blDate, setBlDate] = useState(new Date().toISOString().split('T')[0]);
  const [congNumber, setCongNumber] = useState('');
  const [congType, setCongType] = useState<'AP' | 'AG' | 'AS'>('AP');
  const [sourceStockLocation, setSourceStockLocation] = useState('Magasin Usine');
  const [blQuantities, setBlQuantities] = useState<Record<string, number>>({});
  const [blDiscount, setBlDiscount] = useState(0);

  // --- Demande d'Approvisionnement (Supply Request) States ---
  const [showNewSRForm, setShowNewSRForm] = useState(false);
  const [srSearchQuery, setSrSearchQuery] = useState('');
  const [isSavingSR, setIsSavingSR] = useState(false);
  const [srSuccessMessage, setSrSuccessMessage] = useState('');

  // Form fields
  const [srRequestNumber, setSrRequestNumber] = useState('');
  const [srDate, setSrDate] = useState(new Date().toISOString().split('T')[0]);
  const [srAgency, setSrAgency] = useState('');
  const [srChefSecteur, setSrChefSecteur] = useState('');
  const [srMagasinier, setSrMagasinier] = useState('');
  const [srVendeur, setSrVendeur] = useState('');
  const [srOrderedQtys, setSrOrderedQtys] = useState<Record<string, number>>({});
  const [srDeliveredQtys, setSrDeliveredQtys] = useState<Record<string, number>>({});
  const [srTotalGlobalDhs, setSrTotalGlobalDhs] = useState('');

  // Auto generate demand number
  const handleGenerateSRNumber = () => {
    const randomNum = String(Math.floor(100000 + Math.random() * 900000));
    setSrRequestNumber(randomNum);
  };

  useEffect(() => {
    if (showNewSRForm && !srRequestNumber) {
      handleGenerateSRNumber();
    }
  }, [showNewSRForm]);

  const handleSRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSR(true);
    setSrSuccessMessage('');

    // Process items (all Col1 and Col2 items)
    const processedItems: SupplyRequestItem[] = [];
    const allItems = [...SUPPLY_ITEMS_COL1, ...SUPPLY_ITEMS_COL2];

    allItems.forEach(item => {
      const qCd = srOrderedQtys[item.ref] || 0;
      const qLiv = srDeliveredQtys[item.ref] || 0;
      processedItems.push({
        ref: item.ref,
        articleName: item.articleName,
        qtyOrdered: Number(qCd),
        qtyDelivered: Number(qLiv)
      });
    });

    const isEditing = !!editingDocId;
    const url = isEditing ? `/api/supply-requests/${editingDocId}` : '/api/supply-requests';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: srDate,
          requestNumber: srRequestNumber,
          agency: srAgency,
          chefSecteur: srChefSecteur,
          magasinier: srMagasinier,
          vendeur: srVendeur,
          items: processedItems,
          totalGlobalDhs: Number(srTotalGlobalDhs || 0),
          user: currentUser
        })
      });

      const data = await response.json();
      if (data.success) {
        setSrSuccessMessage(isEditing
          ? (lang === 'fr' ? 'Demande d\'approvisionnement mise à jour avec succès !' : 'تم تحديث طلب التزويد بنجاح!')
          : (lang === 'fr' ? 'Demande d\'approvisionnement enregistrée avec succès !' : 'تم حفظ طلب التزويد بنجاح!')
        );
        
        if (onRefreshState) {
          onRefreshState();
        }

        // Trigger PDF generation
        generateSupplyRequestPdf(data.request || data.data, lang);

        setTimeout(() => {
          setSrSuccessMessage('');
          setShowNewSRForm(false);
          setSrOrderedQtys({});
          setSrDeliveredQtys({});
          setSrAgency('');
          setSrChefSecteur('');
          setSrMagasinier('');
          setSrVendeur('');
          setSrTotalGlobalDhs('');
          setSrRequestNumber('');
          setEditingDocId(null);
        }, 2000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    } finally {
      setIsSavingSR(false);
    }
  };

  // --- Bon Avoir (Credit Note) States ---
  const [showNewBAForm, setShowNewBAForm] = useState(false);
  const [baSearchQuery, setBaSearchQuery] = useState('');
  const [isSavingBA, setIsSavingBA] = useState(false);
  const [baSuccessMessage, setBaSuccessMessage] = useState('');

  // Form Fields
  const [baNumber, setBaNumber] = useState('');
  const [baDate, setBaDate] = useState(new Date().toISOString().split('T')[0]);
  const [baClientCodeLeft, setBaClientCodeLeft] = useState('');
  const [baClientCodeRight, setBaClientCodeRight] = useState('');
  const [baCongType, setBaCongType] = useState<'AP' | 'AG' | 'A' | ''>('');
  const [baCongNumber, setBaCongNumber] = useState('');
  const [baCartonsQtys, setBaCartonsQtys] = useState<Record<string, number>>({});
  const [baPiecesQtys, setBaPiecesQtys] = useState<Record<string, number>>({});

  const handleGenerateBANumber = () => {
    const randomNum = String(Math.floor(100000000 + Math.random() * 900000000));
    setBaNumber(randomNum);
  };

  useEffect(() => {
    if (showNewBAForm && !baNumber) {
      handleGenerateBANumber();
    }
  }, [showNewBAForm]);

  const calculateBaTotal = () => {
    let total = 0;
    BON_AVOIR_ITEMS_PRESETS.forEach(item => {
      const cartonQty = baCartonsQtys[item.productName] || 0;
      const pieceQty = baPiecesQtys[item.productName] || 0;
      const cartonsMontant = cartonQty * item.prixCartons;
      const piecesMontant = pieceQty * item.prixPieces;
      total += (cartonsMontant + piecesMontant);
    });
    return total;
  };

  const handleBASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBA(true);
    setBaSuccessMessage('');

    const processedItems: BonAvoirItem[] = BON_AVOIR_ITEMS_PRESETS.map(item => {
      const cartonsQty = baCartonsQtys[item.productName] || 0;
      const piecesQty = baPiecesQtys[item.productName] || 0;
      const cartonsMontant = cartonsQty * item.prixCartons;
      const piecesMontant = piecesQty * item.prixPieces;
      const monGlo = cartonsMontant + piecesMontant;

      return {
        productName: item.productName,
        qtePcsPreset: item.qtePcsPreset,
        cartonsQty,
        prixCartons: item.prixCartons,
        cartonsMontant,
        piecesQty,
        prixPieces: item.prixPieces,
        piecesMontant,
        monGlo
      };
    });

    const totalGlobal = calculateBaTotal();
    const isEditing = !!editingDocId;
    const url = isEditing ? `/api/bon-avoirs/${editingDocId}` : '/api/bon-avoirs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: baNumber,
          BaDate: baDate,
          date: baDate,
          clientCodeLeft: baClientCodeLeft,
          clientCodeRight: baClientCodeRight,
          congType: baCongType,
          congNumber: baCongNumber,
          items: processedItems,
          montantAvoirDirhams: totalGlobal,
          user: currentUser
        })
      });

      const data = await response.json();
      if (data.success) {
        setBaSuccessMessage(isEditing
          ? (lang === 'fr' ? 'Bon d\'avoir mis à jour avec succès !' : 'تم تحديث بون الإرجاع بنجاح!')
          : (lang === 'fr' ? 'Bon d\'avoir enregistré avec succès !' : 'تم حفظ بون الإرجاع (Bon Avoir) بنجاح!')
        );
        
        if (onRefreshState) {
          onRefreshState();
        }

        // Trigger PDF generation
        generateBonAvoirPdf(data.bonAvoir || data.data, lang);

        setTimeout(() => {
          setBaSuccessMessage('');
          setShowNewBAForm(false);
          setBaCartonsQtys({});
          setBaPiecesQtys({});
          setBaClientCodeLeft('');
          setBaClientCodeRight('');
          setBaCongType('');
          setBaCongNumber('');
          setBaNumber('');
          setEditingDocId(null);
        }, 2000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    } finally {
      setIsSavingBA(false);
    }
  };

  const handleGenerateBatchNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setBatchNum(`LOT-${new Date().getFullYear()}-${random}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewProduct && !newProductName.trim()) {
      alert(lang === 'fr' ? 'Veuillez saisir le nom du nouveau produit' : 'يرجى كتابة اسم المنتج الجديد');
      return;
    }
    if (!isNewProduct && !selectedProductId) return;
    if (quantity <= 0) return;

    onAddBatch({
      productId: isNewProduct ? 'new' : selectedProductId,
      quantity: Number(quantity),
      tempRegistered: Number(temp),
      batchNumber: batchNum,
      newProduct: isNewProduct ? {
        name: newProductName,
        category: newProductCategory,
        unitPriceCost: Number(newUnitCost),
        unitPriceSell: Number(newUnitSell),
        expiryDays: Number(newExpiryDays),
        tempRequired: Number(newTempRequired)
      } : undefined
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      handleGenerateBatchNumber();
      if (isNewProduct) {
        setNewProductName('');
        setIsNewProduct(false);
      }
    }, 3500);
  };

  const handleReportLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetProductId = '';
    let targetBatchId: string | undefined = undefined;

    if (lossLocation === 'Magasin Usine' && lossMethod === 'batch') {
      if (!reportBatchId) {
        alert(lang === 'fr' ? 'Veuillez sélectionner un lot' : 'يرجى اختيار الدفعة');
        return;
      }
      const batch = state.batches.find(b => b.id === reportBatchId);
      if (!batch) return;
      targetProductId = batch.productId;
      targetBatchId = reportBatchId;
    } else {
      if (!lossProductId) {
        alert(lang === 'fr' ? 'Veuillez sélectionner un produit' : 'يرجى اختيار المنتج');
        return;
      }
      targetProductId = lossProductId;
    }

    if (reportQty <= 0) {
      alert(lang === 'fr' ? 'Veuillez saisir une quantité valide' : 'يرجى إدخال كمية صالحة');
      return;
    }

    if (onReportLoss) {
      setIsReportingLoss(true);
      try {
        await onReportLoss({
          location: lossLocation,
          type: reportType,
          quantity: Number(reportQty),
          productId: targetProductId,
          batchId: targetBatchId
        });
        alert(lang === 'fr' ? 'Pertes enregistrées !' : 'تم تسجيل الهدر بنجاح !');
        setReportBatchId('');
        setReportQty(5);
      } catch (error) {
        console.error("Error reporting loss:", error);
      } finally {
        setIsReportingLoss(false);
      }
    } else {
      // Fallback
      if (targetBatchId) {
        onUpdateBatchStatus(targetBatchId, reportType, Number(reportQty));
        alert(lang === 'fr' ? 'Pertes enregistrées !' : 'تم تسجيل الهدر بنجاح !');
        setReportBatchId('');
        setReportQty(5);
      }
    }
  };

  // --- Bon de Livraison (BL) Form Submission ---
  const handleBLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert(lang === 'fr' ? 'Le nom du client est obligatoire.' : 'اسم الزبون مطلوب.');
      return;
    }

    // Build items array of non-zero quantities
    const blItems = BL_PRODUCTS_PRESETS.map(preset => {
      const qty = blQuantities[preset.name] || 0;
      return {
        productName: preset.name,
        pcsPerCarton: preset.pcsPerCarton,
        quantity: qty,
        pricePerCarton: preset.pricePerCarton
      };
    }).filter(it => it.quantity > 0);

    if (blItems.length === 0) {
      alert(lang === 'fr' ? 'Veuillez saisir une quantité pour au moins un produit.' : 'يرجى ملء كمية منتج واحد على الأقل.');
      return;
    }

    setIsSavingBL(true);
    const isEditing = !!editingDocId;
    const url = isEditing ? `/api/delivery-notes/${editingDocId}` : '/api/delivery-notes';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientCode: clientCode || `CL-${Math.floor(100 + Math.random() * 900)}`,
          date: blDate,
          congNumber: congNumber || `CG-${Math.floor(10 + Math.random() * 90)}`,
          congType,
          sourceStockLocation,
          items: blItems,
          discount: Number(blDiscount || 0),
          user: currentUser
        })
      });

      const data = await res.json();
      if (data.success) {
        // Trigger auto PDF download
        if (data.note || data.data) {
          generateBLPdf(data.note || data.data, lang);
        }

        setBlSuccessMessage(isEditing
          ? (lang === 'fr' ? `Bon de livraison mis à jour avec succès et stock réconcilié !` : `تم تحديث بون التسليم بنجاح وإعادة تسوية المخزن!`)
          : (lang === 'fr' ? `Bon de livraison enregistré avec succès et stock déduit (${sourceStockLocation}) !` : `تم تسجيل بون التسليم بنجاح وتم خصمه من مخزن: ${sourceStockLocation}`)
        );
        
        // Reset form
        setClientName('');
        setClientCode('');
        setCongNumber('');
        setBlQuantities({});
        setBlDiscount(0);

        if (onRefreshState) {
          onRefreshState();
        }

        setTimeout(() => {
          setBlSuccessMessage('');
          setShowNewBLForm(false);
          setEditingDocId(null);
        }, 3500);
      } else {
        alert(data.error || "Une erreur s'est produite lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setIsSavingBL(false);
    }
  };

  // Factory Stock Valorization Calculations
  const factoryStockPositions = state.stockPositions.filter(sp => sp.location === 'Magasin Usine');
  
  const totalCostValuation = factoryStockPositions.reduce((sum, sp) => {
    const prod = state.products.find(p => p.id === sp.productId);
    return sum + (sp.quantity * (prod?.unitPriceCost || 0) * 10); // 10 units per carton
  }, 0);

  const totalSellValuation = factoryStockPositions.reduce((sum, sp) => {
    const prod = state.products.find(p => p.id === sp.productId);
    return sum + (sp.quantity * (prod?.unitPriceSell || 0) * 10);
  }, 0);

  const potentialProfit = totalSellValuation - totalCostValuation;

  // Calculate local totals for active BL form
  const blTotalBrut = BL_PRODUCTS_PRESETS.reduce((sum, preset) => {
    return sum + (blQuantities[preset.name] || 0) * preset.pricePerCarton;
  }, 0);
  const blNetPayable = Math.max(0, blTotalBrut - blDiscount);

  // Filter BL history list
  const blHistory = state.deliveryNotes || [];
  const filteredBLHistory = blHistory.filter(note => {
    const matchQuery = blSearchQuery.toLowerCase();
    return (
      note.noteNumber.toLowerCase().includes(matchQuery) ||
      note.clientName.toLowerCase().includes(matchQuery) ||
      note.clientCode.toLowerCase().includes(matchQuery) ||
      note.sourceStockLocation.toLowerCase().includes(matchQuery)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Tab Selector - Horizontal Scrollbar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-4 overflow-x-auto whitespace-nowrap scrollbar-thin pb-2">
        <button
          onClick={() => { setActiveTab('production'); setShowNewBLForm(false); setShowNewSRForm(false); setShowNewBAForm(false); setShowNewBEForm(false); setShowNewBCForm(false); }}
          className={`pb-2.5 text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'production'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <IceCream className="h-4.5 w-4.5 text-blue-500" />
          {lang === 'fr' ? 'Production & Pertes' : 'إنتاج الوجبات وتسجيل الهدر'}
        </button>

        <button
          onClick={() => { setActiveTab('deliveryNotes'); setShowNewSRForm(false); setShowNewBAForm(false); setShowNewBEForm(false); setShowNewBCForm(false); }}
          className={`pb-2.5 text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'deliveryNotes'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="h-4.5 w-4.5 text-indigo-500" />
          {lang === 'fr' ? 'Bons de Livraison (BL)' : 'بون التسليم والتوزيع (Bon de Livraison)'}
        </button>

        <button
          onClick={() => { setActiveTab('supplyRequests'); setShowNewBLForm(false); setShowNewBAForm(false); setShowNewBEForm(false); setShowNewBCForm(false); }}
          className={`pb-2.5 text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'supplyRequests'
              ? 'border-b-2 border-amber-600 text-amber-600 dark:text-amber-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="h-4.5 w-4.5 text-amber-500" />
          {lang === 'fr' ? 'Demande d\'approvisionnement' : 'طلب التزويد بالمنتجات النهائية'}
        </button>

        <button
          onClick={() => { setActiveTab('bonAvoir'); setShowNewBLForm(false); setShowNewSRForm(false); setShowNewBEForm(false); setShowNewBCForm(false); }}
          className={`pb-2.5 text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'bonAvoir'
              ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="h-4.5 w-4.5 text-emerald-500" />
          {lang === 'fr' ? 'Bons de Retour (Avoir)' : 'بونات الإرجاع (Bon Avoir)'}
        </button>

        <button
          onClick={() => { setActiveTab('bonEncaissement'); setShowNewBLForm(false); setShowNewSRForm(false); setShowNewBAForm(false); setShowNewBCForm(false); }}
          className={`pb-2.5 text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'bonEncaissement'
              ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="h-4.5 w-4.5 text-violet-500" />
          {lang === 'fr' ? 'Bons d\'Encaissement' : 'بونات الإيداع (Bon d\'Encaissement)'}
        </button>

        <button
          onClick={() => { setActiveTab('bonChange'); setShowNewBLForm(false); setShowNewSRForm(false); setShowNewBAForm(false); setShowNewBEForm(false); }}
          className={`pb-2.5 text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'bonChange'
              ? 'border-b-2 border-cyan-600 text-cyan-600 dark:text-cyan-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="h-4.5 w-4.5 text-cyan-500" />
          {lang === 'fr' ? 'Bons de Change' : 'بونات التغيير (Bon Change)'}
        </button>
      </div>

      <div className="space-y-6">

      {activeTab === 'production' && (
        <>
          {/* 1. Production Form & Valorization Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Production creation form */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-500" />
                {t.createBatch}
              </h3>

              {isSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs flex items-center gap-2 font-bold animate-bounce">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{t.successBatch}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Toggle selection */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-xs">
                  <button
                    type="button"
                    onClick={() => setIsNewProduct(false)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      !isNewProduct
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {lang === 'fr' ? 'Existant' : 'منتج حالي'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewProduct(true)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      isNewProduct
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {lang === 'fr' ? 'Nouveau' : 'منتج جديد'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {!isNewProduct ? (
                    <div>
                      <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{t.product}</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                      >
                        {state.products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                        ))}
                      </select>
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => setIsNewProduct(true)}
                          className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>+ {lang === 'fr' ? 'Créer un produit qui n\'existe pas' : 'إضافة أو إنشاء منتج جديد غير موجود'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 md:col-span-2 bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-xl border border-dashed border-blue-200 dark:border-blue-900/30">
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400">
                        {lang === 'fr' ? 'Création d\'un Nouveau Produit' : 'إدخال تفاصيل منتج جديد بالكامل'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {lang === 'fr' ? 'Nom du Produit' : 'اسم المنتج الجديد'}
                          </label>
                          <input
                            type="text"
                            required
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            placeholder="Zahi Cornet Chocolat Noisette"
                            className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {lang === 'fr' ? 'Gamme' : 'التشكيلة (Gamme)'}
                          </label>
                          <select
                            value={newProductCategory}
                            onChange={(e) => setNewProductCategory(e.target.value)}
                            className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          >
                            <option value="GAMME CLASSIQUE">GAMME CLASSIQUE</option>
                            <option value="GAMME PREMIUM">GAMME PREMIUM</option>
                            <option value="GAMME GOURMET">GAMME GOURMET</option>
                            <option value="GAMME MAGICIEN">GAMME MAGICIEN</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {lang === 'fr' ? 'Coût unitaire (achat) DH' : 'تكلفة الشراء الأساسية للحبة'}
                          </label>
                          <input
                            type="number"
                            step={0.1}
                            value={newUnitCost}
                            onChange={(e) => setNewUnitCost(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {lang === 'fr' ? 'Prix de Vente DH' : 'سعر بيع الحبة'}
                          </label>
                          <input
                            type="number"
                            step={0.1}
                            value={newUnitSell}
                            onChange={(e) => setNewUnitSell(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {lang === 'fr' ? 'Durée de Validité (Jours)' : 'صلاحية المنتج (بالأيام)'}
                          </label>
                          <input
                            type="number"
                            value={newExpiryDays}
                            onChange={(e) => setNewExpiryDays(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {lang === 'fr' ? 'Température Requise (°C)' : 'الحرارة الموصى بها'}
                          </label>
                          <input
                            type="number"
                            value={newTempRequired}
                            onChange={(e) => setNewTempRequired(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{t.batchNumber}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={batchNum}
                        onChange={(e) => setBatchNum(e.target.value)}
                        required
                        className="flex-1 text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-mono focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateBatchNumber}
                        className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Gen
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{t.qtyCartons}</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      required
                      min={1}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      <span className="flex items-center gap-1">
                        <ThermometerSnowflake className="h-3.5 w-3.5 text-blue-500" />
                        {t.registeredTemp}
                      </span>
                    </label>
                    <input
                      type="number"
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      required
                      max={-15}
                      min={-30}
                      step={0.5}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {lang === 'fr' ? 'Enregistrer le Lot & Ajouter au Stock' : 'تسجيل اللوت وتحديث مخزن المصنع'}
                </button>
              </form>
            </div>

            {/* Stock financial valuation */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-850 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  {t.valorizationSummary}
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{lang === 'fr' ? 'Valeur au Prix de Revient (Coût)' : 'القيمة بسعر التكلفة'}</p>
                    <h4 className="text-xl font-black font-mono text-slate-200">{totalCostValuation.toLocaleString()} DH</h4>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{lang === 'fr' ? 'Valeur Potentielle de Vente (Revenu)' : 'القيمة بسعر البيع (الإيراد المتوقع)'}</p>
                    <h4 className="text-xl font-black font-mono text-emerald-400">{totalSellValuation.toLocaleString()} DH</h4>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{lang === 'fr' ? 'Marge Brute Potentielle Usine' : 'هامش الربح الإجمالي المتوقع'}</p>
                    <h4 className="text-2xl font-black font-mono text-blue-400">+{potentialProfit.toLocaleString()} DH</h4>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-slate-850 rounded-xl flex items-center gap-2 text-[10px] text-slate-400">
                <Percent className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{lang === 'fr' ? 'Estimation basée sur la quantité globale stockée à l\'usine.' : 'تقديرات قائمة على الكميات الموجودة في المصنع حالياً.'}</span>
              </div>
            </div>

          </div>

          {/* 2. Batch reporting losses & Existing batches lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Batch lists */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                {t.batchList}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 font-bold">{t.batchNumber}</th>
                      <th className="px-4 py-3 font-bold">{t.product}</th>
                      <th className="px-4 py-3 text-center font-bold">{t.quantity}</th>
                      <th className="px-4 py-3 text-center font-bold">{t.temp}</th>
                      <th className="px-4 py-3 font-bold">{t.expiryDate}</th>
                      <th className="px-4 py-3 text-center font-bold">FEFO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {state.batches.map(b => {
                      const isExpired = new Date(b.expirationDate).getTime() < Date.now();
                      const isDamaged = b.quantityDamaged > 0;
                      
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{b.batchNumber}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-300">{b.productName}</p>
                            {isDamaged && <span className="text-[9px] text-red-500 bg-red-50 dark:bg-red-950/20 px-1 py-0.2 rounded font-medium">-{b.quantityDamaged} ctn cassés</span>}
                          </td>
                          <td className="px-4 py-3 text-center font-bold font-mono">{b.quantity} ctn</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-blue-500">{b.tempRegistered}°C</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{b.expirationDate}</td>
                          <td className="px-4 py-3 text-center">
                            {isExpired ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-[10px] rounded-full font-bold">EXPIRÉ</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] rounded-full font-bold">ACTIF</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report damaged form */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-500 animate-pulse" />
                {lang === 'fr' ? 'Déclarer Pertes / Écarts' : 'تسجيل هدر وتلف بالدفعات والمستودعات'}
              </h3>

              <form onSubmit={handleReportLoss} className="space-y-4">
                
                {/* 1. Location Selection */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Emplacement / Localisation' : 'موقع المخزن'}
                  </label>
                  <select
                    value={lossLocation}
                    onChange={(e) => {
                      const loc = e.target.value;
                      setLossLocation(loc);
                      if (loc !== 'Magasin Usine') {
                        setLossMethod('product');
                      }
                    }}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                  >
                    <option value="Magasin Usine">{lang === 'fr' ? 'Magasin Usine' : 'مستودع المصنع'}</option>
                    {state.depots && Object.keys(state.depots).map(depotName => (
                      <option key={depotName} value={depotName}>
                        {lang === 'fr' ? `Dépôt ${depotName}` : `مستودع ${depotName}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Declaration Method (only for Magasin Usine) */}
                {lossLocation === 'Magasin Usine' && (
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Méthode de déclaration' : 'طريقة التحديد'}
                    </label>
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setLossMethod('batch')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          lossMethod === 'batch'
                            ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {lang === 'fr' ? 'Par Lot' : 'حسب الدفعة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLossMethod('product')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          lossMethod === 'product'
                            ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {lang === 'fr' ? 'Par Produit' : 'حسب المنتج'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Batch or Product Dropdown */}
                {lossLocation === 'Magasin Usine' && lossMethod === 'batch' ? (
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      {t.batchNumber}
                    </label>
                    <select
                      value={reportBatchId}
                      onChange={(e) => setReportBatchId(e.target.value)}
                      required
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                    >
                      <option value="">-- {lang === 'fr' ? 'Sélectionner le lot' : 'اختر الدفعة'} --</option>
                      {state.batches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} - {b.productName.substring(0, 18)}... ({b.quantity} ctn)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      {lang === 'fr' ? 'Sélectionner le Produit' : 'اختر المنتج'}
                    </label>
                    <select
                      value={lossProductId}
                      onChange={(e) => setLossProductId(e.target.value)}
                      required
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                    >
                      <option value="">-- {lang === 'fr' ? 'Sélectionner le produit' : 'اختر المنتج'} --</option>
                      {state.products.map(p => {
                        let stockQty = 0;
                        if (lossLocation === 'Magasin Usine') {
                          stockQty = state.stockPositions.find(sp => sp.productId === p.id && sp.location === 'Magasin Usine')?.quantity || 0;
                        } else {
                          stockQty = state.depots[lossLocation]?.stock.find(s => s.productId === p.id)?.quantity || 0;
                        }
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({lang === 'fr' ? `Stock: ${stockQty} ctn` : `المخزون: ${stockQty} كرتونة`})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* 4. Type of loss */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    {lang === 'fr' ? 'Type d\'écart' : 'نوع الخسارة / الضياع'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="loss_type"
                        checked={reportType === 'damaged'}
                        onChange={() => setReportType('damaged')}
                        className="accent-rose-500"
                      />
                      <span>{lang === 'fr' ? 'Endommagé' : 'تالف / مكسور'}</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="loss_type"
                        checked={reportType === 'expired'}
                        onChange={() => setReportType('expired')}
                        className="accent-rose-500"
                      />
                      <span>{lang === 'fr' ? 'Expiré' : 'منتهي الصلاحية'}</span>
                    </label>
                  </div>
                </div>

                {/* 5. Quantity */}
                <div>
                  <label className="block text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    {t.quantity} (Cartons)
                  </label>
                  <input
                    type="number"
                    value={reportQty}
                    onChange={(e) => setReportQty(Math.max(1, Number(e.target.value)))}
                    required
                    min={1}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isReportingLoss}
                  className="w-full px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  {isReportingLoss ? (lang === 'fr' ? 'Enregistrement...' : 'جاري الحفظ...') : (lang === 'fr' ? "Enregistrer l'écart" : 'تأكيد وحسم التالف من المخزن')}
                </button>
              </form>
            </div>

          </div>
        </>
      )}

      {activeTab === 'deliveryNotes' && (
        // --- Bons de Livraison (BL) Tab Content ---
        <div className="space-y-6">
          {!showNewBLForm ? (
            // BL History List View
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    {lang === 'fr' ? 'Historique des Bons de Livraison' : 'أرشيف وسجل بونات التسليم والمبيعات'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'fr' ? 'Visualisez, filtrez et imprimez les bons de livraison émis.' : 'عرض ومتابعة وطباعة جميع بونات التسليم الصادرة للزبائن ومحلات التوزيع.'}
                  </p>
                </div>

                <button
                  onClick={() => setShowNewBLForm(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10 self-start sm:self-auto transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'fr' ? 'Nouveau Bon de Livraison' : 'إنشاء بون تسليم جديد'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par N° Bon, Client, Code ou Stock...' : 'البحث عن بون برقم البون، اسم الزبون، كود أو مستودع...'}
                  value={blSearchQuery}
                  onChange={(e) => setBlSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {filteredBLHistory.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">{lang === 'fr' ? 'Aucun bon de livraison trouvé' : 'لم يتم العثور على أي بونات تسليم مطابقة'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'N° Bon' : 'رقم البون'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Date' : 'التاريخ'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Client' : 'الزبون / كود'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Stock Source' : 'مستودع الصرف'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Congélateur N°' : 'رقم الثلاجة'}</th>
                        <th className="px-4 py-3 text-right font-bold">{lang === 'fr' ? 'Net à Payer' : 'الصافي للدفع'}</th>
                        <th className="px-4 py-3 text-center font-bold">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {filteredBLHistory.map(note => (
                        <tr key={note.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 font-bold">
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 text-xs">{note.noteNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{note.date}</td>
                          <td className="px-4 py-3">
                            <span className="text-slate-800 dark:text-slate-200">{note.clientName}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">Code: {note.clientCode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {note.sourceStockLocation}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700 dark:text-slate-300 font-mono">
                              {note.congNumber} 
                            </span>
                            <span className="block text-[9px] text-slate-400 font-normal">Modèle : {note.congType}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                            {note.netPayable.toFixed(2)} DH
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setPreviewingDoc(note); setPreviewingDocType('bl'); }}
                                title={lang === 'fr' ? 'Visualiser' : 'معاينة البون'}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startEditingBL(note)}
                                title={lang === 'fr' ? 'Modifier' : 'تعديل البون'}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => generateBLPdf(note, lang)}
                                title={lang === 'fr' ? 'Imprimer PDF' : 'تحميل وطباعة البون PDF'}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // --- NEW BL FORM ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-md">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowNewBLForm(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-500 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      {lang === 'fr' ? 'Création d\'un Bon de Livraison' : 'نموذج بون تسليم ومبيعات (مطابق للتصميم الورقي)'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'fr' ? 'Saisissez les informations du client et les quantités correspondantes pour déduire le stock.' : 'قم بتعبئة تفاصيل الزبون والكميات المباعة. يتم الخصم فورياً من المستودع المحدد أدناه.'}
                    </p>
                  </div>
                </div>

                <div className="text-xxs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 rounded-lg font-bold uppercase tracking-wider">
                  DESIGN 2026
                </div>
              </div>

              {blSuccessMessage && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs flex items-center gap-2 font-bold animate-bounce">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{blSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleBLSubmit} className="space-y-6">
                
                {/* BL metadata grid (Matches Paper Header) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Client name */}
                  <div>
                    <label className="block text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Nom du Client *' : 'اسم الزبون / المحل *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={lang === 'fr' ? 'Nom du Client' : 'أدخل اسم الزبون الكامل'}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Client Code */}
                  <div>
                    <label className="block text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Code Client' : 'كود الزبون'}
                    </label>
                    <input
                      type="text"
                      value={clientCode}
                      onChange={(e) => setClientCode(e.target.value)}
                      placeholder="e.g., CL-1092"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Date' : 'تاريخ البون'}
                    </label>
                    <input
                      type="date"
                      value={blDate}
                      onChange={(e) => setBlDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Cong Number */}
                  <div>
                    <label className="block text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Congélateur N° (N° Cong)' : 'رقم الثلاجة (N° Cong)'}
                    </label>
                    <input
                      type="text"
                      value={congNumber}
                      onChange={(e) => setCongNumber(e.target.value)}
                      placeholder="e.g., AP-49"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Cong Type (AP: 300L | AG: 400L | AS: 500L) */}
                  <div>
                    <label className="block text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'fr' ? 'Type Congélateur' : 'صنف وحجم الثلاجة'}
                    </label>
                    <select
                      value={congType}
                      onChange={(e) => setCongType(e.target.value as 'AP' | 'AG' | 'AS')}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="AP">AP : 300 L (Coffre Horizontal)</option>
                      <option value="AG">AG : 400 L (Armoire Verticale)</option>
                      <option value="AS">AS : 500 L (Armoire Vitrée Spéciale)</option>
                    </select>
                  </div>

                  {/* SPECIFY STOCK (DEDUCT STOCK FROM SELECTED LOCATION) */}
                  <div>
                    <label className="block text-xxs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1 animate-pulse">
                      <MapPin className="h-3 w-3" />
                      {lang === 'fr' ? 'Stock de Prélèvement *' : 'مستودع الخصم وتحديد المخزن *'}
                    </label>
                    <select
                      value={sourceStockLocation}
                      onChange={(e) => setSourceStockLocation(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-orange-200 dark:border-orange-900/30 rounded-lg font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="Magasin Usine">{lang === 'fr' ? 'Magasin Usine' : 'مستودع المصنع المركزي'}</option>
                      <option value="Magasin MICZ">{lang === 'fr' ? 'Magasin MICZ' : 'مستودع MICZ الرئيسي'}</option>
                      <option value="Magasin Zone Logistique">{lang === 'fr' ? 'Magasin Zone Logistique' : 'مخزن المنطقة اللوجستية'}</option>
                      {state.depots && Object.keys(state.depots).map(depotName => (
                        <option key={depotName} value={depotName}>
                          {lang === 'fr' ? `Dépôt ${depotName}` : `مستودع ${depotName}`}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Products Grid presets (Structured Table Matching physical document) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {lang === 'fr' ? 'Tableau des Produits' : 'جدول إدخال كميات المنتجات (32 صنف)'}
                    </h4>

                    {/* Preset search */}
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={lang === 'fr' ? 'Filtrer un produit...' : 'تصفية الصنف...'}
                        value={presetSearch}
                        onChange={(e) => setPresetSearch(e.target.value)}
                        className="w-full text-xxs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xxs text-slate-500 dark:text-slate-400 relative">
                      <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5 font-bold text-center w-12">N°</th>
                          <th className="px-3 py-2.5 font-bold">{lang === 'fr' ? 'DESIGNATION' : 'الصنف'}</th>
                          <th className="px-3 py-2.5 font-bold text-center w-24">PCS/CTN</th>
                          <th className="px-3 py-2.5 font-bold text-right w-32">{lang === 'fr' ? 'PRIX CTN (DH)' : 'سعر الكرتونة'}</th>
                          <th className="px-3 py-2.5 font-bold text-center w-28">{lang === 'fr' ? 'QTÉ (CTN) *' : 'الكمية (كرتون) *'}</th>
                          <th className="px-3 py-2.5 font-bold text-right w-32">{lang === 'fr' ? 'MONTANT' : 'المجموع'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                        {BL_PRODUCTS_PRESETS.map((preset, index) => {
                          const qty = blQuantities[preset.name] || 0;
                          const total = qty * preset.pricePerCarton;
                          const matchSearch = preset.name.toLowerCase().includes(presetSearch.toLowerCase());

                          if (!matchSearch && presetSearch) return null;

                          return (
                            <tr key={preset.name} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 ${qty > 0 ? 'bg-blue-50/25 dark:bg-blue-950/5' : ''}`}>
                              <td className="px-3 py-2.5 font-mono text-center text-slate-400 font-bold">{index + 1}</td>
                              <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 text-xs">{preset.name}</td>
                              <td className="px-3 py-2.5 font-mono text-center text-slate-500 font-bold">{preset.pcsPerCarton} pcs</td>
                              <td className="px-3 py-2.5 font-mono text-right font-bold text-slate-700 dark:text-slate-300">{preset.pricePerCarton.toFixed(2)} DH</td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={qty || ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    setBlQuantities(prev => ({
                                      ...prev,
                                      [preset.name]: val
                                    }));
                                  }}
                                  className="w-20 text-center font-mono font-bold text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:border-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-3 py-2.5 font-mono text-right font-bold text-blue-600 dark:text-blue-400 text-xs">
                                {total > 0 ? `${total.toFixed(2)} DH` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary panel */}
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-full sm:max-w-md p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    
                    {/* Discount Management Buttons */}
                    <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl space-y-2 border border-slate-200 dark:border-slate-850 text-left">
                      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        {lang === 'fr' ? 'Module Gestion des Remises :' : 'وحدة إدارة وتفعيل الخصومات :'}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* 10% Discount activator */}
                        <button
                          type="button"
                          onClick={() => {
                            const tenPercent = blTotalBrut * 0.10;
                            setBlDiscount(Number(tenPercent.toFixed(2)));
                          }}
                          className={`px-2.5 py-1 text-xxs font-black rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            Math.abs(blDiscount - blTotalBrut * 0.10) < 0.05 && blTotalBrut > 0
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs shadow-sky-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-400'
                          }`}
                        >
                          <span>{lang === 'fr' ? 'Remise 10%' : 'تفعيل خصم 10%'}</span>
                        </button>

                        {/* CA Progressive Discounts */}
                        <button
                          type="button"
                          onClick={() => {
                            const val = blTotalBrut * 0.03;
                            setBlDiscount(Number(val.toFixed(2)));
                          }}
                          className={`px-2 py-1 text-xxs font-black rounded-lg border transition-all cursor-pointer ${
                            Math.abs(blDiscount - blTotalBrut * 0.03) < 0.05 && blTotalBrut > 0
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                          }`}
                          title="CA >= 5 000 DH (3%)"
                        >
                          <span>3% (CA ≥ 5k)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const val = blTotalBrut * 0.05;
                            setBlDiscount(Number(val.toFixed(2)));
                          }}
                          className={`px-2 py-1 text-xxs font-black rounded-lg border transition-all cursor-pointer ${
                            Math.abs(blDiscount - blTotalBrut * 0.05) < 0.05 && blTotalBrut > 0
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                          }`}
                          title="CA >= 10 000 DH (5%)"
                        >
                          <span>5% (CA ≥ 10k)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const val = blTotalBrut * 0.07;
                            setBlDiscount(Number(val.toFixed(2)));
                          }}
                          className={`px-2 py-1 text-xxs font-black rounded-lg border transition-all cursor-pointer ${
                            Math.abs(blDiscount - blTotalBrut * 0.07) < 0.05 && blTotalBrut > 0
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                          }`}
                          title="CA >= 25 000 DH (7%)"
                        >
                          <span>7% (CA ≥ 25k)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const val = blTotalBrut * 0.12;
                            setBlDiscount(Number(val.toFixed(2)));
                          }}
                          className={`px-2 py-1 text-xxs font-black rounded-lg border transition-all cursor-pointer ${
                            Math.abs(blDiscount - blTotalBrut * 0.12) < 0.05 && blTotalBrut > 0
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                          }`}
                          title="CA >= 50 000 DH (12%)"
                        >
                          <span>12% (CA ≥ 50k)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>{lang === 'fr' ? 'TOTAL BRUT :' : 'المجموع الإجمالي الخام :'}</span>
                      <span className="font-mono">{blTotalBrut.toFixed(2)} DH</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400">{lang === 'fr' ? 'REMISE ACCORDÉE (DH) :' : 'الخصم المباشر (Remise) :'}</span>
                      <input
                        type="number"
                        min={0}
                        max={blTotalBrut}
                        value={blDiscount || ''}
                        placeholder="0.00"
                        onChange={(e) => setBlDiscount(Math.max(0, Number(e.target.value)))}
                        className="w-28 text-right font-mono font-bold text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">{lang === 'fr' ? 'NET À PAYER :' : 'الصافي المطلوب للدفع :'}</span>
                      <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                        {blNetPayable.toFixed(2)} DH
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBLForm(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingBL}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingBL ? (lang === 'fr' ? 'Sauvegarde...' : 'جاري الحفظ والتسجيل...') : (lang === 'fr' ? 'Enregistrer & Télécharger PDF' : 'تأكيد التسجيل وتحميل البون PDF')}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'supplyRequests' && (
        <div className="space-y-6">
          {!showNewSRForm ? (
            // --- History View ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    {lang === 'fr' ? "Demandes d'Approvisionnement Produit Finis" : 'طلبات التزويد بالمنتجات النهائية (Demande d\'approvisionnement)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'fr' ? 'Gérez et éditez les demandes d\'approvisionnement conformes au modèle papier.' : 'إدارة وتسجيل طلبات تزويد المنتجات النهائية بالكامل مطابقة للنموذج الورقي الرسمي.'}
                  </p>
                </div>

                <button
                  onClick={() => setShowNewSRForm(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/10 self-start sm:self-auto transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'fr' ? 'Nouvelle Demande' : 'إضافة طلب تزويد جديد'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par N° Demande, Agence, Vendeur...' : 'البحث عن طلب برقم الطلب، الوكالة، البائع...'}
                  value={srSearchQuery}
                  onChange={(e) => setSrSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-55 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {(state.supplyRequests || []).length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">{lang === 'fr' ? 'Aucune demande trouvée' : 'لم يتم العثور على أي طلبات تزويد مطابقة'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'N° Demande' : 'رقم الطلب'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Date' : 'التاريخ'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Agence' : 'الوكالة'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Vendeur' : 'البائع'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Chef Secteur' : 'رئيس القطاع'}</th>
                        <th className="px-4 py-3 text-right font-bold">{lang === 'fr' ? 'Total Global' : 'المجموع الإجمالي'}</th>
                        <th className="px-4 py-3 text-center font-bold">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {(state.supplyRequests || []).filter(req => {
                        const matchQuery = srSearchQuery.toLowerCase();
                        return (
                          req.requestNumber.toLowerCase().includes(matchQuery) ||
                          req.agency.toLowerCase().includes(matchQuery) ||
                          req.vendeur.toLowerCase().includes(matchQuery)
                        );
                      }).map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 font-bold">
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 text-xs">{req.requestNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{req.date}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{req.agency || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{req.vendeur || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{req.chefSecteur || '-'}</td>
                          <td className="px-4 py-3 text-right font-mono text-blue-600 dark:text-blue-400 text-xs">
                            {req.totalGlobalDhs ? `${req.totalGlobalDhs.toFixed(2)} DH` : '0.00 DH'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setPreviewingDoc(req); setPreviewingDocType('sr'); }}
                                title={lang === 'fr' ? 'Visualiser' : 'معاينة البون'}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startEditingSR(req)}
                                title={lang === 'fr' ? 'Modifier' : 'تعديل البون'}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => generateSupplyRequestPdf(req, lang)}
                                title={lang === 'fr' ? 'Télécharger PDF' : 'تحميل PDF'}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // --- NEW SUPPLY REQUEST FORM (Matches paper precisely) ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-md">
              
              {/* Paper header representation */}
              <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 gap-4">
                
                {/* ZAHI GLACES Stylized Emblem */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 border-2 border-slate-850 rounded-[24px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 font-mono shadow-xs">
                    <span className="text-[10px] font-black tracking-wider text-slate-800 dark:text-slate-200 leading-none">ZAHI</span>
                    <span className="text-[8px] font-bold italic text-slate-500 dark:text-slate-400">GLACES</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      DEMANDE D'APPROVISIONNEMENT
                    </h3>
                    <p className="text-xxs font-extrabold text-slate-500 uppercase tracking-wider">
                      PRODUIT FINIS
                    </p>
                  </div>
                </div>

                {/* Date & requestNumber (Right match of form) */}
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                  <div>
                    <label className="block text-xxs font-black text-slate-400 uppercase tracking-wider mb-1">N°</label>
                    <input
                      type="text"
                      value={srRequestNumber}
                      onChange={(e) => setSrRequestNumber(e.target.value)}
                      placeholder="092201"
                      className="w-28 text-xs font-mono font-bold text-center px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-400 uppercase tracking-wider mb-1">DATE</label>
                    <input
                      type="date"
                      value={srDate}
                      onChange={(e) => setSrDate(e.target.value)}
                      className="w-36 text-xs font-mono font-bold text-center px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Form success message */}
              {srSuccessMessage && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs flex items-center gap-2 font-bold animate-bounce">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{srSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSRSubmit} className="space-y-6">

                {/* Metadata paper Fields */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Dépôt Régional (Agence) :</label>
                    <select
                      value={srAgency}
                      onChange={(e) => setSrAgency(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold outline-none focus:border-blue-500"
                    >
                      <option value="">{lang === 'fr' ? '-- Choisir un dépôt --' : '-- اختر مستودعاً جهوياً --'}</option>
                      {Object.keys(state.depots || {}).length > 0 ? (
                        Object.keys(state.depots || {}).map((depotName) => (
                          <option key={depotName} value={depotName}>
                            {depotName}
                          </option>
                        ))
                      ) : (
                        ["Casablanca", "Oujda", "Tanger", "Meknès", "Marrakech", "Agadir", "Safi", "Berrechid"].map((depotName) => (
                          <option key={depotName} value={depotName}>
                            {depotName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">CHEF SECTEUR :</label>
                    <input
                      type="text"
                      value={srChefSecteur}
                      onChange={(e) => setSrChefSecteur(e.target.value)}
                      placeholder="Chef Secteur"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">MAGASINIER :</label>
                    <input
                      type="text"
                      value={srMagasinier}
                      onChange={(e) => setSrMagasinier(e.target.value)}
                      placeholder="Magasinier"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">VENDEUR :</label>
                    <input
                      type="text"
                      value={srVendeur}
                      onChange={(e) => setSrVendeur(e.target.value)}
                      placeholder="Vendeur"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Filter Search inside form for rapid input on mobile */}
                <div className="relative max-w-xs ml-auto">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={lang === 'fr' ? 'Rechercher un article du tableau...' : 'البحث وتصفية مادة من الجدول...'}
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full text-xxs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                {/* Two Column Layout of Tables matching paper image */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {/* Column 1 Table (Z 01 to Z 37) */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-black text-center">
                        <tr>
                          <th className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 w-12">REF</th>
                          <th className="px-3 py-2 text-left border-r border-slate-200 dark:border-slate-800">ARTICLES</th>
                          <th className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 w-24">Qté Cdé</th>
                          <th className="px-2 py-2 w-24">Qté Liv</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
                        {SUPPLY_ITEMS_COL1.map((item) => {
                          const isMatch = item.articleName.toLowerCase().includes(presetSearch.toLowerCase()) || item.ref.toLowerCase().includes(presetSearch.toLowerCase());
                          if (presetSearch && !isMatch) return null;

                          return (
                            <tr key={item.ref} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-mono text-xxs text-slate-500">
                                {item.ref}
                              </td>
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800 truncate text-[10px]">
                                {item.articleName}
                              </td>
                              <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-800">
                                <input
                                  type="number"
                                  min="0"
                                  value={srOrderedQtys[item.ref] || ''}
                                  onChange={(e) => setSrOrderedQtys({
                                    ...srOrderedQtys,
                                    [item.ref]: Number(e.target.value)
                                  })}
                                  placeholder="0"
                                  className="w-full text-center py-1 font-mono text-xs bg-transparent focus:bg-slate-100 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:border-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={srDeliveredQtys[item.ref] || ''}
                                  onChange={(e) => setSrDeliveredQtys({
                                    ...srDeliveredQtys,
                                    [item.ref]: Number(e.target.value)
                                  })}
                                  placeholder="0"
                                  className="w-full text-center py-1 font-mono text-xs bg-transparent focus:bg-slate-100 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:border-blue-500 outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Column 2 Table (Z 38 to Z 71) */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-black text-center">
                        <tr>
                          <th className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 w-12">REF</th>
                          <th className="px-3 py-2 text-left border-r border-slate-200 dark:border-slate-800">ARTICLES</th>
                          <th className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 w-24">Qté Cdé</th>
                          <th className="px-2 py-2 w-24">Qté Liv</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
                        {SUPPLY_ITEMS_COL2.map((item) => {
                          const isMatch = item.articleName.toLowerCase().includes(presetSearch.toLowerCase()) || item.ref.toLowerCase().includes(presetSearch.toLowerCase());
                          if (presetSearch && !isMatch) return null;

                          return (
                            <tr key={item.ref} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-mono text-xxs text-slate-500">
                                {item.ref}
                              </td>
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800 truncate text-[10px]">
                                {item.articleName}
                              </td>
                              <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-800">
                                <input
                                  type="number"
                                  min="0"
                                  value={srOrderedQtys[item.ref] || ''}
                                  onChange={(e) => setSrOrderedQtys({
                                    ...srOrderedQtys,
                                    [item.ref]: Number(e.target.value)
                                  })}
                                  placeholder="0"
                                  className="w-full text-center py-1 font-mono text-xs bg-transparent focus:bg-slate-100 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:border-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={srDeliveredQtys[item.ref] || ''}
                                  onChange={(e) => setSrDeliveredQtys({
                                    ...srDeliveredQtys,
                                    [item.ref]: Number(e.target.value)
                                  })}
                                  placeholder="0"
                                  className="w-full text-center py-1 font-mono text-xs bg-transparent focus:bg-slate-100 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:border-blue-500 outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Total Global & Currency */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    TOTAL GLOBAL
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={srTotalGlobalDhs}
                      onChange={(e) => setSrTotalGlobalDhs(e.target.value)}
                      placeholder="0.00"
                      className="w-40 px-3 py-1.5 font-mono text-right text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg outline-none focus:border-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-500 font-mono">Dhs</span>
                  </div>
                </div>

                {/* Digital Visa Stamps (bottom section of form) */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <h4 className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
                    VISAS & SIGNATURES CONTRÔLE
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    
                    {['VISA DIRECTION', 'VISA CONTRÔLE', 'VISA MAGASINIER', 'VISE CHEF SECTEUR', 'VISA VENDEUR'].map((visa, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative group">
                        <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 text-center mb-2">
                          {visa}
                        </span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-blue-600 cursor-pointer rounded border-slate-300 text-blue-600"
                        />
                      </div>
                    ))}

                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowNewSRForm(false); setPresetSearch(''); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingSR}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingSR ? (lang === 'fr' ? 'Sauvegarde...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer & Télécharger PDF' : 'تأكيد التسجيل وتحميل بون PDF')}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bonAvoir' && (
        <div className="space-y-6">
          {!showNewBAForm ? (
            // --- Bon Avoir History View ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-500" />
                    {lang === 'fr' ? 'Bons de Retour (Avoir) - Zahi Glaces' : 'بونات الإرجاع المالي (Bon Avoir)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'fr' ? 'Gérez et éditez les bons d\'avoir de retour conformes au modèle papier officiel.' : 'إدارة ومتابعة وتسجيل بونات الإرجاع بالكامل مطابقة للنموذج الورقي الرسمي.'}
                  </p>
                </div>

                <button
                  onClick={() => setShowNewBAForm(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10 self-start sm:self-auto transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'fr' ? 'Nouveau Bon d\'Avoir' : 'إضافة بون إرجاع جديد'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par N° Bon, Client...' : 'البحث عن بون إرجاع برقم البون، كود الزبون...'}
                  value={baSearchQuery}
                  onChange={(e) => setBaSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              {(!state.bonAvoirs || state.bonAvoirs.length === 0) ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">{lang === 'fr' ? 'Aucun bon d\'avoir trouvé' : 'لم يتم العثور على أي بونات إرجاع'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'N° Bon' : 'رقم البون'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Date' : 'التاريخ'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Client (Gauche)' : 'الزبون (يسار)'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Client (Droite)' : 'الزبون (يمين)'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Type Cong' : 'نوع الثلاجة'}</th>
                        <th className="px-4 py-3 text-right font-bold">{lang === 'fr' ? 'Montant Avoir' : 'إجمالي مبلغ الإرجاع'}</th>
                        <th className="px-4 py-3 text-center font-bold">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {state.bonAvoirs.filter(ba => {
                        const matchQuery = baSearchQuery.toLowerCase();
                        return (
                          ba.number.toLowerCase().includes(matchQuery) ||
                          ba.clientCodeLeft.toLowerCase().includes(matchQuery) ||
                          ba.clientCodeRight.toLowerCase().includes(matchQuery)
                        );
                      }).map(ba => (
                        <tr key={ba.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 font-bold">
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 text-xs">{ba.number}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{ba.date}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{ba.clientCodeLeft || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{ba.clientCodeRight || '-'}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {ba.congType ? `${ba.congType} (${ba.congNumber})` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                            {ba.montantAvoirDirhams ? `${ba.montantAvoirDirhams.toFixed(2)} DH` : '0.00 DH'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setPreviewingDoc(ba); setPreviewingDocType('ba'); }}
                                title={lang === 'fr' ? 'Visualiser' : 'معاينة البون'}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startEditingBA(ba)}
                                title={lang === 'fr' ? 'Modifier' : 'تعديل البون'}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => generateBonAvoirPdf(ba, lang)}
                                title={lang === 'fr' ? 'Télécharger PDF' : 'تحميل PDF'}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // --- NEW BON AVOIR FORM (PRECISE PAPER EMULATION) ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-md">
              
              {/* Paper header representation */}
              <div className="flex flex-col md:flex-row items-stretch justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 gap-6">
                
                {/* Left logo and title block */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 border-2 border-slate-800 rounded-[24px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 font-mono shadow-xs shrink-0">
                    <span className="text-[10px] font-black tracking-wider text-slate-800 dark:text-slate-200 leading-none">ZAHI</span>
                    <span className="text-[8px] font-bold italic text-slate-500 dark:text-slate-400">GLACES</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none">
                      BON AVOIR ZAHIGLACE
                    </h3>
                    <div className="mt-2">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Code Client :</label>
                      <input
                        type="text"
                        value={baClientCodeLeft}
                        onChange={(e) => setBaClientCodeLeft(e.target.value)}
                        placeholder="........................"
                        className="w-48 text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right side fields block */}
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto self-center bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  <div className="col-span-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">N° :</span>
                    <input
                      type="text"
                      value={baNumber}
                      onChange={(e) => setBaNumber(e.target.value)}
                      placeholder="000023051"
                      className="w-36 text-xs font-mono font-bold text-center px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date :</label>
                    <input
                      type="date"
                      value={baDate}
                      onChange={(e) => setBaDate(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Code Client :</label>
                    <input
                      type="text"
                      value={baClientCodeRight}
                      onChange={(e) => setBaClientCodeRight(e.target.value)}
                      placeholder="........................"
                      className="w-full text-xs font-bold px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type Cong N° :</label>
                      <input
                        type="text"
                        value={baCongNumber}
                        onChange={(e) => setBaCongNumber(e.target.value)}
                        placeholder="N° Congélateur"
                        className="w-full text-xs font-bold px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type :</label>
                      <div className="flex gap-2">
                        {['AP', 'AG', 'A'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setBaCongType(t as any)}
                            className={`px-1.5 py-1 text-xxs font-black rounded border cursor-pointer transition-all ${
                              baCongType === t
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Success Notification */}
              {baSuccessMessage && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs flex items-center gap-2 font-bold animate-bounce">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{baSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleBASubmit} className="space-y-6">

                {/* Live Form Search/Filter */}
                <div className="relative max-w-xs ml-auto">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={lang === 'fr' ? 'Rechercher / Filtrer un article...' : 'تصفية والبحث السريع عن منتج...'}
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full text-xxs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {/* EMULATOR TABLE OF BON AVOIR */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400 min-w-[700px]">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-black text-center text-xxs">
                        <tr>
                          <th rowSpan={2} className="px-2 py-3 border-r border-slate-200 dark:border-slate-800 w-16">QTE PCS</th>
                          <th rowSpan={2} className="px-3 py-3 text-left border-r border-slate-200 dark:border-slate-800">PRODUITS</th>
                          <th colSpan={3} className="px-2 py-1.5 border-b border-r border-slate-200 dark:border-slate-800 text-center">EN CARTONS</th>
                          <th colSpan={3} className="px-2 py-1.5 border-b border-r border-slate-200 dark:border-slate-800 text-center">EN PIÈCES</th>
                          <th rowSpan={2} className="px-2 py-3 w-28">MON GLO</th>
                        </tr>
                        <tr>
                          <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-800 w-20">QUANTITÉ</th>
                          <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-800 w-24">PRIX CARTONS</th>
                          <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-800 w-24">MONTANT</th>
                          <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-800 w-20">QUANTITÉ</th>
                          <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-800 w-24">PRIX PIÈCES</th>
                          <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-800 w-24">MONTANT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
                        {BON_AVOIR_ITEMS_PRESETS.map((item) => {
                          const isMatch = item.productName.toLowerCase().includes(presetSearch.toLowerCase());
                          if (presetSearch && !isMatch) return null;

                          const cartonQty = baCartonsQtys[item.productName] || '';
                          const pieceQty = baPiecesQtys[item.productName] || '';
                          const cartonPrice = item.prixCartons;
                          const piecePrice = item.prixPieces;

                          const cartonMontant = Number(cartonQty) ? (Number(cartonQty) * cartonPrice) : 0;
                          const pieceMontant = Number(pieceQty) ? (Number(pieceQty) * piecePrice) : 0;
                          const rowTotal = cartonMontant + pieceMontant;

                          return (
                            <tr key={item.productName} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              {/* Fixed QTE PCS */}
                              <td className="px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-500">
                                {item.qtePcsPreset}
                              </td>

                              {/* PRODUCT NAME */}
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800 truncate text-[10px]">
                                {item.productName}
                              </td>

                              {/* CARTONS QUANTITY INPUT */}
                              <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-800">
                                <input
                                  type="number"
                                  min="0"
                                  value={cartonQty}
                                  onChange={(e) => setBaCartonsQtys({
                                    ...baCartonsQtys,
                                    [item.productName]: Number(e.target.value)
                                  })}
                                  placeholder="0"
                                  className="w-full text-center py-1 font-mono text-xs bg-transparent border border-slate-200 dark:border-slate-850 rounded-md focus:border-emerald-500 outline-none"
                                />
                              </td>

                              {/* CARTON PRICE (DISPLAY) */}
                              <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-xxs text-slate-500">
                                {cartonPrice.toFixed(2)}
                              </td>

                              {/* CARTON TOTAL */}
                              <td className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-400">
                                {cartonMontant > 0 ? cartonMontant.toFixed(2) : '-'}
                              </td>

                              {/* PIECES QUANTITY INPUT */}
                              <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-800">
                                <input
                                  type="number"
                                  min="0"
                                  value={pieceQty}
                                  onChange={(e) => setBaPiecesQtys({
                                    ...baPiecesQtys,
                                    [item.productName]: Number(e.target.value)
                                  })}
                                  placeholder="0"
                                  className="w-full text-center py-1 font-mono text-xs bg-transparent border border-slate-200 dark:border-slate-850 rounded-md focus:border-emerald-500 outline-none"
                                />
                              </td>

                              {/* PIECE PRICE (DISPLAY) */}
                              <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-xxs text-slate-500">
                                {piecePrice.toFixed(2)}
                              </td>

                              {/* PIECE TOTAL */}
                              <td className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-400">
                                {pieceMontant > 0 ? pieceMontant.toFixed(2) : '-'}
                              </td>

                              {/* MON GLO TOTAL */}
                              <td className="px-2 py-1.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/5">
                                {rowTotal > 0 ? `${rowTotal.toFixed(2)} DH` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOTAL SUMMARY DIRHAMS */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    {lang === 'fr' ? 'MONTANT AVOIR EN DIRHAMS' : 'المجموع الإجمالي للإرجاع بالدرهم (Montant Avoir)'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 shadow-inner">
                      {calculateBaTotal().toFixed(2)}
                    </div>
                    <span className="text-xs font-black text-slate-500 font-mono">Dhs</span>
                  </div>
                </div>

                {/* Signatures emulation */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                  <h4 className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
                    VISAS & SIGNATURES CONTRÔLE AVOIR
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['CLIENT', 'VENDEUR', 'MAGASIN', 'ADMINISTRATIF'].map((visa, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                        <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 text-center mb-2 uppercase">
                          {visa}
                        </span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-emerald-600 cursor-pointer rounded border-slate-300 text-emerald-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowNewBAForm(false); setPresetSearch(''); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingBA}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingBA ? (lang === 'fr' ? 'Sauvegarde...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer & Télécharger PDF' : 'تأكيد التسجيل وتحميل بون PDF')}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bonEncaissement' && (
        <div className="space-y-6">
          {!showNewBEForm ? (
            // --- Bon d'Encaissement History View ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    {lang === 'fr' ? 'Bons d\'Encaissement - Zahi Glaces' : 'بونات الإيداع والقبض المالي (Bon d\'Encaissement)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'fr' ? 'Gérez et éditez les bons d\'encaissement d\'usine.' : 'إدارة ومتابعة وتسجيل بونات الإيداع النقدي بالكامل مطابقة للنموذج الورقي الرسمي.'}
                  </p>
                </div>

                <button
                  onClick={() => setShowNewBEForm(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/10 self-start sm:self-auto transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'fr' ? 'Nouveau Bon d\'Encaissement' : 'إضافة بون إيداع جديد'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par N° Bon, Vendeur...' : 'البحث عن بون برقم البون، اسم الموزع...'}
                  value={beSearchQuery}
                  onChange={(e) => setBeSearchQuery(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              {(!state.bonEncaissements || state.bonEncaissements.length === 0) ? (
                <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">{lang === 'fr' ? 'Aucun bon d\'encaissement trouvé' : 'لم يتم العثور على أي بونات إيداع'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xxs text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'N° Bon' : 'رقم البون'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Date' : 'التاريخ'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Vendeur' : 'الموزع / البائع'}</th>
                        <th className="px-4 py-3 font-bold">{lang === 'fr' ? 'Observation' : 'ملاحظات'}</th>
                        <th className="px-4 py-3 text-right font-bold">{lang === 'fr' ? 'Total Reçu' : 'إجمالي المقبوض'}</th>
                        <th className="px-4 py-3 text-center font-bold">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {state.bonEncaissements.filter(be => {
                        const matchQuery = beSearchQuery.toLowerCase();
                        return (
                          be.number.toLowerCase().includes(matchQuery) ||
                          be.vendeur.toLowerCase().includes(matchQuery)
                        );
                      }).map(be => (
                        <tr key={be.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 font-bold">
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200 text-xs">{be.number}</td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{be.date}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{be.vendeur || '-'}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{be.observation || '-'}</td>
                          <td className="px-4 py-3 text-right font-mono text-indigo-600 dark:text-indigo-400 text-xs">
                            {be.totalRecu ? `${be.totalRecu.toFixed(2)} DH` : '0.00 DH'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setPreviewingDoc(be); setPreviewingDocType('be'); }}
                                title={lang === 'fr' ? 'Visualiser' : 'معاينة البون'}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startEditingBE(be)}
                                title={lang === 'fr' ? 'Modifier' : 'تعديل البون'}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => generateBonEncaissementPdf(be, lang)}
                                title={lang === 'fr' ? 'Télécharger PDF' : 'تحميل PDF'}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // --- NEW BON D'ENCAISSEMENT FORM (PAPER IMITATION) ---
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-md">
              
              {/* Paper header representation */}
              <div className="flex flex-col md:flex-row items-stretch justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 gap-6">
                
                {/* Left logo and address metadata */}
                <div className="flex gap-4">
                  <div className="w-16 h-12 border-2 border-slate-800 rounded-[24px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 font-mono shadow-xs shrink-0 self-start mt-1">
                    <span className="text-[10px] font-black tracking-wider text-slate-800 dark:text-slate-200 leading-none">ZAHI</span>
                    <span className="text-[8px] font-bold italic text-slate-500 dark:text-slate-400">GLACES</span>
                  </div>
                  <div className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    <p className="font-extrabold text-slate-700 dark:text-slate-300">Siège & Usine : Route 3301 Ouled Sidi Abdenbi</p>
                    <p>Chellalatte - Mohammedia</p>
                    <p>Tél : 06 61 39 97 41 / 06 62 13 04 85</p>
                    <p>Fax : 05 22 73 34 97</p>
                    <p className="italic text-slate-400">zahiglaces@hotmail.com</p>
                  </div>
                </div>

                {/* Right side fields block */}
                <div className="flex flex-col items-end justify-center text-right md:text-right">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none mb-1">
                    BON D'ENCAISSEMENT
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">N° :</span>
                    <input
                      type="text"
                      value={beNumber}
                      onChange={(e) => setBeNumber(e.target.value)}
                      placeholder="000114651"
                      className="w-40 text-sm font-mono font-black text-center px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vendeur & Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase shrink-0">Vendeur :</span>
                  <input
                    type="text"
                    value={beVendeur}
                    onChange={(e) => setBeVendeur(e.target.value)}
                    placeholder="Nom du vendeur / distributeur .............................."
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase shrink-0">Date :</span>
                  <input
                    type="date"
                    value={beDate}
                    onChange={(e) => setBeDate(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Success Notification */}
              {beSuccessMessage && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs flex items-center gap-2 font-bold animate-bounce">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{beSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleBESubmit} className="space-y-6">

                {/* EMULATOR TABLE OF BON D'ENCAISSEMENT */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400 min-w-[700px]">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-black text-center text-xxs">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 w-44">Date</th>
                          <th className="px-4 py-3 text-left border-r border-slate-200 dark:border-slate-800">Désignation</th>
                          <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 w-48">Réf</th>
                          <th className="px-4 py-3 w-48">Montant (DH)</th>
                          <th className="px-2 py-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-extrabold text-slate-800 dark:text-slate-200">
                        {beItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            {/* DATE */}
                            <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800">
                              <input
                                type="text"
                                value={item.date}
                                onChange={(e) => handleBeItemChange(index, 'date', e.target.value)}
                                placeholder="JJ/MM/AAAA"
                                className="w-full text-center py-1 font-mono text-xs bg-transparent border-none focus:bg-slate-100 dark:focus:bg-slate-800 outline-none rounded-md"
                              />
                            </td>

                            {/* DESIGNATION */}
                            <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800">
                              <input
                                type="text"
                                value={item.designation}
                                onChange={(e) => handleBeItemChange(index, 'designation', e.target.value)}
                                placeholder="Versement, Chèque, etc..."
                                className="w-full text-left py-1 text-xs bg-transparent border-none focus:bg-slate-100 dark:focus:bg-slate-800 outline-none rounded-md font-bold"
                              />
                            </td>

                            {/* REF */}
                            <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800">
                              <input
                                type="text"
                                value={item.ref}
                                onChange={(e) => handleBeItemChange(index, 'ref', e.target.value)}
                                placeholder="N° Chèque / Réf"
                                className="w-full text-center py-1 font-mono text-xs bg-transparent border-none focus:bg-slate-100 dark:focus:bg-slate-800 outline-none rounded-md"
                              />
                            </td>

                            {/* MONTANT */}
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.montant || ''}
                                onChange={(e) => handleBeItemChange(index, 'montant', e.target.value)}
                                placeholder="0.00"
                                className="w-full text-right pr-4 py-1 font-mono text-xs bg-transparent border-none focus:bg-slate-100 dark:focus:bg-slate-800 outline-none rounded-md font-black text-indigo-600 dark:text-indigo-400"
                              />
                            </td>

                            {/* DELETE ROW */}
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                disabled={beItems.length === 1}
                                onClick={() => handleRemoveBeRow(index)}
                                className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Control Button */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-850 flex justify-start">
                    <button
                      type="button"
                      onClick={handleAddBeRow}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xxs font-black rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {lang === 'fr' ? 'Ajouter une ligne' : 'إضافة سطر جديد'}
                    </button>
                  </div>
                </div>

                {/* TOTAL SUMMARY DIRHAMS */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-indigo-500" />
                    {lang === 'fr' ? 'TOTAL REÇU EN DIRHAMS' : 'المجموع الإجمالي المقبوض بالدرهم (Total Reçu)'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 shadow-inner">
                      {calculateBeTotal().toFixed(2)}
                    </div>
                    <span className="text-xs font-black text-slate-500 font-mono">Dhs</span>
                  </div>
                </div>

                {/* Observation Text Field */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Observation :</label>
                  <textarea
                    rows={2}
                    value={beObservation}
                    onChange={(e) => setBeObservation(e.target.value)}
                    placeholder="Notes ou remarques complémentaires sur l'encaissement..."
                    className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Visas & Signatures simulation */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                  <h4 className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
                    VISAS & ACCUSES DE RECEPTION
                  </h4>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 text-center mb-2 uppercase">
                        Visa Caissier
                      </span>
                      <input
                        type="checkbox"
                        checked={beVisaCaissier}
                        onChange={(e) => setBeVisaCaissier(e.target.checked)}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer rounded border-slate-300 text-indigo-600"
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 text-center mb-2 uppercase">
                        Visa Vendeur
                      </span>
                      <input
                        type="checkbox"
                        checked={beVisaVendeur}
                        onChange={(e) => setBeVisaVendeur(e.target.checked)}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer rounded border-slate-300 text-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowNewBEForm(false); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingBE}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-indigo-500/10 flex items-center gap-1.5 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingBE ? (lang === 'fr' ? 'Sauvegarde...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer & Télécharger PDF' : 'تأكيد التسجيل وتحميل بون PDF')}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bonChange' && (
        <div className="space-y-6">
          {!showNewBCForm ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
              {/* Header with Search and Create Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    {lang === 'fr' ? 'Historique des Bons de Change' : 'سجل بونات التغيير (Bon Change)'}
                  </h3>
                  <p className="text-xxs text-slate-400 font-bold mt-1">
                    {lang === 'fr' 
                      ? "Gérez et éditez les bons de change de l'usine." 
                      : 'إدارة واستعراض بونات تغيير المنتجات المسجلة في المصنع.'}
                  </p>
                </div>

                <button
                  onClick={() => { setShowNewBCForm(true); }}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer shadow-md shadow-cyan-500/10 flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="h-4.5 w-4.5" />
                  {lang === 'fr' ? 'Nouveau Bon de Change' : 'بون تغيير جديد (Bon Change)'}
                </button>
              </div>

              {/* Search filter */}
              <div className="flex max-w-md">
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher par N° ou Code Client...' : 'بحث عن طريق رقم البون أو كود الزبون...'}
                  value={bcSearchQuery}
                  onChange={(e) => setBcSearchQuery(e.target.value)}
                  className="w-full text-xs font-bold px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* History Table */}
              <div className="border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="px-4 py-3.5">{lang === 'fr' ? 'N° Bon' : 'رقم البون'}</th>
                        <th className="px-4 py-3.5">{lang === 'fr' ? 'Date' : 'التاريخ'}</th>
                        <th className="px-4 py-3.5">{lang === 'fr' ? 'Client' : 'كود الزبون'}</th>
                        <th className="px-4 py-3.5">{lang === 'fr' ? 'Type Cong' : 'نوع المبرد'}</th>
                        <th className="px-4 py-3.5 text-right">{lang === 'fr' ? 'Montant' : 'المبلغ الإجمالي'}</th>
                        <th className="px-4 py-3.5 text-center">{lang === 'fr' ? 'Actions' : 'إجراءات'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {(!state.bonChanges || state.bonChanges.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                            {lang === 'fr' ? 'Aucun bon de change enregistré.' : 'لا توجد بونات تغيير مسجلة حالياً.'}
                          </td>
                        </tr>
                      ) : (
                        state.bonChanges
                          .filter(bc => {
                            const q = bcSearchQuery.toLowerCase();
                            return (
                              bc.number.toLowerCase().includes(q) ||
                              bc.clientCodeLeft.toLowerCase().includes(q) ||
                              bc.clientCodeRight.toLowerCase().includes(q)
                            );
                          })
                          .map((bc) => (
                            <tr key={bc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="px-4 py-3 font-black text-slate-900 dark:text-slate-100">{bc.number}</td>
                              <td className="px-4 py-3 font-mono text-slate-500">{bc.date}</td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {bc.clientCodeRight || bc.clientCodeLeft || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {bc.congType ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {bc.congType} {bc.congNumber ? `N° ${bc.congNumber}` : ''}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-black text-cyan-600 dark:text-cyan-400 font-mono">
                                {bc.montantChangeDirhams.toFixed(2)} Dh
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => { setPreviewingDoc(bc); setPreviewingDocType('bc'); }}
                                    title={lang === 'fr' ? 'Visualiser' : 'معاينة البون'}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditingBC(bc)}
                                    title={lang === 'fr' ? 'Modifier' : 'تعديل البون'}
                                    className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => generateBonChangePdf(bc, lang)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div>
                  <span className="text-xxs font-black text-cyan-500 uppercase tracking-widest">
                    {lang === 'fr' ? 'Saisie de Document' : 'تعبئة المستند'}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mt-0.5">
                    {lang === 'fr' ? 'Nouveau Bon de Change' : 'بون تغيير جديد (Bon Change)'}
                  </h3>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowNewBCForm(false)}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase cursor-pointer"
                >
                  {lang === 'fr' ? 'Fermer' : 'إغلاق'}
                </button>
              </div>

              {bcSuccessMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-bold text-center">
                  {bcSuccessMessage}
                </div>
              )}

              {/* Form Body - Paper Replication Style */}
              <form onSubmit={handleBCSubmit} className="space-y-6">
                {/* Simulated Paper Header */}
                <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-6 relative overflow-hidden">
                  
                  {/* Decorative Logo / Watermark simulation */}
                  <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                    {/* Zahi Glaces Oval Logo replica */}
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-12 rounded-[50%] bg-slate-200 dark:bg-slate-800 border-2 border-slate-400 flex flex-col items-center justify-center p-1 font-black">
                        <span className="text-slate-800 dark:text-slate-100 text-xs tracking-tight">ZAHI</span>
                        <span className="text-slate-600 dark:text-slate-400 text-[8px] italic -mt-1 font-bold">GLACES</span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">ZAHI GLACES</h4>
                        <p className="text-[9px] text-slate-400 font-bold">Production & Distribution de Glaces</p>
                      </div>
                    </div>

                    <div className="text-center md:text-right">
                      <h2 className="text-md font-black text-slate-800 dark:text-slate-100 tracking-wider">
                        BON CHANGE ZAHIGLACE
                      </h2>
                      <div className="flex items-center justify-center md:justify-end gap-2 mt-1">
                        <span className="text-xs font-black text-slate-500 font-mono">N°</span>
                        <input
                          type="text"
                          required
                          value={bcNumber}
                          onChange={(e) => setBcNumber(e.target.value)}
                          className="w-32 text-center text-xs font-black font-mono px-3 py-1 bg-white dark:bg-slate-950 border-2 border-red-200 dark:border-red-900 text-red-600 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    {/* Left Block Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          Code Client (Gauche) :
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: C4589"
                          value={bcClientCodeLeft}
                          onChange={(e) => setBcClientCodeLeft(e.target.value)}
                          className="w-full text-xs font-bold px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Right Block Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Date :
                          </label>
                          <input
                            type="date"
                            required
                            value={bcDate}
                            onChange={(e) => setBcDate(e.target.value)}
                            className="w-full text-xs font-black font-mono px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Code Client (Droite) :
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: C4589"
                            value={bcClientCodeRight}
                            onChange={(e) => setBcClientCodeRight(e.target.value)}
                            className="w-full text-xs font-bold px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Type Cong N° :
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 12"
                            value={bcCongNumber}
                            onChange={(e) => setBcCongNumber(e.target.value)}
                            className="w-full text-xs font-bold px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Sélecteur Type :
                          </label>
                          <div className="flex gap-2">
                            {['AP', 'AG', 'AS'].map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setBcCongType(type as any)}
                                className={`flex-1 py-2 rounded-xl text-xxs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                  bcCongType === type
                                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Pre-Populated Grid of Products */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          <th className="px-3 py-2.5 w-16 text-center">Qte Pcs</th>
                          <th className="px-3 py-2.5 w-44">Produits</th>
                          
                          {/* EN CARTONS Heading */}
                          <th className="border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center px-4 py-1" colSpan={3}>
                            EN CARTONS
                          </th>

                          {/* EN PIECES Heading */}
                          <th className="border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center px-4 py-1" colSpan={3}>
                            EN PIÈCES
                          </th>

                          <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-2.5 w-24 text-right">M. Global</th>
                        </tr>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                          <th className="px-3 py-1.5 text-center">Preset</th>
                          <th className="px-3 py-1.5">Nom</th>

                          {/* EN CARTONS inner */}
                          <th className="border-l border-slate-200 dark:border-slate-800 px-2 py-1 text-center w-20">Qté</th>
                          <th className="px-2 py-1 text-center w-24">Prix</th>
                          <th className="px-2 py-1 text-right w-24">Montant</th>

                          {/* EN PIECES inner */}
                          <th className="border-l border-slate-200 dark:border-slate-800 px-2 py-1 text-center w-20">Qté</th>
                          <th className="px-2 py-1 text-center w-24">Prix</th>
                          <th className="px-2 py-1 text-right w-24">Montant</th>

                          <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-1.5 text-right">(DH)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {bcItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                            {/* Preset Quantity */}
                            <td className="px-3 py-1 text-center font-black text-slate-400 dark:text-slate-500 font-mono">
                              {item.qtePcsPreset}
                            </td>

                            {/* Product Name */}
                            <td className="px-3 py-1 font-black text-slate-800 dark:text-slate-200">
                              {item.productName}
                            </td>

                            {/* EN CARTONS: Qté */}
                            <td className="border-l border-slate-100 dark:border-slate-850 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={item.cartonsQty || ''}
                                onChange={(e) => handleBcQtyChange(index, 'cartonsQty', e.target.value)}
                                className="w-full text-center font-mono font-black py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:bg-white outline-none"
                              />
                            </td>
                            {/* EN CARTONS: Prix */}
                            <td className="px-2 py-1 text-center text-slate-400 font-mono">
                              {item.prixCartons.toFixed(2)}
                            </td>
                            {/* EN CARTONS: Montant */}
                            <td className="px-2 py-1 text-right font-mono text-slate-500">
                              {item.cartonsMontant > 0 ? `${item.cartonsMontant.toFixed(2)}` : '—'}
                            </td>

                            {/* EN PIÈCES: Qté */}
                            <td className="border-l border-slate-100 dark:border-slate-850 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={item.piecesQty || ''}
                                onChange={(e) => handleBcQtyChange(index, 'piecesQty', e.target.value)}
                                className="w-full text-center font-mono font-black py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:bg-white outline-none"
                              />
                            </td>
                            {/* EN PIÈCES: Prix */}
                            <td className="px-2 py-1 text-center text-slate-400 font-mono">
                              {item.prixPieces.toFixed(2)}
                            </td>
                            {/* EN PIÈCES: Montant */}
                            <td className="px-2 py-1 text-right font-mono text-slate-500">
                              {item.piecesMontant > 0 ? `${item.piecesMontant.toFixed(2)}` : '—'}
                            </td>

                            {/* Row Total */}
                            <td className="border-l border-slate-100 dark:border-slate-850 px-3 py-1 text-right font-mono font-black text-cyan-600 dark:text-cyan-400">
                              {item.monGlo > 0 ? `${item.monGlo.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOTAL SUMMARY DIRHAMS */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-cyan-50 dark:bg-cyan-950/20 rounded-2xl border border-cyan-100 dark:border-cyan-900/50 gap-4">
                  <div className="text-xs font-black text-cyan-800 dark:text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    {lang === 'fr' ? 'MONTANT CHANGE EN DIRHAMS' : 'المبلغ الإجمالي للتغيير بالدرهم (Montant Change)'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-6 py-3 bg-white dark:bg-slate-950 border border-cyan-200 dark:border-cyan-900 rounded-2xl font-mono text-lg font-black text-cyan-700 dark:text-cyan-300 shadow-inner">
                      {calculateBcTotalGlobal().toFixed(2)}
                    </div>
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono">Dhs</span>
                  </div>
                </div>

                {/* Signatures replica block */}
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">
                    SIGNATURES ET EMBALLEMENTS REQUIS (REPLICATION PAPIER)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['CLIENT', 'VENDEUR', 'MAGASIN', 'ADMINISTRATION'].map((sig, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl h-24">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-auto">
                          {sig}
                        </span>
                        <span className="text-[9px] text-slate-300 italic">Signature</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowNewBCForm(false); }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingBC}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-cyan-500/10 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    {isSavingBC ? (lang === 'fr' ? 'Sauvegarde...' : 'جاري الحفظ...') : (lang === 'fr' ? 'Enregistrer & Télécharger PDF' : 'تأكيد وحفظ وتحميل بون PDF')}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      )}

        </div>

      {/* Premium Document Preview Modal Overlay */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-900">
              <div>
                <span className="text-xxs font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                  {previewingDocType === 'bl' && (lang === 'fr' ? 'Bon de Livraison' : 'بون تسليم')}
                  {previewingDocType === 'sr' && (lang === 'fr' ? "Demande d'approvisionnement" : 'طلب تزويد')}
                  {previewingDocType === 'ba' && (lang === 'fr' ? "Bon de Retour (Avoir)" : 'بون إرجاع')}
                  {previewingDocType === 'be' && (lang === 'fr' ? "Bon d'Encaissement" : 'بون قبض')}
                  {previewingDocType === 'bc' && (lang === 'fr' ? "Bon de Change" : 'بون تغيير')}
                </span>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  N° {previewingDoc.noteNumber || previewingDoc.requestNumber || previewingDoc.number}
                </h3>
              </div>
              <button
                onClick={() => { setPreviewingDoc(null); setPreviewingDocType(null); }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 font-bold text-xs text-slate-700 dark:text-slate-300">
              {/* General Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Date' : 'التاريخ'}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-100">{previewingDoc.date}</span>
                </div>
                {previewingDoc.clientName && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Client' : 'الزبون'}</span>
                    <span className="text-slate-800 dark:text-slate-100">{previewingDoc.clientName}</span>
                  </div>
                )}
                {previewingDoc.clientCodeLeft && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Code Client (G/D)' : 'كود الزبون'}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">
                      {previewingDoc.clientCodeLeft} {previewingDoc.clientCodeRight ? `/ ${previewingDoc.clientCodeRight}` : ''}
                    </span>
                  </div>
                )}
                {previewingDoc.agency && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Agence' : 'الوكالة'}</span>
                    <span className="text-slate-800 dark:text-slate-100">{previewingDoc.agency}</span>
                  </div>
                )}
                {previewingDoc.vendeur && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Vendeur / Chauffeur' : 'الموزع / البائع'}</span>
                    <span className="text-slate-800 dark:text-slate-100">{previewingDoc.vendeur}</span>
                  </div>
                )}
                {previewingDoc.sourceStockLocation && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Stock Source' : 'مستودع الصرف'}</span>
                    <span className="text-slate-800 dark:text-slate-100">{previewingDoc.sourceStockLocation}</span>
                  </div>
                )}
                {previewingDoc.congNumber && (
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{lang === 'fr' ? 'Congélateur' : 'رقم الثلاجة'}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{previewingDoc.congNumber} ({previewingDoc.congType})</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {lang === 'fr' ? 'Articles du document' : 'محتويات المستند'}
                </h4>
                <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xxs font-bold">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">{lang === 'fr' ? 'Désignation / Réf' : 'البيان / الرمز'}</th>
                        <th className="px-4 py-2.5 text-center">{lang === 'fr' ? 'Quantité' : 'الكمية'}</th>
                        {previewingDocType !== 'sr' && <th className="px-4 py-2.5 text-right">{lang === 'fr' ? 'Prix Unit.' : 'سعر الوحدة'}</th>}
                        <th className="px-4 py-2.5 text-right">{lang === 'fr' ? 'Total' : 'المجموع'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-700 dark:text-slate-300">
                      {/* Delivery note items */}
                      {previewingDocType === 'bl' && previewingDoc.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-sans">{item.productName}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{item.quantity} Crt</td>
                          <td className="px-4 py-2.5 text-right font-mono">{item.pricePerCarton.toFixed(2)} Dh</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900 dark:text-slate-100">{(item.quantity * item.pricePerCarton).toFixed(2)} Dh</td>
                        </tr>
                      ))}

                      {/* Supply request items */}
                      {previewingDocType === 'sr' && previewingDoc.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-sans">
                            {item.designation} <span className="block text-[10px] text-slate-400 font-normal">Ref: {item.ref}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono">
                            {item.qtyOrdered} Ord / {item.qtyDelivered} Del
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900 dark:text-slate-100">—</td>
                        </tr>
                      ))}

                      {/* Bon d'avoir items */}
                      {previewingDocType === 'ba' && previewingDoc.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-sans">{item.productName}</td>
                          <td className="px-4 py-2.5 text-center font-mono">
                            {item.cartonsQty > 0 ? `${item.cartonsQty} Crt` : ''} {item.piecesQty > 0 ? `${item.piecesQty} Pcs` : ''}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">—</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900 dark:text-slate-100">
                            {item.monGlo.toFixed(2)} Dh
                          </td>
                        </tr>
                      ))}

                      {/* Bon d'encaissement items */}
                      {previewingDocType === 'be' && previewingDoc.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-mono">
                            {item.date} — {item.designation} <span className="block text-[10px] text-slate-400 font-normal">Ref: {item.ref}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono">1</td>
                          <td className="px-4 py-2.5 text-right font-mono">{item.montant.toFixed(2)} Dh</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900 dark:text-slate-100">{item.montant.toFixed(2)} Dh</td>
                        </tr>
                      ))}

                      {/* Bon de change items */}
                      {previewingDocType === 'bc' && previewingDoc.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 font-sans">{item.productName}</td>
                          <td className="px-4 py-2.5 text-center font-mono">
                            {item.cartonsQty > 0 ? `${item.cartonsQty} Crt` : ''} {item.piecesQty > 0 ? `${item.piecesQty} Pcs` : ''}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">—</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900 dark:text-slate-100">
                            {item.monGlo.toFixed(2)} Dh
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total summary info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-sm">
                <span className="font-sans uppercase text-xxs tracking-widest text-slate-400">{lang === 'fr' ? 'Total Document' : 'المجموع الإجمالي'}</span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {previewingDocType === 'bl' && `${previewingDoc.netPayable?.toFixed(2)} Dh`}
                  {previewingDocType === 'sr' && `${previewingDoc.totalGlobalDhs?.toFixed(2) || '0.00'} Dh`}
                  {previewingDocType === 'ba' && `${previewingDoc.montantAvoirDirhams?.toFixed(2)} Dh`}
                  {previewingDocType === 'be' && `${previewingDoc.totalRecu?.toFixed(2)} Dh`}
                  {previewingDocType === 'bc' && `${previewingDoc.montantChangeDirhams?.toFixed(2)} Dh`}
                </span>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => { setPreviewingDoc(null); setPreviewingDocType(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {lang === 'fr' ? 'Fermer' : 'إغلاق'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const doc = previewingDoc;
                  const type = previewingDocType;
                  setPreviewingDoc(null);
                  setPreviewingDocType(null);
                  if (type === 'bl') startEditingBL(doc);
                  if (type === 'sr') startEditingSR(doc);
                  if (type === 'ba') startEditingBA(doc);
                  if (type === 'be') startEditingBE(doc);
                  if (type === 'bc') startEditingBC(doc);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-750 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                {lang === 'fr' ? 'Modifier' : 'تعديل'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (previewingDocType === 'bl') generateBLPdf(previewingDoc, lang);
                  if (previewingDocType === 'sr') generateSupplyRequestPdf(previewingDoc, lang);
                  if (previewingDocType === 'ba') generateBonAvoirPdf(previewingDoc, lang);
                  if (previewingDocType === 'be') generateBonEncaissementPdf(previewingDoc, lang);
                  if (previewingDocType === 'bc') generateBonChangePdf(previewingDoc, lang);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                {lang === 'fr' ? 'Imprimer PDF' : 'طباعة PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
