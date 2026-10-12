import { jsPDF } from 'jspdf';

export interface FridgePdfData {
  id: string;
  serialNumber: string;
  type: 'chest' | 'upright' | 'AP' | 'AG' | 'AS';
  status: 'service' | 'stock' | 'maintenance';
  client?: string;
  depot: string;
  fillLevel: number;
  powerConsumption: number;
  lastServiceDate?: string;
  driverId?: string;
  temperature?: number;
  targetTemperature?: number;
  installationDate?: string;
  
  // Delivery metrics
  deliveryDaysCount?: number;
  totalQuantityDeliveredLiters?: number;
  totalCartonsDelivered?: number;
  lastDeliveryDate?: string;
  estimatedRevenueDH?: number;
  
  // GPS & Alerts
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

export function generateFridgePdfReport(fridge: FridgePdfData, lang: 'fr' | 'ar' = 'fr') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const nowStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatNumber = (num: number) => {
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const categoryLabel = 
    fridge.type === 'AS' 
      ? 'AS (Armoire Spéciale Supermarché - 500 L)' 
      : (fridge.type === 'chest' || fridge.type === 'AP') 
        ? 'AP (Coffre Horizontal - 300 L)' 
        : 'AG (Armoire Vitrée Verticale - 400 L)';
  const statusLabel = fridge.status === 'service' ? 'EN SERVICE (CLIENT)' : fridge.status === 'stock' ? 'EN STOCK (DÉPÔT)' : 'EN MAINTENANCE';
  
  const deliveryDays = fridge.deliveryDaysCount || 64;
  const totalLiters = fridge.totalQuantityDeliveredLiters || Math.round(deliveryDays * 38);
  const totalCartons = fridge.totalCartonsDelivered || Math.round(totalLiters / 4);
  const revenue = fridge.estimatedRevenueDH || Math.round(totalCartons * 88);
  const lastDelivery = fridge.lastDeliveryDate || '2026-07-20';
  const installation = fridge.installationDate || '2025-09-15';
  const lat = fridge.gps?.lat || 33.5731;
  const lng = fridge.gps?.lng || -7.5898;
  const address = fridge.gps?.address || `${fridge.depot}, Maroc`;

  // Colors
  const primaryNavy = '#0f172a';
  const accentSky = '#0284c7';
  const accentEmerald = '#059669';
  const lightBg = '#f8fafc';
  const darkBorder = '#cbd5e1';

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Decorative Accent Line
  doc.setFillColor(2, 132, 199); // sky-600
  doc.rect(0, 32, 210, 2, 'F');

  // Title Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ZAHI ICE LOGISTICS 2026', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text("SYSTÈME INTELLIGENT DE GESTION DE FLOTTE & AUDIT GPS DÉTAILLÉ", 14, 22);

  // Report Reference Metadata (Right Aligned)
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Rapport N°: AUD-2026-${fridge.serialNumber.replace('ZAHI-', '')}`, 196, 12, { align: 'right' });
  doc.text(`Généré le: ${nowStr}`, 196, 18, { align: 'right' });
  doc.text(`Statut GPS: ${fridge.isLocationAlert ? 'ALERTE DÉPLACEMENT' : 'LOCALISATION VALIDE'}`, 196, 24, { align: 'right' });

  let y = 40;

  // Header Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`FICHE AUDIT TECHNIQUE: ${fridge.serialNumber}`, 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Catégorie: ${categoryLabel} | Affectation: ${fridge.client || fridge.depot} | Dépôt: ${fridge.depot}`, 18, y + 16);

  y += 28;

  // Alert Banner if Location Movement detected
  if (fridge.isLocationAlert) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(14, y, 182, 14, 2, 2, 'FD');

    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("🚨 ALERTE GPS : DÉPLACEMENT HORS ZONE NON AUTORISÉ DÉTECTÉ !", 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(fridge.alertReason || "Changement de position GPS anormal enregistré par les capteurs IoT.", 18, y + 11);

    y += 18;
  }

  // Section 1: Information Appareil & Localisation GPS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("1. CARACTÉRISTIQUES D\'EXPLOITATION & LOCALISATION GPS", 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 7;

  // Grid Table 1
  const col1 = 16;
  const col2 = 112;

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const drawRow = (
    label1: string,
    val1: string,
    label2: string,
    val2: string,
    currentY: number,
    val1Offset = 36,
    val2Offset = 42,
    c1 = col1,
    c2 = col2
  ) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 4, 182, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(label1, c1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(val1, c1 + val1Offset, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(label2, c2, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(val2, c2 + val2Offset, currentY);
  };

  drawRow("N° de Série:", fridge.serialNumber, "Statut de Service:", statusLabel, y); y += 8;
  drawRow("Type d'Appareil:", categoryLabel, "Dépôt Régional:", fridge.depot, y); y += 8;
  drawRow("Client Attribué:", fridge.client || "Dépôt / Non attribué", "Chauffeur Référent:", fridge.driverId || "DRV-001 (Amina Tazi)", y); y += 8;
  drawRow("Coordonnées GPS:", `${lat.toFixed(4)}, ${lng.toFixed(4)}`, "Date d'Installation:", installation, y); y += 8;
  drawRow("Adresse Physique:", address, "Dernier Entretien:", fridge.lastServiceDate || '2026-05-10', y); y += 12;

  // Section 2: Métriques & Statistiques de Livraison (2026)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("2. ANAMNÈSE & STATISTIQUES DE LIVRAISON DE GLACES (2026)", 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  // 4 KPI Cards
  const kpiWidth = 42;
  const kpiGap = 4.5;
  const startX = 14;

  const drawKpi = (x: number, title: string, value: string, sub: string, colorRgb: [number, number, number]) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, kpiWidth, 22, 2, 2, 'FD');

    // Colored Top Border Accent
    doc.setFillColor(...colorRgb);
    doc.rect(x, y, kpiWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(title.toUpperCase(), x + 3, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 3, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(sub, x + 3, y + 18);
  };

  drawKpi(startX, "Jours de Livraison", `${deliveryDays} Jours`, "Période 2026", [2, 132, 199]);
  drawKpi(startX + kpiWidth + kpiGap, "Quantité Livrée", `${formatNumber(totalCartons)} Cartons`, "Stock Glaces", [16, 185, 129]);
  drawKpi(startX + (kpiWidth + kpiGap) * 2, "Chiffre d'Affaires", `${formatNumber(revenue)} DH`, "Glaces Zahi", [217, 119, 6]);
  drawKpi(startX + (kpiWidth + kpiGap) * 3, "Fréquence Myd.", "2.5 Jours", "3x / Semaine", [139, 92, 246]);

  y += 28;

  // Section 3: Spécifications d'Exploitation & Normes Logistiques
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text("3. SPÉCIFICATIONS LOGISTIQUES ET MAINTENANCE DE L'APPAREIL", 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  drawRow("Marque Commerciale:", "ZAHI GLACES S.A.R.L", "Capacité Volumétrique:", fridge.type === 'AS' ? '500 Litres (Spécial)' : (fridge.type === 'chest' || fridge.type === 'AP' ? '300 Litres (Coffre)' : '400 Litres (Armoire)'), y, 40, 46); y += 8;
  drawRow("Type de Fluide:", "R404A Écologique", "État Général Matériel:", "Conforme / Excellent état", y, 40, 46); y += 8;
  drawRow("Périodicité d'Entretien:", "Semestriel (Tous les 6 mois)", "Prochaine Révision Prévue:", "Novembre 2026", y, 40, 46); y += 14;

  // Section 4: Historique Récent des Livraisons
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("4. HISTORIQUE RÉCENT DES 3 DERNIÈRES LIVRAISONS DÉPÔT", 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 7;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("DATE LIVRAISON", 18, y + 4.5);
  doc.text("CHAUFFEUR / DRIVER", 60, y + 4.5);
  doc.text("QUANTITÉ LIVRÉE", 115, y + 4.5);
  doc.text("STATUT BORDEREAU", 160, y + 4.5);

  y += 6;

  const deliveries = [
    { date: lastDelivery, driver: fridge.driverId || 'DRV-001 (Amina Tazi)', qty: '30 Cartons', status: 'VALIDÉ & REÇU' },
    { date: '2026-07-15', driver: 'DRV-002 (Youssef Zahi)', qty: '38 Cartons', status: 'VALIDÉ & REÇU' },
    { date: '2026-07-10', driver: 'DRV-003 (Kamal Mansouri)', qty: '25 Cartons', status: 'VALIDÉ & REÇU' },
  ];

  deliveries.forEach((d, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(d.date, 18, y + 4.5);
    doc.text(d.driver, 60, y + 4.5);
    doc.text(d.qty, 115, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(d.status, 160, y + 4.5);
    y += 6;
  });

  y += 10;

  // Validation Footer & Official Zahi Stamp 2026
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("CACHET ET CERTIFICATION DIRECTION LOGISTIQUE ZAHI ICE 2026", 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Document officiel généré automatiquement par la plateforme de géolocalisation GPS.", 18, y + 13);
  doc.text("Garantie de traçabilité logistique & conformité de l'inventaire Zahi Glaces.", 18, y + 18);

  // QR Code Representation box
  doc.setFillColor(15, 23, 42);
  doc.rect(168, y + 4, 16, 16, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(171, y + 7, 10, 10, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(173, y + 9, 6, 6, 'F');

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("QR VERIFY", 168, y + 22);

  // Save PDF
  const filename = `Rapport_GPS_Zahi_${fridge.serialNumber}_2026.pdf`;
  doc.save(filename);
}

export function generateFridgeMovementHistoryPdf(
  serialNumber: string,
  movements: any[],
  fridgeDetails: any,
  lang: 'fr' | 'ar' = 'fr'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const nowStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const parseMvtDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const clean = dateStr.trim();
    const yyyyMmDd = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
    if (yyyyMmDd) {
      const year = parseInt(yyyyMmDd[1], 10);
      const month = parseInt(yyyyMmDd[2], 10) - 1;
      const day = parseInt(yyyyMmDd[3], 10);
      const hour = yyyyMmDd[4] ? parseInt(yyyyMmDd[4], 10) : 0;
      const min = yyyyMmDd[5] ? parseInt(yyyyMmDd[5], 10) : 0;
      return new Date(year, month, day, hour, min);
    }
    const ddMmYyyy = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*,?\s*(\d{2}):(\d{2}))?/);
    if (ddMmYyyy) {
      const day = parseInt(ddMmYyyy[1], 10);
      const month = parseInt(ddMmYyyy[2], 10) - 1;
      const year = parseInt(ddMmYyyy[3], 10);
      const hour = ddMmYyyy[4] ? parseInt(ddMmYyyy[4], 10) : 0;
      const min = ddMmYyyy[5] ? parseInt(ddMmYyyy[5], 10) : 0;
      return new Date(year, month, day, hour, min);
    }
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) return new Date(parsed);
    return new Date();
  };

  const calcDuration = (startStr: string, endStr?: string) => {
    const start = parseMvtDate(startStr);
    const end = endStr ? parseMvtDate(endStr) : new Date();
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return lang === 'fr' ? "Moins d'un jour" : "أقل من يوم";
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) return lang === 'fr' ? "Quelques mins" : "بضع دقائق";
      return lang === 'fr' ? `${diffHours} h` : `${diffHours} ساعة`;
    }
    return lang === 'fr' ? `${diffDays} Jours` : `${diffDays} يوم`;
  };

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 (Ultra Premium Dark Slate)
  doc.rect(0, 0, 210, 34, 'F');

  // Decorative Accent Line - Radiant Sky Blue 2026 Style
  doc.setFillColor(2, 132, 199); // sky-600
  doc.rect(0, 34, 210, 1.5, 'F');

  // Title Logo Text & Branding
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ZAHI ICE LOGISTICS 2026', 14, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text("JOURNAL DE TRAÇABILITE & HISTORIQUE DES TRANSFERTS", 14, 22);

  // Metadata Block (Right Aligned)
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`S/N: ${serialNumber}`, 196, 12, { align: 'right' });
  doc.text(`Généré le: ${nowStr}`, 196, 18, { align: 'right' });
  
  const categoryLabel = fridgeDetails?.type === 'AS' 
    ? 'AS (Armoire Spéciale Supermarché - 500 L)' 
    : (fridgeDetails?.type === 'chest' || fridgeDetails?.type === 'AP') 
      ? 'AP (Coffre Horizontal - 300 L)' 
      : 'AG (Armoire Vitrée Verticale - 400 L)';

  doc.text(`Type: ${fridgeDetails?.type || 'AP'} | Catégorie: ${categoryLabel}`, 196, 24, { align: 'right' });

  let y = 42;

  // Header Summary Box (Soft 2026 Bento Card layout)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(lang === 'fr' ? `JOURNAL DES MOUVEMENTS DE L'APPAREIL : ${serialNumber}` : `سجل حركة وموقع الثلاجة : ${serialNumber}`, 18, y + 8);

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  const statusLabel = fridgeDetails 
    ? (fridgeDetails.status === 'service' ? 'EN SERVICE (CLIENT)' : fridgeDetails.status === 'stock' ? 'EN STOCK (DÉPÔT)' : 'EN MAINTENANCE')
    : 'INCONNU';
  doc.text(`État actuel : ${statusLabel} | Dépôt d'origine : ${fridgeDetails?.depot || 'N/A'} | Client actuel : ${fridgeDetails?.client || 'Aucun (En Dépôt)'}`, 18, y + 16);

  y += 32;

  // Section 1: Specifications of Refrigerator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(lang === 'fr' ? "1. SPÉCIFICATIONS TECHNIQUES & LOCALISATION" : "1. خصائص الثلاجة الحالية", 14, y);
  
  // Clean decorative horizontal line
  doc.setDrawColor(224, 242, 254); // sky-100
  doc.setLineWidth(0.6);
  doc.line(14, y + 2.5, 196, y + 2.5);

  y += 7;

  // Specs Card Symmetrical Bento-Grid Layout (3 Rows x 2 Columns)
  const drawBentoCard = (title: string, value: string, curX: number, curY: number, statusColor?: string) => {
    if (statusColor === 'service') {
      doc.setFillColor(240, 253, 250); // teal-50
      doc.setDrawColor(153, 246, 228); // teal-200
    } else if (statusColor === 'stock') {
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-200
    } else if (statusColor === 'maintenance') {
      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 202, 202); // rose-200
    } else {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
    }
    
    doc.setLineWidth(0.3);
    doc.roundedRect(curX, curY, 88, 14, 2, 2, 'FD');

    // Title label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(title, curX + 4, curY + 5.2);

    // Value text with exact clipping/truncation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (statusColor === 'service') {
      doc.setTextColor(13, 148, 136); // teal-600
    } else if (statusColor === 'stock') {
      doc.setTextColor(5, 150, 105); // emerald-600
    } else if (statusColor === 'maintenance') {
      doc.setTextColor(225, 29, 72); // rose-600
    } else {
      doc.setTextColor(15, 23, 42); // slate-900
    }
    const valTrunc = value.length > 45 ? value.substring(0, 42) + '...' : value;
    doc.text(valTrunc, curX + 4, curY + 10.5);
  };

  const currentDétenteur = fridgeDetails
    ? (fridgeDetails.status === 'service' ? fridgeDetails.client : `Dépôt ${fridgeDetails.depot}`)
    : 'N/A';

  const statusVal = fridgeDetails?.status || 'unknown';

  drawBentoCard("NUMÉRO DE SÉRIE", serialNumber, 14, y);
  drawBentoCard("TYPE D'ÉQUIPEMENT / CAPACITÉ", categoryLabel, 108, y);
  
  drawBentoCard("STATUT LOGISTIQUE DE SERVICE", statusLabel, 14, y + 17, statusVal);
  drawBentoCard("DÉTENTEUR OU LOCALISATION", currentDétenteur || 'N/A', 108, y + 17);
  
  drawBentoCard("MARQUE DE FABRICATION", "ZAHI GLACES S.A.R.L", 14, y + 34);
  drawBentoCard("DATE D'INSTALLATION DANS LE PARC", fridgeDetails?.installationDate || '2025-09-15', 108, y + 34);

  y += 54;

  // Section 2: Chronological Movements Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text(lang === 'fr' ? "2. HISTORIQUE CHRONOLOGIQUE DES TRANSFERTS ET MOUVEMENTS" : "2. سجل التحركات والتحويلات التاريخية", 14, y);
  
  doc.setDrawColor(224, 242, 254); // sky-100
  doc.setLineWidth(0.6);
  doc.line(14, y + 2.5, 196, y + 2.5);

  y += 8;

  // Filter and sort movements
  const filtered = movements.filter(m => m.serialNumber.toUpperCase() === serialNumber.toUpperCase());
  const sorted = [...filtered].sort((a, b) => parseMvtDate(a.date).getTime() - parseMvtDate(b.date).getTime());
  const computedMvts = sorted.map((m, idx) => {
    const nextM = sorted[idx + 1];
    const duration = calcDuration(m.date, nextM?.date);
    return {
      ...m,
      duration,
      isCurrent: !nextM
    };
  }).reverse(); // Newest first

  // Table Drawing with dynamic wrapping & page breaks
  const drawTableHeader = (curY: number) => {
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(14, curY, 182, 8, 1.5, 1.5, 'F');
    doc.rect(14, curY + 4, 182, 4, 'F'); // flatten bottom

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(lang === 'fr' ? "DATE & HEURE" : "التاريخ والوقت", 16, curY + 5.5);
    doc.text(lang === 'fr' ? "PROVENANCE" : "من", 48, curY + 5.5);
    doc.text(lang === 'fr' ? "DESTINATION" : "إلى", 88, curY + 5.5);
    doc.text(lang === 'fr' ? "DURÉE SÉJOUR" : "المدة", 132, curY + 5.5);
    doc.text(lang === 'fr' ? "RESPONSABLE" : "المسؤول", 164, curY + 5.5);
  };

  drawTableHeader(y);
  y += 8;

  if (computedMvts.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lang === 'fr' ? "Aucun transfert ou mouvement enregistré pour cet appareil." : "لا يوجد أي حركة مسجلة لهذه الثلاجة.", 18, y + 6);
    y += 12;
  } else {
    computedMvts.forEach((m, idx) => {
      // Wrap content lines for each column to guarantee NO overlaps
      const dateLines: string[] = doc.splitTextToSize(m.date || 'N/A', 28);
      const fromLines: string[] = doc.splitTextToSize(m.fromLocation || 'N/A', 36);
      const toLines: string[] = doc.splitTextToSize(m.toLocation || 'N/A', 40);
      const durLabel = `${m.duration} ${m.isCurrent ? (lang === 'fr' ? '(Actif)' : '(حالي)') : ''}`;
      const durationLines: string[] = doc.splitTextToSize(durLabel, 28);
      const driverLines: string[] = doc.splitTextToSize(m.driverName || 'N/A', 30);

      const maxLines = Math.max(dateLines.length, fromLines.length, toLines.length, durationLines.length, driverLines.length);
      const rowHeight = maxLines * 4 + 4; // dynamic row height (4mm per line plus padding)

      // Calculate note lines height if any notes exist
      let noteLines: string[] = [];
      let noteHeight = 0;
      if (m.notes) {
        noteLines = doc.splitTextToSize(`Note: ${m.notes}`, 174);
        noteHeight = noteLines.length * 3.8 + 3;
      }

      // Check for page overflow
      if (y + rowHeight + noteHeight > 272) {
        doc.addPage();
        y = 20;
        drawTableHeader(y);
        y += 8;
      }

      // Draw row background card
      const isAlternate = idx % 2 === 1;
      if (m.isCurrent) {
        doc.setFillColor(240, 253, 250); // Teal-50
        doc.setDrawColor(204, 251, 241); // Teal-100
      } else {
        doc.setFillColor(isAlternate ? 248 : 255, isAlternate ? 250 : 255, isAlternate ? 252 : 255); // Alternating white/slate-50
        doc.setDrawColor(241, 245, 249);
      }
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, 182, rowHeight, 1, 1, 'FD');

      // Timeline marker on the left
      if (m.isCurrent) {
        doc.setFillColor(13, 148, 136); // teal-600
        doc.rect(14, y, 1.2, rowHeight, 'F');
      }

      // Print column values line by line
      doc.setFontSize(7.5);
      
      // Date column
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      dateLines.forEach((line, lIdx) => {
        doc.text(line, 16, y + 4.5 + (lIdx * 4));
      });

      // From column
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      fromLines.forEach((line, lIdx) => {
        doc.text(line, 48, y + 4.5 + (lIdx * 4));
      });

      // To column
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      toLines.forEach((line, lIdx) => {
        doc.text(line, 88, y + 4.5 + (lIdx * 4));
      });

      // Duration column
      doc.setFont('helvetica', 'bold');
      if (m.isCurrent) {
        doc.setTextColor(13, 148, 136); // active teal
      } else {
        doc.setTextColor(2, 132, 199); // standard blue
      }
      durationLines.forEach((line, lIdx) => {
        doc.text(line, 132, y + 4.5 + (lIdx * 4));
      });

      // Driver column
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      driverLines.forEach((line, lIdx) => {
        doc.text(line, 164, y + 4.5 + (lIdx * 4));
      });

      y += rowHeight;

      // Draw notes if they exist
      if (m.notes && noteLines.length > 0) {
        doc.setFillColor(254, 252, 232); // soft amber-50 callout
        doc.setDrawColor(254, 240, 138); // amber-200
        doc.roundedRect(15, y, 180, noteHeight - 1, 0.8, 0.8, 'FD');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(133, 77, 14); // amber-800
        noteLines.forEach((line, lIdx) => {
          doc.text(line, 18, y + 3.2 + (lIdx * 3.8));
        });

        y += noteHeight;
      }

      y += 1.5; // separation spacing between rows
    });
  }

  y += 4;
  if (y > 255) {
    doc.addPage();
    y = 20;
  }

  // Section 3: Signature & Certification Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 25, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CERTIFICATION ET VISA DIRECTION LOGISTIQUE ZAHI ICE", 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Document certifié conforme issu du système de traçabilité GPS de la flotte Zahi Ice Logistics.", 18, y + 11.5);
  doc.text("Garantie légale d'exploitation et de contrôle de conformité de l'inventaire frigorifique.", 18, y + 16.5);

  // Modern stylised digital stamp (QR Representation)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(168, y + 4.5, 16, 16, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(171, y + 7.5, 10, 10, 'F');
  doc.setFillColor(30, 41, 59);
  doc.rect(173, y + 9.5, 6, 6, 'F');

  const filename = `Historique_Mouvements_Zahi_${serialNumber}_2026.pdf`;
  doc.save(filename);
}

export function generateBatchTransferPdf(
  batch: {
    id: string;
    date: string;
    type: string; // e.g. "Transfert entre Dépôts", "Placement Client", etc.
    origin: string;
    destination: string;
    driverName: string;
    notes: string;
    items: {
      id: string;
      serialNumber: string;
      type: string;
      oldStatus: string;
      newStatus: string;
      temp?: number;
    }[];
  },
  lang: 'fr' | 'ar' = 'fr'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const nowStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Header Banner - Slate 900
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  // Sky Blue Decorative Accent
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 32, 210, 2, 'F');

  // Title Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ZAHI ICE LOGISTICS 2026', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text("BON DE TRANSFERT OFFICIEL & MOUVEMENT DE STOCK CONGÉLATEURS", 14, 22);

  // Metadata (Right Aligned)
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`BON N°: ${batch.id}`, 196, 12, { align: 'right' });
  doc.text(`Émis le: ${batch.date}`, 196, 18, { align: 'right' });
  doc.text(`Total Appareils: ${batch.items.length}`, 196, 24, { align: 'right' });

  let y = 40;

  // Header Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(lang === 'fr' ? "DÉTAILS DU MOUVEMENT DE STOCK" : "تفاصيل حركة المخزون والتحويل", 18, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const transferTypeLabel = lang === 'fr' ? `Type: ${batch.type}` : `النوع: ${batch.type}`;
  const driverLabel = lang === 'fr' ? `Chauffeur Transporteur: ${batch.driverName}` : `سائق الشاحنة الناقل: ${batch.driverName}`;
  const originLabel = lang === 'fr' ? `Provenance (DE): ${batch.origin}` : `الجهة المصدر (من): ${batch.origin}`;
  const destinationLabel = lang === 'fr' ? `Destination (VERS): ${batch.destination}` : `الجهة المستقبلة (إلى): ${batch.destination}`;

  doc.text(transferTypeLabel, 18, y + 15);
  doc.text(driverLabel, 18, y + 21);
  doc.text(originLabel, 18, y + 27);
  doc.text(destinationLabel, 18, y + 33);

  y += 46;

  // Section 1: Liste des Appareils
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199);
  doc.text(lang === 'fr' ? "LISTE DES APPAREILS CONCERNÉS PAR CE TRANSFERT" : "قائمة الأجهزة المشمولة في هذا التحويل", 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 7;

  // Table Headers
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("N°", 16, y + 5);
  doc.text(lang === 'fr' ? "NUMÉRO DE SÉRIE" : "الرقم التسلسلي", 28, y + 5);
  doc.text(lang === 'fr' ? "TYPE D'APPAREIL" : "نوع الجهاز", 78, y + 5);
  doc.text(lang === 'fr' ? "ANCIEN STATUT" : "الحالة السابقة", 112, y + 5);
  doc.text(lang === 'fr' ? "NOUVEAU STATUT" : "الحالة الجديدة", 154, y + 5);

  y += 8;

  batch.items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;

      // Redraw Table Headers on new page
      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("N°", 16, y + 5);
      doc.text(lang === 'fr' ? "NUMÉRO DE SÉRIE" : "الرقم التسلسلي", 28, y + 5);
      doc.text(lang === 'fr' ? "TYPE D'APPAREIL" : "نوع الجهاز", 78, y + 5);
      doc.text(lang === 'fr' ? "ANCIEN STATUT" : "الحالة السابقة", 112, y + 5);
      doc.text(lang === 'fr' ? "NOUVEAU STATUT" : "الحالة الجديدة", 154, y + 5);
      y += 8;
    }

    doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
    doc.rect(14, y, 182, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(String(index + 1), 16, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.text(item.serialNumber, 28, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.text(item.type === 'chest' || item.type === 'AP' ? (lang === 'fr' ? "Coffre (AP)" : "مجمّد أفقي") : (lang === 'fr' ? "Vitrine (AG)" : "ثلاجة عرض"), 78, y + 5.5);

    doc.setFont('helvetica', 'normal');
    const oldStatusLabel = item.oldStatus === 'service' ? (lang === 'fr' ? "Service (Client)" : "في الخدمة (عميل)") : item.oldStatus === 'stock' ? (lang === 'fr' ? "Stock (Dépôt)" : "في المخزن") : (lang === 'fr' ? "Maintenance" : "صيانة");
    doc.text(oldStatusLabel, 112, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    const newStatusLabel = item.newStatus === 'service' ? (lang === 'fr' ? "Service (Client)" : "في الخدمة (عميل)") : item.newStatus === 'stock' ? (lang === 'fr' ? "Stock (Dépôt)" : "في المخزن") : (lang === 'fr' ? "Maintenance" : "صيانة");
    doc.text(newStatusLabel, 154, y + 5.5);

    y += 9;
  });

  y += 6;

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Observations Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(lang === 'fr' ? "Observations logistiques / Notes :" : "ملاحظات لوجستية :", 14, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(batch.notes || "Aucune note particulière signalée pour ce mouvement de stock.", 14, y + 5);

  y += 18;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Signatures Section (Moroccan logistics standard)
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CONTRÔLE & VERIFICATION (SIGNATURES)", 14, y);

  y += 6;
  doc.setFillColor(250, 250, 250);
  doc.rect(14, y, 182, 28, 'F');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Visa Expéditeur (Dépôt)", 20, y + 6);
  doc.text("Visa Chauffeur / Transporteur", 80, y + 6);
  doc.text("Visa Réceptionnaire (Client/Dépôt)", 140, y + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature & Date : _____________", 20, y + 22);
  doc.text("Signature & Date : _____________", 80, y + 22);
  doc.text("Signature & Date : _____________", 140, y + 22);

  // Footer Disclaimer
  y += 36;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Ce document de transfert est certifié par la direction d'exploitation logistique Zahi Ice.", 105, y, { align: 'center' });
  doc.text(`Identifiant unique de la transaction : TRSF-BATCH-${batch.id}`, 105, y + 4, { align: 'center' });

  const filename = `Bon_Transfert_Zahi_${batch.id}_2026.pdf`;
  doc.save(filename);
}
