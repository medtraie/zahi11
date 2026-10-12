/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to export an array of objects to CSV format
export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(","), ...rows.map(e => e.map(val => {
        // Escape commas and quotes
        const cleaned = String(val).replace(/"/g, '""');
        return cleaned.includes(",") || cleaned.includes("\n") || cleaned.includes('"') ? `"${cleaned}"` : cleaned;
      }).join(","))].join("\n");
      
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate barcode visual placeholder
export function generateBarcodeSVG(text: string): string {
  // Simple deterministic pseudo-barcode generation
  let lines = '';
  let x = 10;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const width = (charCode % 3) + 1;
    const space = (charCode % 2) + 1;
    lines += `<rect x="${x}" y="5" width="${width}" height="40" fill="black" />`;
    x += width + space;
  }
  return `<svg width="${x + 10}" height="60" viewBox="0 0 ${x + 10} 60" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white" />
    ${lines}
    <text x="50%" y="54" font-family="monospace" font-size="9" text-anchor="middle" fill="black">${text}</text>
  </svg>`;
}
