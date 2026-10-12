import { jsPDF } from 'jspdf';
import { BonAvoir } from '../types';

export function generateBonAvoirPdf(ba: BonAvoir, lang: 'fr' | 'ar' = 'fr') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const borderBlack = '#0f172a'; // slate-900 or black for printing look
  const lightBg = '#f1f5f9'; // slate-100

  // Line Width default
  doc.setLineWidth(0.25);
  doc.setDrawColor(15, 23, 42);

  // --- Top Banner & Logo ---
  // Logo border bubble
  doc.setFillColor(241, 245, 249);
  doc.ellipse(25, 16, 12, 8, 'F');
  doc.ellipse(25, 16, 12, 8, 'D');

  // Logo text "Zahi" and "Glaces"
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ZAHI', 25, 14, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('GLACES', 25, 18, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("BON AVOIR ZAHIGLACE", 42, 16);

  // Number
  doc.setFontSize(11);
  doc.text(`N° ${ba.number}`, 145, 13);

  // Right Block metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date : ${ba.date || '........................'}`, 145, 18);
  doc.text(`Code Client : ${ba.clientCodeRight || '........................'}`, 145, 22);
  doc.text(`Type Cong N° : ${ba.congNumber || '........................'}`, 145, 26);

  // AP, AG, A indicators
  doc.setFont('helvetica', 'bold');
  doc.text(`AP  [ ${ba.congType === 'AP' ? 'X' : ' '} ]    AG  [ ${ba.congType === 'AG' ? 'X' : ' '} ]    A  [ ${ba.congType === 'A' ? 'X' : ' '} ]`, 145, 30);

  // Left metadata
  doc.setFont('helvetica', 'bold');
  doc.text(`Code Client :`, 12, 33);
  doc.setFont('helvetica', 'normal');
  doc.text(ba.clientCodeLeft || '..........................................................', 32, 33);

  // --- Header of the big table ---
  const tableTopY = 38;
  const tableWidth = 190;
  const rowHeight = 5.2;

  // Table header background
  doc.setFillColor(241, 245, 249);
  // Main header row 1
  doc.rect(10, tableTopY, tableWidth, 10, 'F');
  doc.rect(10, tableTopY, tableWidth, 10, 'D');

  // Draw columns and headings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  
  // Outer cells line divisions
  // QTE PCS
  doc.text('QTE PCS', 11, tableTopY + 6.5);
  doc.line(23, tableTopY, 23, tableTopY + 10);

  // PRODUITS
  doc.text('PRODUITS', 25, tableTopY + 6.5);
  doc.line(78, tableTopY, 78, tableTopY + 10);

  // EN CARTONS (span columns)
  doc.text('EN CARTONS', 100, tableTopY + 4, { align: 'center' });
  doc.line(78, tableTopY + 5, 138, tableTopY + 5);
  
  // EN CARTONS inner titles
  doc.setFontSize(6);
  doc.text('QUANTITÉ', 88, tableTopY + 8.5, { align: 'center' });
  doc.line(98, tableTopY + 5, 98, tableTopY + 10);
  doc.text('PRIX CARTONS', 110, tableTopY + 8.5, { align: 'center' });
  doc.line(122, tableTopY + 5, 122, tableTopY + 10);
  doc.text('MONTANT', 130, tableTopY + 8.5, { align: 'center' });
  doc.line(138, tableTopY, 138, tableTopY + 10);

  // EN PIECES (span columns)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('EN PIÈCES', 160, tableTopY + 4, { align: 'center' });
  doc.line(138, tableTopY + 5, 188, tableTopY + 5);

  // EN PIECES inner titles
  doc.setFontSize(6);
  doc.text('QUANTITÉ', 148, tableTopY + 8.5, { align: 'center' });
  doc.line(158, tableTopY + 5, 158, tableTopY + 10);
  doc.text('PRIX PIÈCES', 168, tableTopY + 8.5, { align: 'center' });
  doc.line(178, tableTopY + 5, 178, tableTopY + 10);
  doc.text('MONTANT', 183, tableTopY + 8.5, { align: 'center' });
  doc.line(188, tableTopY, 188, tableTopY + 10);

  // MON GLO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('MON GLO', 194, tableTopY + 6.5, { align: 'center' });

  // Draw items
  let currentY = tableTopY + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  ba.items.forEach((item, idx) => {
    // Alternate light background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, currentY, tableWidth, rowHeight, 'F');
    }
    // Draw cells outline
    doc.rect(10, currentY, tableWidth, rowHeight, 'D');

    // Values
    doc.setFont('helvetica', 'bold');
    doc.text(String(item.qtePcsPreset), 16, currentY + 3.8, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(item.productName, 25, currentY + 3.8);

    // Cartons Quantity
    if (item.cartonsQty > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.cartonsQty), 88, currentY + 3.8, { align: 'center' });
    }
    // Prix Cartons
    doc.setFont('helvetica', 'normal');
    doc.text(item.prixCartons.toFixed(2), 110, currentY + 3.8, { align: 'center' });
    
    // Cartons Montant
    if (item.cartonsMontant > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(item.cartonsMontant.toFixed(2), 130, currentY + 3.8, { align: 'center' });
    }

    // Pieces Quantity
    if (item.piecesQty > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.piecesQty), 148, currentY + 3.8, { align: 'center' });
    }
    // Prix Pieces
    doc.setFont('helvetica', 'normal');
    doc.text(item.prixPieces.toFixed(2), 168, currentY + 3.8, { align: 'center' });

    // Pieces Montant
    if (item.piecesMontant > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(item.piecesMontant.toFixed(2), 183, currentY + 3.8, { align: 'center' });
    }

    // MON GLO
    if (item.monGlo > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(item.monGlo.toFixed(2), 194, currentY + 3.8, { align: 'center' });
    }

    // vertical borders in the row
    doc.line(23, currentY, 23, currentY + rowHeight);
    doc.line(78, currentY, 78, currentY + rowHeight);
    doc.line(98, currentY, 98, currentY + rowHeight);
    doc.line(122, currentY, 122, currentY + rowHeight);
    doc.line(138, currentY, 138, currentY + rowHeight);
    doc.line(158, currentY, 158, currentY + rowHeight);
    doc.line(178, currentY, 178, currentY + rowHeight);
    doc.line(188, currentY, 188, currentY + rowHeight);

    currentY += rowHeight;
  });

  // --- Total Box ---
  let footerY = currentY + 5;
  doc.rect(10, footerY, 190, 8, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('MONTANT AVOIR EN DIRHAMS :', 12, footerY + 5);
  
  if (ba.montantAvoirDirhams) {
    doc.setFontSize(10);
    doc.text(`${ba.montantAvoirDirhams.toFixed(2)} DH`, 198, footerY + 5.5, { align: 'right' });
  } else {
    doc.text('................................................................................................................ DH', 65, footerY + 5);
  }

  // --- Signatures (Client, Vendeur, Magasin, Administratif) ---
  const visaY = footerY + 12;
  const visaWidth = 45;
  const visaHeight = 15;

  const drawSignatureBox = (x: number, title: string) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(x, visaY, visaWidth, visaHeight, 'D');
    doc.setFillColor(241, 245, 249);
    doc.rect(x, visaY, visaWidth, 4.5, 'F');
    doc.rect(x, visaY, visaWidth, 4.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + (visaWidth / 2), visaY + 3, { align: 'center' });
  };

  drawSignatureBox(10, 'CLIENT');
  drawSignatureBox(58, 'VENDEUR');
  drawSignatureBox(106, 'MAGASIN');
  drawSignatureBox(154, 'ADMINISTRATIF');

  // --- Save File ---
  doc.save(`Bon_Avoir_${ba.number}.pdf`);
}
