import { jsPDF } from 'jspdf';
import { BonEncaissement } from '../types';

export function generateBonEncaissementPdf(be: BonEncaissement, lang: 'fr' | 'ar' = 'fr') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const textBlack = '#0f172a'; // Slate 900
  const borderGrey = '#94a3b8'; // Slate 400
  const dotColor = '#cbd5e1'; // Slate 300 for dotted/dashed lines

  doc.setLineWidth(0.3);
  doc.setDrawColor(15, 23, 42); // bold lines for main structures

  // --- Top Header Left Side: Logo & Address ---
  // Outer ellipse/bubble of Zahi logo
  doc.setFillColor(248, 250, 252);
  doc.ellipse(26, 18, 14, 9, 'F');
  doc.ellipse(26, 18, 14, 9, 'D');

  // Text inside the logo bubble
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ZAHI', 26, 16, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text('GLACES', 26, 20, { align: 'center' });

  // Address Details (Siège & Usine)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  let addrY = 29;
  doc.text('Siège & Usine : Route 3301 Ouled Sidi Abdenbi', 12, addrY);
  doc.text('Chellalatte - Mohammedia', 12, addrY + 3.2);
  doc.text('Tél : 06 61 39 97 41 / 06 62 13 04 85', 12, addrY + 6.4);
  doc.text('Fax : 05 22 73 34 97', 12, addrY + 9.6);
  doc.text('E-mail : zahiglaces@hotmail.com', 12, addrY + 12.8);

  // --- Top Header Right Side: Document Title & Number ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("BON D'ENCAISSEMENT", 115, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(15);
  doc.text(`N°  ${be.number}`, 125, 25);

  // --- Vendeur & Date Fields (emulating dotted lines) ---
  doc.setFontSize(9.5);
  const infoY = 46;
  doc.setFont('helvetica', 'bold');
  doc.text('Vendeur : ', 12, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(be.vendeur || '........................................................................', 30, infoY);

  doc.setFont('helvetica', 'bold');
  doc.text('Date : ', 125, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(be.date || '..................................................', 137, infoY);

  // --- Table Design ---
  const tableTopY = 52;
  const tableWidth = 190;
  const colWidths = [35, 85, 35, 35]; // Date, Désignation, Réf, Montant
  const colPositions = [
    10, // Col 1 start (Date)
    10 + colWidths[0], // Col 2 start (Désignation)
    10 + colWidths[0] + colWidths[1], // Col 3 start (Réf)
    10 + colWidths[0] + colWidths[1] + colWidths[2] // Col 4 start (Montant)
  ];
  const headerHeight = 8;
  const rowHeight = 7;
  const totalRows = 12; // Beautiful size emulating the paper lines

  // Draw Table Header
  doc.setFillColor(248, 250, 252);
  doc.rect(10, tableTopY, tableWidth, headerHeight, 'F');
  doc.rect(10, tableTopY, tableWidth, headerHeight, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  
  doc.text('Date', colPositions[0] + colWidths[0]/2, tableTopY + 5.5, { align: 'center' });
  doc.text('Désignation', colPositions[1] + colWidths[1]/2, tableTopY + 5.5, { align: 'center' });
  doc.text('Réf', colPositions[2] + colWidths[2]/2, tableTopY + 5.5, { align: 'center' });
  doc.text('Montant', colPositions[3] + colWidths[3]/2, tableTopY + 5.5, { align: 'center' });

  // Draw vertical borders for headers
  for (let i = 1; i < colPositions.length; i++) {
    doc.line(colPositions[i], tableTopY, colPositions[i], tableTopY + headerHeight);
  }

  // Draw Rows
  let currentY = tableTopY + headerHeight;
  for (let r = 0; r < totalRows; r++) {
    const item = be.items[r];

    // Draw solid outer borders & vertical dividers
    doc.rect(10, currentY, tableWidth, rowHeight, 'D');
    for (let i = 1; i < colPositions.length; i++) {
      doc.line(colPositions[i], currentY, colPositions[i], currentY + rowHeight);
    }

    // Inside row text
    if (item) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      
      // Date
      doc.text(item.date || '', colPositions[0] + colWidths[0]/2, currentY + 4.8, { align: 'center' });
      // Designation
      doc.text(item.designation || '', colPositions[1] + 4, currentY + 4.8);
      // Ref
      doc.text(item.ref || '', colPositions[2] + colWidths[2]/2, currentY + 4.8, { align: 'center' });
      // Montant
      if (item.montant) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.montant.toFixed(2)} DH`, colPositions[3] + colWidths[3] - 4, currentY + 4.8, { align: 'right' });
      }
    } else {
      // Draw a subtle dotted line to emulate empty paper lines
      doc.setDrawColor(203, 213, 221); // light grey
      doc.setLineDashPattern([1, 1], 0);
      
      // Horizontal dashed line
      doc.line(11, currentY + 4.5, 9 + tableWidth, currentY + 4.5);
      
      // Reset dash and color
      doc.setLineDashPattern([], 0);
      doc.setDrawColor(15, 23, 42);
    }

    currentY += rowHeight;
  }

  // --- Total Reçu Row ---
  // We need a bordered cell for "Total Reçu" and its value
  doc.rect(10, currentY, tableWidth, rowHeight + 1.5, 'D');
  
  // Vertical line before the Montant column
  doc.line(colPositions[3], currentY, colPositions[3], currentY + rowHeight + 1.5);

  // Vertical line before the "Total Reçu" label box (spanning over Ref column)
  const totalLabelXStart = colPositions[2] - 10; // Start slightly in designation
  doc.line(totalLabelXStart, currentY, totalLabelXStart, currentY + rowHeight + 1.5);
  doc.line(colPositions[2], currentY, colPositions[2], currentY + rowHeight + 1.5);

  // Label text "Total Reçu"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Total Reçu', (totalLabelXStart + colPositions[3]) / 2, currentY + 5.5, { align: 'center' });

  // Total value in Montant column
  doc.setFontSize(11);
  doc.text(`${be.totalRecu.toFixed(2)} DH`, colPositions[3] + colWidths[3] - 4, currentY + 5.5, { align: 'right' });

  currentY += rowHeight + 1.5;

  // --- Observations field ---
  currentY += 6;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Observation : ', 12, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(be.observation || '...........................................................................................................................................................', 35, currentY);

  // --- Visas (Caissier, Vendeur) ---
  currentY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Visa Caissier', 25, currentY);
  doc.text('Visa Vendeur', 150, currentY);

  // Visual checkboxes for checks on paper
  doc.rect(25, currentY + 2.5, 4.5, 4.5, 'D');
  doc.rect(150, currentY + 2.5, 4.5, 4.5, 'D');

  if (be.visaCaissier) {
    doc.setFont('helvetica', 'bold');
    doc.text('X', 26.3, currentY + 6);
  }
  if (be.visaVendeur) {
    doc.setFont('helvetica', 'bold');
    doc.text('X', 151.3, currentY + 6);
  }

  // --- Save File ---
  doc.save(`Bon_Encaissement_${be.number}.pdf`);
}
