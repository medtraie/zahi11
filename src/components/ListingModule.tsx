/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  Search, 
  Plus, 
  Edit2, 
  Filter, 
  Trash2, 
  User, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { exportToCSV } from '../utils/export';

interface RefrigeratorRecord {
  id: string;
  vendeur: string;
  conge: string;
  sortieUnite: number; // 1 = Active / Green, 0 = Inactive / Red
  priseEnCharge: string;
  bonSortie: string;
  dateBonPc: string;
  clientName: string;
  adresse: string;
  telephone: string;
  cin: string;
  status: 'ACTIF' | 'NON ACTIF' | 'PROBLEME' | '';
}

interface ListingModuleProps {
  lang: 'fr' | 'ar';
  currentUser?: { name: string; role: string };
}

const INITIAL_RECORDS: RefrigeratorRecord[] = [
  { id: '1', vendeur: 'ABDERAHIM', conge: '961 AG', sortieUnite: 0, priseEnCharge: '74625', bonSortie: '22776', dateBonPc: '21/04/2025', clientName: 'AHMED SAMAKI', adresse: 'OULAD GHANAM', telephone: '06 14 77 68 99', cin: 'M150802', status: 'ACTIF' },
  { id: '2', vendeur: 'ABDERAHIM', conge: '306-25AG', sortieUnite: 1, priseEnCharge: '77941', bonSortie: '23656', dateBonPc: '27/02/2026', clientName: 'BADER HAMSI', adresse: 'BVR CHOHDA', telephone: '06 63 05 63 80', cin: 'M376143', status: 'ACTIF' },
  { id: '3', vendeur: 'ABDERAHIM', conge: '130-25AG', sortieUnite: 1, priseEnCharge: '77115', bonSortie: '22787', dateBonPc: '16/07/2025', clientName: 'ABDELAH AHLAL', adresse: 'SIDI BOUZID SAKA', telephone: '06 78 78 24 17', cin: 'BE792726', status: 'ACTIF' },
  { id: '4', vendeur: 'ABDERAHIM', conge: '983AG', sortieUnite: 0, priseEnCharge: '35635', bonSortie: '12659', dateBonPc: '28/02/2022', clientName: 'ABDELKARIM LGALIL', adresse: 'EL JADIDA', telephone: '06 38 48 88 28', cin: 'M536493', status: 'ACTIF' },
  { id: '5', vendeur: 'ABDERAHIM', conge: '408-21AG', sortieUnite: 1, priseEnCharge: '48058', bonSortie: '16704', dateBonPc: '05/02/2024', clientName: 'FATIMA EANZI', adresse: 'SIDI ALI AZMOUR', telephone: '06 18 38 94 86', cin: 'M708909', status: 'ACTIF' },
  { id: '6', vendeur: 'ABDERAHIM', conge: '847-24AS', sortieUnite: 1, priseEnCharge: '68617', bonSortie: '16729', dateBonPc: '29/04/2024', clientName: 'IMAD AKHARZ (mouad)', adresse: 'OULAD GHANEM', telephone: '06 14 80 33 25', cin: 'JC801140', status: 'ACTIF' },
  { id: '7', vendeur: 'ABDERAHIM', conge: '173AG', sortieUnite: 1, priseEnCharge: '40620', bonSortie: '', dateBonPc: '21/02/2023', clientName: 'SAYS HOSNI', adresse: 'DWAR ZAWIA', telephone: '06 20 19 15 00', cin: 'M546115', status: 'ACTIF' },
  { id: '8', vendeur: 'ABDERAHIM', conge: '599-20AG', sortieUnite: 1, priseEnCharge: '48066', bonSortie: '', dateBonPc: '20/02/2024', clientName: 'MOUNIR KHALOUN', adresse: 'OULAD GHANEM', telephone: '06 07 78 80 15', cin: 'M519208', status: 'ACTIF' },
  { id: '9', vendeur: 'ABDERAHIM', conge: '851-21AG', sortieUnite: 1, priseEnCharge: '48093', bonSortie: '', dateBonPc: '04/04/2024', clientName: 'ABDELHAK AAROUSSI', adresse: 'HAY SINAEI', telephone: '06 16 18 20 22', cin: 'MA63685', status: 'ACTIF' },
  { id: '10', vendeur: 'ABDERAHIM', conge: '19-19AG', sortieUnite: 1, priseEnCharge: '77102', bonSortie: '22784', dateBonPc: '28/05/2025', clientName: 'ABDENABI BARICHH', adresse: 'ROUTE MARRAKECH', telephone: '06 62 62 88 17', cin: 'M185042', status: 'ACTIF' },
  { id: '11', vendeur: 'ABDERAHIM', conge: '5984-25AG', sortieUnite: 1, priseEnCharge: '74845', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'JAMILA TAHAR', adresse: 'MALAH MADINA', telephone: '06 16 15 80 22', cin: 'M54807', status: 'ACTIF' },
  { id: '12', vendeur: 'ABDERAHIM', conge: '5700-25AG', sortieUnite: 1, priseEnCharge: '74848', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'BRAHIM WAZNI', adresse: 'ROUTE DOUAR ISSA', telephone: '06 42 95 71 72', cin: 'JE293785', status: 'ACTIF' },
  { id: '13', vendeur: 'ABDERAHIM', conge: '5699-25AG', sortieUnite: 1, priseEnCharge: '74847', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'MOHAMED BAHAMOU', adresse: 'BVR MOHAMED 5 EN FACE MAHTA', telephone: '06 30 80 95 32', cin: 'BK3811', status: 'ACTIF' },
  { id: '14', vendeur: 'ABDERAHIM', conge: '1053AG', sortieUnite: 1, priseEnCharge: '74467', bonSortie: '22755', dateBonPc: '17/06/2025', clientName: 'MOHAMED HANZAZ', adresse: 'MOULAY ABDELAH', telephone: '06 10 02 09 88', cin: 'M873420', status: 'ACTIF' },
  { id: '15', vendeur: 'ABDERAHIM', conge: '5763-25AG', sortieUnite: 1, priseEnCharge: '74844', bonSortie: '26567', dateBonPc: '17/06/2025', clientName: 'ABDERAHMAN HAYANI', adresse: 'BVR NAKHIL', telephone: '06 66 63 80 45', cin: 'JE160022', status: 'ACTIF' },
  { id: '16', vendeur: 'ABDERAHIM', conge: '1567-26AG', sortieUnite: 1, priseEnCharge: '79012', bonSortie: '23661', dateBonPc: '04/04/2026', clientName: 'ABDELAH SAMIH', adresse: 'EN FACE MAHTA AZMOUR', telephone: '06 61 45 00 78', cin: 'M507400', status: 'ACTIF' },
  { id: '17', vendeur: 'ABDERAHIM', conge: '223AP', sortieUnite: 1, priseEnCharge: '74460', bonSortie: '22755', dateBonPc: '05/02/2025', clientName: 'AHMED RABAH', adresse: 'SIDI ABED', telephone: '06 10 12 18 00', cin: 'M490837', status: 'ACTIF' },
  { id: '18', vendeur: 'ABDERAHIM', conge: '547-25AG', sortieUnite: 1, priseEnCharge: '77908', bonSortie: '23656', dateBonPc: '27/02/2026', clientName: 'MOHAMED BOU HADOU', adresse: 'FACULTE DES SCIENCES', telephone: '06 68 22 25 74', cin: 'MA508702', status: 'ACTIF' },
  { id: '19', vendeur: 'ABDERAHIM', conge: '502-25AG', sortieUnite: 1, priseEnCharge: '72179', bonSortie: '23656', dateBonPc: '27/02/2026', clientName: 'DRISS OUKAZMAT', adresse: 'HAY MATAR MARJANE', telephone: '06 16 33 55 70', cin: 'MA504702', status: 'ACTIF' },
  { id: '20', vendeur: 'ABDERAHIM', conge: '236-20AG', sortieUnite: 1, priseEnCharge: '74487', bonSortie: '22763', dateBonPc: '27/02/2025', clientName: 'ABDENABI HAKIM', adresse: 'BOUCHRIT MOHAMED 5', telephone: '06 94 82 63 02', cin: 'MA64251', status: 'ACTIF' },
  { id: '21', vendeur: 'RACHIDI', conge: '2564AG', sortieUnite: 0, priseEnCharge: '77956', bonSortie: '23652', dateBonPc: '12/02/2026', clientName: 'BRAHIM HANNAOUI', adresse: 'MOULAY ABDELAH', telephone: '06 10 46 42 12', cin: 'MA15887', status: 'NON ACTIF' },
  { id: '22', vendeur: 'RACHIDI', conge: '5172AG', sortieUnite: 0, priseEnCharge: '77901', bonSortie: '23651', dateBonPc: '10/02/2026', clientName: 'ABDERAHIM RAFIK', adresse: 'TNIN CITOUKA', telephone: '06 18 40 24 35', cin: 'MC701918', status: 'NON ACTIF' },
  { id: '23', vendeur: 'RACHIDI', conge: '5277AG', sortieUnite: 0, priseEnCharge: '77955', bonSortie: '23652', dateBonPc: '12/02/2026', clientName: 'ZAHRA BEL HAMDOUN', adresse: 'MOULAY ABDELAH', telephone: '06 18 22 30 77', cin: 'MA15802', status: 'NON ACTIF' },
  { id: '24', vendeur: 'RACHIDI', conge: '716-23AG', sortieUnite: 0, priseEnCharge: '77903', bonSortie: '23653', dateBonPc: '18/02/2026', clientName: 'JILALI BELAFQIH', adresse: 'SIDI ALI AZMOUR', telephone: '06 18 22 40 15', cin: 'MA75085', status: 'PROBLEME' },
  { id: '25', vendeur: 'RACHIDI', conge: '4182AG', sortieUnite: 0, priseEnCharge: '77954', bonSortie: '23652', dateBonPc: '12/02/2026', clientName: 'YAZID BOUZAOUI', adresse: 'ROUTE HAOUZIA VILLE AZEMMOUR', telephone: '06 61 18 13 00', cin: 'MA62363', status: 'NON ACTIF' },
  { id: '26', vendeur: 'RACHIDI', conge: '291-23AG', sortieUnite: 0, priseEnCharge: '74628', bonSortie: '', dateBonPc: '24/04/2025', clientName: 'MOHAMED BEN SAFIYA', adresse: 'QAMRA AZMOUR', telephone: '06 64 74 02 25', cin: 'MA28941', status: 'PROBLEME' },
  { id: '27', vendeur: 'RACHIDI', conge: '729-21AG', sortieUnite: 0, priseEnCharge: '74640', bonSortie: '', dateBonPc: '16/05/2025', clientName: 'MOSTAPHA ZAROUQ', adresse: 'ROUTE WALIDIA', telephone: '07 18 50 73 31', cin: 'M701580', status: 'NON ACTIF' },
  { id: '28', vendeur: 'RACHIDI', conge: '5597AG', sortieUnite: 1, priseEnCharge: '48100', bonSortie: '', dateBonPc: '08/04/2024', clientName: 'ABDELAH', adresse: 'JAMAT HAOUZIA', telephone: '06 61 80 91 45', cin: 'MA507411', status: 'ACTIF' },
  { id: '29', vendeur: 'RACHIDI', conge: '1743-26AG', sortieUnite: 1, priseEnCharge: '85760', bonSortie: '23660', dateBonPc: '04/04/2026', clientName: 'BOUCHAIB ZHOURI', adresse: 'ROUTE MAHYOULA OULAD FREJ', telephone: '06 16 40 52 30', cin: 'MA271178', status: 'ACTIF' },
  { id: '30', vendeur: 'RACHIDI', conge: '1570-26AG', sortieUnite: 1, priseEnCharge: '85776', bonSortie: '23661', dateBonPc: '04/04/2026', clientName: 'ABDELADIM ZETOUNI', adresse: 'HAY MATAR', telephone: '06 33 27 69 91', cin: 'MA527518', status: 'ACTIF' },
  { id: '31', vendeur: 'RACHIDI', conge: '1554-26AG', sortieUnite: 1, priseEnCharge: '79009', bonSortie: '23661', dateBonPc: '04/04/2026', clientName: 'ABDELKADER AALAOUI', adresse: 'STATION CENTRE JADIDA', telephone: '06 16 42 13 46', cin: 'MA128546', status: 'ACTIF' },
  { id: '32', vendeur: 'RACHIDI', conge: '660-19AS', sortieUnite: 1, priseEnCharge: '40649', bonSortie: '10973', dateBonPc: '07/04/2023', clientName: 'ABDELAH SAMIH', adresse: '8 DARB BARNIS AZAMOUR', telephone: '06 62 40 77 32', cin: 'M97523', status: 'ACTIF' }
];

export default function ListingModule({ lang, currentUser }: ListingModuleProps) {
  const [records, setRecords] = useState<RefrigeratorRecord[]>(() => {
    try {
      const saved = localStorage.getItem('zahi_refrigerator_listing');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RECORDS;
  });

  const [vendeurFilter, setVendeurFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<RefrigeratorRecord | null>(null);

  // Traceability & Vouchers Carnet panel
  const [selectedVendeur, setSelectedVendeur] = useState<string>('');
  const [linkedVouchers, setLinkedVouchers] = useState<any[]>([]);

  // Form Fields
  const [vendeur, setVendeur] = useState('');
  const [conge, setConge] = useState('');
  const [sortieUnite, setSortieUnite] = useState<number>(1);
  const [priseEnCharge, setPriseEnCharge] = useState('');
  const [bonSortie, setBonSortie] = useState('');
  const [dateBonPc, setDateBonPc] = useState('');
  const [clientName, setClientName] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [status, setStatus] = useState<'ACTIF' | 'NON ACTIF' | 'PROBLEME' | ''>('ACTIF');

  const getDrivers = () => {
    let driversList = [
      { id: 'DRV-001', name: 'Hamza Chauffeur (TRK-CA-01)' },
      { id: 'DRV-002', name: 'Mustapha Ait Ben Haddou' },
      { id: 'DRV-003', name: 'Karim Bennani' },
      { id: 'DRV-004', name: 'Yassine Belkhadir' },
      { id: 'DRV-005', name: 'Tarik Jamil' },
      { id: 'DRV-006', name: 'Hicham Daoudi' },
      { id: 'DRV-007', name: 'Amina Tazi' },
      { id: 'DRV-008', name: 'ABDERAHIM' },
      { id: 'DRV-009', name: 'RACHIDI' }
    ];
    try {
      const saved = localStorage.getItem('zahi_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          if (!merged.some(d => d.name.toUpperCase().includes('ABDERAHIM'))) {
            merged.push({ id: 'DRV-008', name: 'ABDERAHIM' });
          }
          if (!merged.some(d => d.name.toUpperCase().includes('RACHIDI'))) {
            merged.push({ id: 'DRV-009', name: 'RACHIDI' });
          }
          return merged;
        }
      }
    } catch (e) {}
    return driversList;
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('zahi_refrigerator_listing', JSON.stringify(records));
  }, [records]);

  // Load trace documents from local savedBons
  useEffect(() => {
    if (selectedVendeur) {
      try {
        const savedBonsStr = localStorage.getItem('zahi_saved_bons');
        if (savedBonsStr) {
          const allBons = JSON.parse(savedBonsStr);
          // Filter by seller name (case-insensitive contains)
          const filtered = allBons.filter((bon: any) => 
            (bon.nomVendeur || '').toLowerCase().includes(selectedVendeur.toLowerCase()) ||
            (bon.vendeur || '').toLowerCase().includes(selectedVendeur.toLowerCase())
          );
          setLinkedVouchers(filtered);
        } else {
          setLinkedVouchers([]);
        }
      } catch (e) {
        setLinkedVouchers([]);
      }
    } else {
      setLinkedVouchers([]);
    }
  }, [selectedVendeur]);

  // Unique lists for dropdowns
  const uniqueVendeurs = Array.from(new Set(records.map(r => r.vendeur).filter(Boolean)));

  // Filter records
  const filteredRecords = records.filter(rec => {
    const matchVendeur = vendeurFilter === 'all' || rec.vendeur === vendeurFilter;
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rec.sortieUnite === 1) || 
      (statusFilter === 'inactive' && rec.sortieUnite === 0) ||
      (statusFilter === 'ACTIF' && rec.status === 'ACTIF') ||
      (statusFilter === 'NON ACTIF' && rec.status === 'NON ACTIF') ||
      (statusFilter === 'PROBLEME' && rec.status === 'PROBLEME');

    const searchStr = `${rec.vendeur} ${rec.conge} ${rec.clientName} ${rec.adresse} ${rec.cin} ${rec.telephone} ${rec.priseEnCharge} ${rec.bonSortie}`.toLowerCase();
    const matchSearch = searchQuery.trim() === '' || searchStr.includes(searchQuery.toLowerCase());

    return matchVendeur && matchStatus && matchSearch;
  });

  // Calculate statistics
  const totalCount = records.length;
  const activeCount = records.filter(r => r.sortieUnite === 1).length;
  const inactiveCount = records.filter(r => r.sortieUnite === 0).length;
  const statusActiveCount = records.filter(r => r.status === 'ACTIF').length;

  const resetForm = () => {
    setVendeur('');
    setConge('');
    setSortieUnite(1);
    setPriseEnCharge('');
    setBonSortie('');
    setDateBonPc(new Date().toISOString().split('T')[0]);
    setClientName('');
    setAdresse('');
    setTelephone('');
    setCin('');
    setStatus('ACTIF');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendeur || !conge || !clientName) {
      alert(lang === 'fr' ? 'Veuillez remplir les champs obligatoires (Vendeur, Congélateur, Client)' : 'يرجى ملء الحقول الإلزامية (الموزع، الثلاجة، الزبون)');
      return;
    }

    const newRecord: RefrigeratorRecord = {
      id: `R-REC-${Date.now()}`,
      vendeur: vendeur.trim().toUpperCase(),
      conge: conge.trim().toUpperCase(),
      sortieUnite,
      priseEnCharge: priseEnCharge.trim(),
      bonSortie: bonSortie.trim(),
      dateBonPc: dateBonPc || new Date().toISOString().split('T')[0],
      clientName: clientName.trim(),
      adresse: adresse.trim(),
      telephone: telephone.trim(),
      cin: cin.trim().toUpperCase(),
      status
    };

    setRecords(prev => [newRecord, ...prev]);
    setShowAddModal(false);
    resetForm();
  };

  const startEdit = (rec: RefrigeratorRecord) => {
    setEditingRecord(rec);
    setVendeur(rec.vendeur);
    setConge(rec.conge);
    setSortieUnite(rec.sortieUnite);
    setPriseEnCharge(rec.priseEnCharge);
    setBonSortie(rec.bonSortie);
    setDateBonPc(rec.dateBonPc);
    setClientName(rec.clientName);
    setAdresse(rec.adresse);
    setTelephone(rec.telephone);
    setCin(rec.cin);
    setStatus(rec.status);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setRecords(prev => prev.map(rec => {
      if (rec.id === editingRecord.id) {
        return {
          ...rec,
          vendeur: vendeur.trim().toUpperCase(),
          conge: conge.trim().toUpperCase(),
          sortieUnite,
          priseEnCharge: priseEnCharge.trim(),
          bonSortie: bonSortie.trim(),
          dateBonPc,
          clientName: clientName.trim(),
          adresse: adresse.trim(),
          telephone: telephone.trim(),
          cin: cin.trim().toUpperCase(),
          status
        };
      }
      return rec;
    }));

    setShowEditModal(false);
    setEditingRecord(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cet enregistrement ?' : 'هل أنت متأكد من رغبتك في حذف هذا السجل؟')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Excel Export helper (CSV formatted)
  const handleExportExcel = () => {
    const headers = [
      'VENDEUR', 
      'CONGE (N° Congélateur)', 
      'SORTIE / UNITE (0/1)', 
      'PRISE EN CHARGE', 
      'BON SORTIE', 
      'DATE BON PC', 
      'CLIENT', 
      'ADRESSE', 
      'TELEPHONE', 
      'CIN', 
      'STATUT'
    ];
    
    const rows = filteredRecords.map(r => [
      r.vendeur,
      r.conge,
      r.sortieUnite.toString(),
      r.priseEnCharge || '',
      r.bonSortie || '',
      r.dateBonPc || '',
      r.clientName,
      r.adresse || '',
      r.telephone || '',
      r.cin || '',
      r.status || ''
    ]);

    exportToCSV('extrait_listing_congelateurs', headers, rows);
  };

  // PDF Export helper via jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant colors
    const primaryNavy = '#0f172a';
    const accentSky = '#0284c7';

    // Header Panel
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 24, 'F');

    doc.setFillColor(2, 132, 199); // sky-600
    doc.rect(0, 24, 297, 1.5, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(lang === 'fr' ? 'ZAHI ICE - LISTING VENDEURS & CONGÉLATEURS 2026' : 'مثلجات زاهي - لائحة الموزعين والثلاجات 2026', 12, 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(186, 230, 253);
    doc.text(lang === 'fr' ? `GÉNÉRÉ LE ${new Date().toLocaleString('fr-FR')} | TOTAL : ${filteredRecords.length} ENREGISTREMENTS` : `تاريخ الاستخراج ${new Date().toLocaleString('ar-MA')} | المجموع: ${filteredRecords.length} سجلات`, 12, 16);

    // Headers
    const startY = 32;
    const colWidths = [24, 20, 15, 24, 20, 24, 45, 50, 28, 20, 18];
    const colNames = ['Vendeur', 'Congé', 'Sortie', 'P. Charge', 'Bon Sort', 'Date PC', 'Client', 'Adresse', 'Téléphone', 'CIN', 'Statut'];

    doc.setFillColor(241, 245, 249);
    doc.rect(8, startY, 281, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    let currentX = 8;
    colNames.forEach((name, idx) => {
      doc.text(name, currentX + 1.5, startY + 5);
      currentX += colWidths[idx];
    });

    // Draw rows
    let rowY = startY + 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    filteredRecords.forEach((rec, idx) => {
      // Row Background alternating
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(8, rowY, 281, 6.5, 'F');
      }

      // Draw border bottom
      doc.setDrawColor(226, 232, 240);
      doc.line(8, rowY + 6.5, 289, rowY + 6.5);

      let x = 8;
      
      // Vendeur
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(rec.vendeur, x + 1.5, rowY + 4.5);
      x += colWidths[0];

      // Conge
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(225, 29, 72); // Rose
      doc.text(rec.conge, x + 1.5, rowY + 4.5);
      x += colWidths[1];

      // Sortie Unite
      doc.setFont('helvetica', 'bold');
      if (rec.sortieUnite === 1) {
        doc.setTextColor(22, 163, 74); // Green
        doc.text('1 (SORTIE)', x + 1.5, rowY + 4.5);
      } else {
        doc.setTextColor(220, 38, 38); // Red
        doc.text('0 (STOCK)', x + 1.5, rowY + 4.5);
      }
      x += colWidths[2];

      // Prise en charge
      doc.setTextColor(71, 85, 105);
      doc.text(rec.priseEnCharge || '-', x + 1.5, rowY + 4.5);
      x += colWidths[3];

      // Bon sortie
      doc.text(rec.bonSortie || '-', x + 1.5, rowY + 4.5);
      x += colWidths[4];

      // Date PC
      doc.text(rec.dateBonPc || '-', x + 1.5, rowY + 4.5);
      x += colWidths[5];

      // Client name
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(rec.clientName.substring(0, 25), x + 1.5, rowY + 4.5);
      x += colWidths[6];

      // Adresse
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text((rec.adresse || '').substring(0, 30), x + 1.5, rowY + 4.5);
      x += colWidths[7];

      // Telephone
      doc.text(rec.telephone || '-', x + 1.5, rowY + 4.5);
      x += colWidths[8];

      // CIN
      doc.text(rec.cin || '-', x + 1.5, rowY + 4.5);
      x += colWidths[9];

      // Statut
      if (rec.status === 'ACTIF') {
        doc.setTextColor(22, 163, 74);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(rec.status || 'NON ACTIF', x + 1.5, rowY + 4.5);

      rowY += 6.5;

      // Page Break logic if needed
      if (rowY > 185) {
        doc.addPage();
        // Redraw Header on new page
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 297, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('ZAHI ICE - LISTING VENDEURS (SUITE)', 12, 10);

        rowY = 22;
        doc.setFillColor(241, 245, 249);
        doc.rect(8, rowY, 281, 7, 'F');
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7.5);
        let curX = 8;
        colNames.forEach((name, idx) => {
          doc.text(name, curX + 1.5, rowY + 5);
          curX += colWidths[idx];
        });
        rowY += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
    });

    doc.save(`ZahiIce_Listing_Vendeurs_Congelateurs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Area */}
      <div className="relative overflow-hidden p-6 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl border border-slate-800 shadow-xl text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileText className="h-44 w-44 text-sky-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-500/30">
                {lang === 'fr' ? 'Listing & Traçabilité' : 'القوائم والمطابقة'}
              </span>
              <Sparkles className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider">
              {lang === 'fr' ? 'Listing Vendeurs & Congélateurs' : 'قائمة تتبع الموزعين وثلاجات الزبناء'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {lang === 'fr' 
                ? "Liez chaque vendeur (Chauffeur) à son carnet d'entrée, sortie, prise en charge et décharge avec les coordonnées complètes des clients pour assurer une traçabilité sans faille."
                : "ربط كل سائق بائع بدفتر المستندات الخاص به (إدخال، إخراج، استلام، وإرجاع) مع التفاصيل الكاملة لمعلومات الزبائن لضمان جودة التتبع الكلي للمبيعات والأصول."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {lang === 'fr' ? 'Télécharger Excel (CSV)' : 'تحميل ملف Excel'}
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {lang === 'fr' ? 'Télécharger PDF' : 'تحميل ملف PDF'}
            </button>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md shadow-sky-500/15 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {lang === 'fr' ? 'Nouvel Enregistrement' : 'إضافة تسجيل جديد'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'fr' ? 'TOTAL CONGÉLATEURS' : 'إجمالي الثلاجات'}
            </p>
            <p className="text-xl font-black font-mono text-slate-800 dark:text-white">{totalCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'fr' ? 'SORTIES (ACTIF)' : 'المسلمة والمشغلة'}
            </p>
            <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'fr' ? 'EN STOCK (REVENUES)' : 'المرجعة بالمستودع'}
            </p>
            <p className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{inactiveCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-xl">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'fr' ? 'STATUT CLIENT ACTIF' : 'زبائن نشيطون'}
            </p>
            <p className="text-xl font-black font-mono text-sky-600 dark:text-sky-400">{statusActiveCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher client, congélateur, vendeur...' : 'بحث عن زبون، ثلاجة، موزع...'}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-sky-500 outline-none font-medium"
            />
          </div>

          {/* Vendeur filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-bold shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>{lang === 'fr' ? 'Vendeur :' : 'الموزع :'}</span>
            <select
              value={vendeurFilter}
              onChange={(e) => setVendeurFilter(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">{lang === 'fr' ? 'Tous' : 'الكل'}</option>
              {uniqueVendeurs.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-bold shrink-0">
            <span>{lang === 'fr' ? 'Statut :' : 'الحالة :'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">{lang === 'fr' ? 'Tous' : 'الكل'}</option>
              <option value="active">{lang === 'fr' ? 'Unité Sortie (1)' : 'وحدة خارجة (1)'}</option>
              <option value="inactive">{lang === 'fr' ? 'Unité Stock (0)' : 'وحدة بالخزين (0)'}</option>
              <option value="ACTIF">{lang === 'fr' ? 'Client Actif' : 'زبون نشط'}</option>
              <option value="NON ACTIF">{lang === 'fr' ? 'Client Inactif' : 'زبون غير نشط'}</option>
              <option value="PROBLEME">{lang === 'fr' ? 'Problématique' : 'مشكلة'}</option>
            </select>
          </div>
        </div>

        {/* Clear Filters helper */}
        {(vendeurFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '') && (
          <button
            onClick={() => { setVendeurFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
            className="text-xxs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3 animate-spin" />
            {lang === 'fr' ? 'Réinitialiser les filtres' : 'إعادة ضبط الفلاتر'}
          </button>
        )}
      </div>

      {/* Main Grid Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xxs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950/50 uppercase text-slate-400 font-black tracking-wider border-b border-slate-150 dark:border-slate-850">
              <tr>
                <th className="px-4 py-3.5 text-center">{lang === 'fr' ? 'VENDEUR' : 'الموزع / السائق'}</th>
                <th className="px-4 py-3.5 text-rose-600 dark:text-rose-400">{lang === 'fr' ? 'CONGE' : 'رقم الثلاجة'}</th>
                <th className="px-4 py-3.5 text-center">{lang === 'fr' ? 'SORTIE/UNITE' : 'الخروج/الوحدة'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'PRISE EN CHARGE' : 'سند استلام'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'BON SORTIE' : 'بون خروج'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'DATE BON PC' : 'تاريخ السند'}</th>
                <th className="px-4 py-3.5 text-slate-800 dark:text-white font-bold">{lang === 'fr' ? 'CLIENT' : 'الزبون'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'ADRESSE' : 'العنوان'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'TELEPHONE' : 'الهاتف'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'CIN' : 'ب.ت.و'}</th>
                <th className="px-4 py-3.5">{lang === 'fr' ? 'STATUT' : 'الوضعية'}</th>
                <th className="px-4 py-3.5 text-right">{lang === 'fr' ? 'ACTIONS' : 'خيارات'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-bold">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-sky-50 dark:bg-slate-800 text-sky-800 dark:text-sky-300 rounded font-black border border-sky-100 dark:border-slate-700">
                        {rec.vendeur}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-mono tracking-wider">{rec.conge}</td>
                    <td className="px-4 py-3 text-center">
                      {rec.sortieUnite === 1 ? (
                        <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded font-mono">
                          1
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded font-mono">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{rec.priseEnCharge || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{rec.bonSortie || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 font-medium">{rec.dateBonPc || '-'}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white font-black">{rec.clientName}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium max-w-[150px] truncate" title={rec.adresse}>{rec.adresse || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono font-medium">{rec.telephone || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{rec.cin || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black tracking-wide ${
                        rec.status === 'ACTIF' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' 
                          : rec.status === 'NON ACTIF'
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                      }`}>
                        {rec.status || 'NON ACTIF'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedVendeur(rec.vendeur); }}
                          className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
                          title={lang === 'fr' ? 'Voir Carnet Documents' : 'عرض المستندات المربوطة'}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => startEdit(rec)}
                          className="p-1 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded border border-transparent hover:border-sky-200 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-400 font-medium">
                    {lang === 'fr' ? 'Aucun enregistrement trouvé correspondant aux critères.' : 'لم يتم العثور على أي سجل مطابق لمعايير البحث.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traceability panel - linked documents */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-indigo-500 animate-pulse" />
              {lang === 'fr' ? 'Trace Doc Carnet Vendeur' : 'تتبع الملفات والمستندات للسائق الموزع'}
            </h3>
            <p className="text-xxs text-slate-400">
              {lang === 'fr' 
                ? "Sélectionnez un vendeur pour retracer l'ensemble de ses Bons d'Entrée, Sortie, Prise en charge et Décharge."
                : "حدد اسم السائق الموزع للاطلاع الفوري على مستندات تسليم أو سحب أو إخلاء الذمة للثلاجة."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">{lang === 'fr' ? 'Vendeur à tracer :' : 'تتبع الموزع :'}</span>
            <select
              value={selectedVendeur}
              onChange={(e) => setSelectedVendeur(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="">{lang === 'fr' ? '-- Choisir --' : '-- اختر --'}</option>
              {uniqueVendeurs.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedVendeur ? (
          <div className="space-y-3">
            <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-xl text-xxs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
              <span>{lang === 'fr' ? `JOURNAL DES OPÉRATIONS DE : ${selectedVendeur}` : `سجل العمليات والمستندات لـ: ${selectedVendeur}`}</span>
              <span className="font-mono bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200/20">{linkedVouchers.length} Docs found</span>
            </div>

            {linkedVouchers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {linkedVouchers.map((bon: any) => (
                  <div key={bon.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-xs flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xxs font-bold">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] uppercase font-black ${
                          bon.type === 'entry' ? 'bg-emerald-100 text-emerald-600' :
                          bon.type === 'sortie' ? 'bg-rose-100 text-rose-600' :
                          bon.type === 'prise_en_charge' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {bon.type === 'entry' ? "Bon d'Entrée" :
                           bon.type === 'sortie' ? "Bon de Sortie" :
                           bon.type === 'prise_en_charge' ? "Prise en charge" : "Décharge"}
                        </span>
                        <span className="font-mono text-slate-400">N° {bon.bonNo || bon.number}</span>
                      </div>

                      <div className="space-y-1 text-xxs font-medium text-slate-600 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>{lang === 'fr' ? 'Client :' : 'الزبون :'}</span>
                          <span className="font-black text-slate-800 dark:text-white">{bon.nomClient || bon.clientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{lang === 'fr' ? 'Congélateur :' : 'الثلاجة :'}</span>
                          <span className="font-mono text-rose-500 font-bold">{bon.congelateurNo || bon.congNumber} ({bon.congelateurType || bon.congType || 'AG'})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{lang === 'fr' ? 'Date :' : 'التاريخ :'}</span>
                          <span className="font-mono">{bon.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-3 flex justify-between items-center text-xxs text-slate-400">
                      <span>{lang === 'fr' ? 'Visa Vendeur :' : 'تأشيرة الموزع :'}</span>
                      <span className="font-serif italic font-black text-blue-600">{bon.visasSigned?.vendeur || 'Signé ✓'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xxs text-slate-400 font-medium">
                {lang === 'fr' 
                  ? "Aucun document lié trouvé pour ce vendeur dans l'historique des bons." 
                  : "لم يتم العثور على أي مستند أو سند مع سجل هذا السائق البائع."}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xxs text-slate-400 font-medium">
            {lang === 'fr' ? 'Veuillez sélectionner un vendeur pour afficher son historique.' : 'يرجى اختيار موزع سائق لعرض المستندات الملحقة به.'}
          </div>
        )}
      </div>

      {/* ADD RECORD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-sky-500" />
                {lang === 'fr' ? 'Nouveau Placement Congélateur' : 'سجل تسليم ثلاجة جديد'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xxs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Vendeur (Surnom) *</label>
                  <select
                    required
                    value={vendeur}
                    onChange={(e) => setVendeur(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="">{lang === 'fr' ? '-- Sélectionner un Vendeur --' : '-- اختر الموزع --'}</option>
                    {getDrivers().map((drv: any) => {
                      const cleanName = drv.name.split(' (')[0];
                      return (
                        <option key={drv.id} value={cleanName}>
                          {drv.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Code Congélateur (CONGE) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 961 AG, 306-25AG"
                    value={conge}
                    onChange={(e) => setConge(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Sortie Unité (Statut Stock)</label>
                  <select
                    value={sortieUnite}
                    onChange={(e) => setSortieUnite(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none cursor-pointer"
                  >
                    <option value={1}>{lang === 'fr' ? '1 (En Service / Extérieur)' : '1 (في الخدمة / خارج)'}</option>
                    <option value={0}>{lang === 'fr' ? '0 (En Stock / Repris)' : '0 (في المستودع / مرجع)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">N° Bon Prise en Charge</label>
                  <input
                    type="text"
                    placeholder="e.g. 74625"
                    value={priseEnCharge}
                    onChange={(e) => setPriseEnCharge(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">N° Bon Sortie</label>
                  <input
                    type="text"
                    placeholder="e.g. 22776"
                    value={bonSortie}
                    onChange={(e) => setBonSortie(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Date Bon Prise en Charge</label>
                  <input
                    type="date"
                    value={dateBonPc}
                    onChange={(e) => setDateBonPc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Nom Complet Client *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AHMED SAMAKI"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Adresse Client</label>
                  <input
                    type="text"
                    placeholder="e.g. OULAD GHANAM"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Téléphone Client</label>
                  <input
                    type="text"
                    placeholder="e.g. 06 14 77 68 99"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">CIN Client</label>
                  <input
                    type="text"
                    placeholder="e.g. M150802"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Statut Refrigérateur</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none cursor-pointer"
                  >
                    <option value="ACTIF">{lang === 'fr' ? 'ACTIF' : 'نشط'}</option>
                    <option value="NON ACTIF">{lang === 'fr' ? 'NON ACTIF' : 'غير نشط'}</option>
                    <option value="PROBLEME">{lang === 'fr' ? 'PROBLÈME' : 'مشكلة'}</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-500/10 transition-all cursor-pointer"
                >
                  {lang === 'fr' ? 'Enregistrer' : 'تأكيد الحفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-1.5">
                <Edit2 className="h-4.5 w-4.5 text-sky-500" />
                {lang === 'fr' ? 'Modifier Enregistrement Placement' : 'تعديل سجل الثلاجة والتسليم'}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xxs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Vendeur (Surnom) *</label>
                  <select
                    required
                    value={vendeur}
                    onChange={(e) => setVendeur(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none cursor-pointer text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="">{lang === 'fr' ? '-- Sélectionner un Vendeur --' : '-- اختر الموزع --'}</option>
                    {getDrivers().map((drv: any) => {
                      const cleanName = drv.name.split(' (')[0];
                      return (
                        <option key={drv.id} value={cleanName}>
                          {drv.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Code Congélateur (CONGE) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 961 AG, 306-25AG"
                    value={conge}
                    onChange={(e) => setConge(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Sortie Unité (Statut Stock)</label>
                  <select
                    value={sortieUnite}
                    onChange={(e) => setSortieUnite(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none cursor-pointer"
                  >
                    <option value={1}>{lang === 'fr' ? '1 (En Service / Extérieur)' : '1 (في الخدمة / خارج)'}</option>
                    <option value={0}>{lang === 'fr' ? '0 (En Stock / Repris)' : '0 (في المستودع / مرجع)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">N° Bon Prise en Charge</label>
                  <input
                    type="text"
                    placeholder="e.g. 74625"
                    value={priseEnCharge}
                    onChange={(e) => setPriseEnCharge(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">N° Bon Sortie</label>
                  <input
                    type="text"
                    placeholder="e.g. 22776"
                    value={bonSortie}
                    onChange={(e) => setBonSortie(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Date Bon Prise en Charge</label>
                  <input
                    type="date"
                    value={dateBonPc}
                    onChange={(e) => setDateBonPc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Nom Complet Client *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AHMED SAMAKI"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Adresse Client</label>
                  <input
                    type="text"
                    placeholder="e.g. OULAD GHANAM"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Téléphone Client</label>
                  <input
                    type="text"
                    placeholder="e.g. 06 14 77 68 99"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">CIN Client</label>
                  <input
                    type="text"
                    placeholder="e.g. M150802"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Statut Refrigérateur</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl focus:border-sky-500 outline-none cursor-pointer"
                  >
                    <option value="ACTIF">{lang === 'fr' ? 'ACTIF' : 'نشط'}</option>
                    <option value="NON ACTIF">{lang === 'fr' ? 'NON ACTIF' : 'غير نشط'}</option>
                    <option value="PROBLEME">{lang === 'fr' ? 'PROBLÈME' : 'مشكلة'}</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingRecord(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-500/10 transition-all cursor-pointer"
                >
                  {lang === 'fr' ? 'Sauvegarder' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
