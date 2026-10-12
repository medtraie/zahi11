import { jsPDF } from 'jspdf';
import { DeliveryNote } from '../types';

export function generateBLPdf(bl: DeliveryNote, lang: 'fr' | 'ar' = 'fr') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryNavy = '#0f172a';
  const accentSky = '#0284c7';
  const lightBg = '#f8fafc';
  const darkBorder = '#cbd5e1';

  // --- Header Section ---
  // Top Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  // Colored accent line
  doc.setFillColor(2, 132, 199); // sky-600
  doc.rect(0, 30, 210, 1.5, 'F');

  // Title logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ZAHI LOGISTICS & ICE S.A.R.L.', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text("ZONE INDUSTRIELLE DE PRODUCTION - MAROC", 14, 20);

  // Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BON DE LIVRAISON', 140, 14, { align: 'left' });

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`N°: ${bl.noteNumber}`, 140, 22);

  // --- Metadata Information Panel ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(14, 38, 182, 34, 'F');
  doc.setDrawColor(226, 232, 240); // border slate-200
  doc.rect(14, 38, 182, 34, 'D');

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Column 1
  doc.text('CLIENT / CODE :', 18, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bl.clientName} (${bl.clientCode})`, 50, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE DU BON :', 18, 51);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bl.date}`, 50, 51);

  doc.setFont('helvetica', 'bold');
  doc.text('CONGÉLATEUR INFOS :', 18, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${bl.congNumber} (Modèle: ${bl.congType})`, 50, 58);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('STOCK EXPÉDITEUR :', 120, 44);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bl.sourceStockLocation}`, 155, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUT :', 120, 51);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('LIVRÉ & SÉCURISÉ', 155, 51);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ÉMIS LE :', 120, 58);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(`${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 155, 58);

  // --- Products Table ---
  const tableTopY = 80;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, tableTopY, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text('N°', 17, tableTopY + 5.5);
  doc.text('DÉSIGNATION DU PRODUIT', 30, tableTopY + 5.5);
  doc.text('PCS/CTN', 105, tableTopY + 5.5, { align: 'center' });
  doc.text('PRIX CTN (DH)', 132, tableTopY + 5.5, { align: 'center' });
  doc.text('QTÉ (CTN)', 160, tableTopY + 5.5, { align: 'center' });
  doc.text('MONTANT (DH)', 185, tableTopY + 5.5, { align: 'center' });

  // Draw Items rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  let currentY = tableTopY + 8;
  const rowHeight = 7.5;

  bl.items.forEach((item, index) => {
    // Zebra background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, currentY, 182, rowHeight, 'F');
    }

    // Border line bottom
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(14, currentY + rowHeight, 196, currentY + rowHeight);

    doc.text(String(index + 1), 17, currentY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(item.productName, 30, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.pcsPerCarton), 105, currentY + 5, { align: 'center' });
    doc.text(`${item.pricePerCarton.toFixed(2)}`, 132, currentY + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(item.quantity), 160, currentY + 5, { align: 'center' });
    doc.text(`${item.montant.toFixed(2)} DH`, 185, currentY + 5, { align: 'center' });

    currentY += rowHeight;
  });

  // Draw border around table content
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(14, tableTopY, 182, currentY - tableTopY, 'D');

  // --- Financial Summary Box ---
  currentY += 6;

  // Render a clean right-aligned totals panel
  const totalBoxX = 120;
  doc.setFillColor(248, 250, 252);
  doc.rect(totalBoxX, currentY, 76, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(totalBoxX, currentY, 76, 28, 'D');

  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text('TOTAL BRUT :', totalBoxX + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bl.totalAmount.toFixed(2)} DH`, 190, currentY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('REMISE ACCORDÉE :', totalBoxX + 4, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`-${bl.discount.toFixed(2)} DH`, 190, currentY + 14, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(totalBoxX + 4, currentY + 18, 190, currentY + 18);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('NET À PAYER :', totalBoxX + 4, currentY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`${bl.netPayable.toFixed(2)} DH`, 190, currentY + 23, { align: 'right' });

  // --- Signatures Section ---
  currentY += 34;
  if (currentY > 260) {
    // Add page if signatures don't fit
    doc.addPage();
    currentY = 40;
  }

  // Signature Block 1: Client
  doc.setFillColor(250, 250, 250);
  doc.rect(14, currentY, 84, 30, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, currentY, 84, 30, 'D');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CACHET & SIGNATURE CLIENT', 18, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Saisir mention "Reçu conforme")', 18, currentY + 26);

  // Signature Block 2: Driver / Usine
  doc.setFillColor(250, 250, 250);
  doc.rect(112, currentY, 84, 30, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(112, currentY, 84, 30, 'D');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("SIGNATURE RESPONSABLE D'USINE / LIVREUR", 116, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certifié par Zahi Ice Logistics S.A.R.L.`, 116, currentY + 26);

  // --- Save File ---
  doc.save(`BL_${bl.noteNumber}_${bl.clientName.replace(/\s+/g, '_')}.pdf`);
}
