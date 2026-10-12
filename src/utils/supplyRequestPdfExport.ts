import { jsPDF } from 'jspdf';
import { SupplyRequest } from '../types';

export function generateSupplyRequestPdf(sr: SupplyRequest, lang: 'fr' | 'ar' = 'fr') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryNavy = '#1e293b'; // slate-800
  const accentNavy = '#0f172a'; // slate-900
  const borderGray = '#cbd5e1'; // slate-300
  const lightBg = '#f8fafc'; // slate-50

  // --- Top Banner & Logo ---
  doc.setLineWidth(0.3);
  doc.setDrawColor(15, 23, 42);

  // Logo border bubble
  doc.setFillColor(241, 245, 249);
  doc.ellipse(25, 16, 12, 8, 'F');
  doc.setDrawColor(15, 23, 42);
  doc.ellipse(25, 16, 12, 8, 'D');

  // Logo text "Zahi" and "Glaces"
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ZAHI', 25, 14, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('GLACES', 25, 18, { align: 'center' });

  // Main Header Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("DEMANDE D'APPROVISIONNEMENT", 45, 13);
  doc.text("PRODUIT FINIS", 45, 19);

  // Request Number & Date
  doc.setFontSize(10);
  doc.text(`N° :  ${sr.requestNumber}`, 145, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`DATE : ${sr.date}`, 145, 19);

  // --- Header Form Fields ---
  // Outer rectangle for metadata
  doc.setFillColor(255, 255, 255);
  doc.rect(10, 24, 190, 18, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("AGENCE :", 12, 29);
  doc.setFont('helvetica', 'normal');
  doc.text(sr.agency || '..........................................................', 30, 29);

  doc.setFont('helvetica', 'bold');
  doc.text("CHEF SECTEUR :", 12, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(sr.chefSecteur || '..........................................................', 38, 34);

  doc.setFont('helvetica', 'bold');
  doc.text("MAGASINIER :", 12, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(sr.magasinier || '..........................................................', 34, 39);

  doc.setFont('helvetica', 'bold');
  doc.text("VENDEUR :", 110, 29);
  doc.setFont('helvetica', 'normal');
  doc.text(sr.vendeur || '..........................................................', 130, 29);

  // --- Two-Column Layout for Articles ---
  const tableTopY = 46;
  const col1X = 10;
  const col2X = 108;
  const colWidth = 92;
  const rowHeight = 4.2;

  // Header Heights & Draw
  const drawTableHeader = (x: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(x, tableTopY, colWidth, 5, 'F');
    doc.rect(x, tableTopY, colWidth, 5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    doc.text('REF', x + 1, tableTopY + 3.8);
    doc.text('ARTICLES', x + 11, tableTopY + 3.8);
    doc.text('Qté Cdé', x + 63, tableTopY + 3.8);
    doc.text('Qté Liv', x + 78, tableTopY + 3.8);

    // Inner separators
    doc.line(x + 10, tableTopY, x + 10, tableTopY + 5);
    doc.line(x + 62, tableTopY, x + 62, tableTopY + 5);
    doc.line(x + 77, tableTopY, x + 77, tableTopY + 5);
  };

  drawTableHeader(col1X);
  drawTableHeader(col2X);

  // Split items into 2 collections to match the columns perfectly
  const items = sr.items;
  // Let's divide them: first 37 items in column 1, next 37 items in column 2
  const col1Items = items.filter(it => parseInt(it.ref.replace(/\D/g, '')) <= 37);
  const col2Items = items.filter(it => parseInt(it.ref.replace(/\D/g, '')) > 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);

  // Draw Column 1 Rows
  let currentY = tableTopY + 5;
  col1Items.forEach((item, idx) => {
    // Background alternated colors for spacing read-guide
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(col1X, currentY, colWidth, rowHeight, 'F');
    }
    doc.rect(col1X, currentY, colWidth, rowHeight, 'D');

    // Text
    doc.setFont('helvetica', 'bold');
    doc.text(item.ref, col1X + 1, currentY + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(item.articleName, col1X + 11, currentY + 3);

    // Quantities
    if (item.qtyOrdered > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.qtyOrdered), col1X + 66, currentY + 3, { align: 'center' });
    }
    if (item.qtyDelivered > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.qtyDelivered), col1X + 81, currentY + 3, { align: 'center' });
    }

    // Line dividers
    doc.line(col1X + 10, currentY, col1X + 10, currentY + rowHeight);
    doc.line(col1X + 62, currentY, col1X + 62, currentY + rowHeight);
    doc.line(col1X + 77, currentY, col1X + 77, currentY + rowHeight);

    currentY += rowHeight;
  });

  // Draw Column 2 Rows
  let currentCol2Y = tableTopY + 5;
  col2Items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(col2X, currentCol2Y, colWidth, rowHeight, 'F');
    }
    doc.rect(col2X, currentCol2Y, colWidth, rowHeight, 'D');

    // Text
    doc.setFont('helvetica', 'bold');
    doc.text(item.ref, col2X + 1, currentCol2Y + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(item.articleName, col2X + 11, currentCol2Y + 3);

    // Quantities
    if (item.qtyOrdered > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.qtyOrdered), col2X + 66, currentCol2Y + 3, { align: 'center' });
    }
    if (item.qtyDelivered > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.qtyDelivered), col2X + 81, currentCol2Y + 3, { align: 'center' });
    }

    // Line dividers
    doc.line(col2X + 10, currentCol2Y, col2X + 10, currentCol2Y + rowHeight);
    doc.line(col2X + 62, currentCol2Y, col2X + 62, currentCol2Y + rowHeight);
    doc.line(col2X + 77, currentCol2Y, col2X + 77, currentCol2Y + rowHeight);

    currentCol2Y += rowHeight;
  });

  // Align table borders bottom
  const maxTableY = Math.max(currentY, currentCol2Y);

  // --- Total Global Box ---
  let footerY = maxTableY + 4;
  doc.rect(10, footerY, 190, 6, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL GLOBAL :', 12, footerY + 4);
  
  if (sr.totalGlobalDhs) {
    doc.text(`${sr.totalGlobalDhs.toFixed(2)} Dhs`, 198, footerY + 4, { align: 'right' });
  } else {
    doc.text('................................................................................ Dhs', 100, footerY + 4);
  }

  // --- Visa Boxes (Footer) ---
  const visaY = footerY + 9;
  const visaWidth = 36;
  const visaHeight = 12;

  const drawVisaBox = (x: number, title: string) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(x, visaY, visaWidth, visaHeight, 'D');
    doc.setFillColor(241, 245, 249);
    doc.rect(x, visaY, visaWidth, 3.5, 'F');
    doc.rect(x, visaY, visaWidth, 3.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + (visaWidth / 2), visaY + 2.5, { align: 'center' });
  };

  drawVisaBox(10, 'VISA DIRECTION');
  drawVisaBox(48, 'VISA CONTRÔLE');
  drawVisaBox(86, 'VISA MAGASINIER');
  drawVisaBox(124, 'VISE CHEF SECTEUR');
  drawVisaBox(162, 'VISA VENDEUR');

  // --- Save File ---
  doc.save(`Demande_Approvisionnement_${sr.requestNumber}.pdf`);
}
