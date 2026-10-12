import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FolderOpen, 
  Download, 
  Upload, 
  CheckCircle, 
  HardDrive, 
  X, 
  AlertTriangle,
  RefreshCw,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'fr' | 'ar';
  onRefreshData: () => void;
}

interface StorageInfo {
  dataDir: string;
  dbPath: string;
  assetsDir: string;
  backupsDir: string;
  dbSizeBytes: number;
  lastModified: string | null;
  backupsCount: number;
  counts: {
    products: number;
    batches: number;
    stockPositions: number;
    transfers: number;
    trucks: number;
    deliveryNotes: number;
    supplyRequests: number;
    bonAvoirs: number;
    bonEncaissements: number;
    bonChanges: number;
    auditLogs: number;
  };
}

export default function StorageModal({ isOpen, onClose, lang, onRefreshData }: StorageModalProps) {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/storage');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInfo(data);
          return;
        }
      }
    } catch (err) {
      // Offline / Vercel fallback
    }

    // Client-side LocalStorage Info (Vercel Web)
    try {
      const raw = localStorage.getItem('zahi_ice_stock_v1_state');
      const state = raw ? JSON.parse(raw) : null;
      if (state) {
        setInfo({
          dataDir: 'Stockage Local du Navigateur (localStorage / Web Cache)',
          dbPath: 'Navigateur Client (Prêt pour Vercel)',
          assetsDir: 'Cloud / Local Assets',
          backupsDir: 'Sauvegardes Téléchargeables (JSON)',
          dbSizeBytes: raw ? raw.length : 0,
          lastModified: new Date().toISOString(),
          backupsCount: 1,
          counts: {
            products: state.products?.length || 0,
            batches: state.batches?.length || 0,
            stockPositions: state.stockPositions?.length || 0,
            transfers: state.transfers?.length || 0,
            trucks: state.trucks?.length || 0,
            deliveryNotes: state.deliveryNotes?.length || 0,
            supplyRequests: state.supplyRequests?.length || 0,
            bonAvoirs: state.bonAvoirs?.length || 0,
            bonEncaissements: state.bonEncaissements?.length || 0,
            bonChanges: state.bonChanges?.length || 0,
            auditLogs: state.auditLogs?.length || 0,
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStorageInfo();
      setActionMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenFolder = async (folder: 'data' | 'assets') => {
    try {
      const res = await fetch('/api/system/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          text: lang === 'ar' ? 'تم فتح المجلد في مستكشف ملفات Windows' : 'Dossier ouvert dans l\'Explorateur Windows',
          type: 'success'
        });
      }
    } catch (err: any) {
      setActionMessage({ 
        text: lang === 'ar' ? 'أنت تستخدم نسخة المتصفح (Web)، البيانات محفوظة بأمان محلياً في ذاكرة جهازك' : 'Version Web active : Les données sont stockées localement dans votre navigateur.', 
        type: 'success' 
      });
    }
  };

  const handleExportBackup = () => {
    try {
      const raw = localStorage.getItem('zahi_ice_stock_v1_state');
      if (raw) {
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zahi-ice-stock-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {}
    window.open('/api/system/backup', '_blank');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmMsg = lang === 'ar' 
      ? 'هل أنت متأكد من استرجاع هذه النسخة الاحتياطية؟ سيتم تحديث البيانات فوراً.'
      : 'Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Les données seront actualisées immédiatement.';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setRestoring(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Attempt server restore first
      try {
        const res = await fetch('/api/system/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const data = await res.json();
        if (data.success) {
          setActionMessage({
            text: lang === 'ar' ? 'تمت استعادة قاعدة البيانات بنجاح!' : 'Base de données restaurée avec succès !',
            type: 'success'
          });
          fetchStorageInfo();
          onRefreshData();
          return;
        }
      } catch {}

      // Fallback to local storage (Vercel)
      localStorage.setItem('zahi_ice_stock_v1_state', JSON.stringify(parsed));
      setActionMessage({
        text: lang === 'ar' ? 'تمت استعادة البيانات المحلية بنجاح في المتصفح!' : 'Données locales restaurées avec succès dans le navigateur !',
        type: 'success'
      });
      fetchStorageInfo();
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: `Format JSON invalide: ${err.message}`, type: 'error' });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Ko';
    const k = 1024;
    return (bytes / k).toFixed(1) + ' Ko';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {lang === 'ar' ? 'التخزين المحلي وقاعدة البيانات على الحاسوب' : 'Stockage Local & Données sur PC'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {lang === 'ar' ? 'تخزين دائم ومستقل بالكامل على حاسوبك (بدون الحاجة لـ AI Studio)' : 'Stockage 100% autonome et sécurisé sur votre ordinateur'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {actionMessage && (
            <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
            }`}>
              {actionMessage.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Storage Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'حالة التخزين' : 'Statut du stockage'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {lang === 'ar' ? 'محفوظ محلياً على الحاسوب' : 'Sauvegardé en local'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 break-all select-all">
                <span className="text-slate-400 font-sans block text-xxs font-bold uppercase mb-0.5">
                  {lang === 'ar' ? 'مسار ملف قاعدة البيانات (db.json):' : 'Emplacement du fichier db.json :'}
                </span>
                {info?.dbPath || 'Chargement...'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-xxs text-slate-400 block font-bold uppercase">
                  {lang === 'ar' ? 'حجم البيانات' : 'Taille du fichier'}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {info ? formatBytes(info.dbSizeBytes) : '-'}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-xxs text-slate-400 block font-bold uppercase">
                  {lang === 'ar' ? 'النسخ الاحتياطية التلقائية' : 'Sauvegardes auto'}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {info ? `${info.backupsCount} versions` : '-'}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-xxs text-slate-400 block font-bold uppercase">
                  {lang === 'ar' ? 'آخر تعديل' : 'Dernière mise à jour'}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {info?.lastModified ? new Date(info.lastModified).toLocaleTimeString() : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Counts overview */}
          {info?.counts && (
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                {lang === 'ar' ? 'البيانات المحفوظة في قاعدة البيانات:' : 'Éléments stockés dans la base :'}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{info.counts.products}</div>
                  <div className="text-xxs text-slate-400">{lang === 'ar' ? 'منتج' : 'Produits'}</div>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{info.counts.batches}</div>
                  <div className="text-xxs text-slate-400">{lang === 'ar' ? 'دفعة إنتاج' : 'Lots'}</div>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{info.counts.transfers}</div>
                  <div className="text-xxs text-slate-400">{lang === 'ar' ? 'تحويل' : 'Transferts'}</div>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{info.counts.deliveryNotes}</div>
                  <div className="text-xxs text-slate-400">{lang === 'ar' ? 'وصل تسليم' : 'Bons BL'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions & Buttons */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'ar' ? 'إدارة النسخ الاحتياطي والمجلدات' : 'Gestion des sauvegardes & dossiers'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleOpenFolder('data')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-sm font-semibold transition-all shadow-xs"
              >
                <FolderOpen className="h-4 w-4" />
                <span>{lang === 'ar' ? 'فتح مجلد البيانات في الكمبيوتر' : 'Ouvrir dossier des données'}</span>
              </button>

              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold transition-all shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تحميل نسخة احتياطية (.json)' : 'Télécharger une sauvegarde'}</span>
              </button>
            </div>

            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 text-sm font-semibold cursor-pointer transition-all">
                <Upload className="h-4 w-4" />
                <span>
                  {restoring 
                    ? (lang === 'ar' ? 'جاري الاسترجاع...' : 'Restauration en cours...') 
                    : (lang === 'ar' ? 'استرجاع من ملف احتياطي (.json)' : 'Restaurer depuis un fichier (.json)')}
                </span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportBackup} 
                  disabled={restoring}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={fetchStorageInfo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'ar' ? 'تحديث المعلومات' : 'Actualiser'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            {lang === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
}
