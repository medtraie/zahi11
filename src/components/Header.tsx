/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, UserRole, AuditLog } from '../types';
import { translations } from '../translations';
import { 
  IceCream, 
  Sun, 
  Moon, 
  Globe, 
  Bell, 
  User as UserIcon, 
  RefreshCw, 
  AlertTriangle,
  LogOut,
  Sliders,
  CheckCircle,
  Truck,
  HardDrive
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  lang: 'fr' | 'ar';
  onLangChange: (lang: 'fr' | 'ar') => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onOpenStorageModal: () => void;
  notifications: Array<{ id: string; text: string; type: 'info' | 'warning' | 'error' | 'success'; time: string }>;
  onClearNotifications: () => void;
  syncPendingCount: number;
}

export default function Header({
  currentUser,
  onUserChange,
  lang,
  onLangChange,
  darkMode,
  onDarkModeToggle,
  onReset,
  onRefresh,
  onOpenStorageModal,
  notifications,
  onClearNotifications,
  syncPendingCount
}: HeaderProps) {
  const t = translations[lang];
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const availableRoles: Array<{ role: UserRole; name: string; depot?: string }> = [
    { role: 'Super Admin', name: 'Youssef Zahi (Super Admin)' },
    { role: 'Responsable Usine', name: 'Rachid Usine (Usine)' },
    { role: 'Responsable MICZ', name: 'Karim MICZ (MICZ)' },
    { role: 'Responsable Zone Logistique', name: 'Nabil Logistique (Zone Log)' },
    { role: 'Responsable Dépôt', name: 'Mourad Casa (Dépôt Casa)', depot: 'Casablanca' },
    { role: 'Responsable Dépôt', name: 'Omar Marrakech (Dépôt Kech)', depot: 'Marrakech' },
    { role: 'Responsable Dépôt', name: 'Ahmed Oujda (Dépôt Oujda)', depot: 'Oujda' },
    { role: 'Responsable Dépôt', name: 'Yassine Tanger (Dépôt Tanger)', depot: 'Tanger' },
    { role: 'Responsable Dépôt', name: 'Saïd Meknès (Dépôt Meknès)', depot: 'Meknès' },
    { role: 'Responsable Dépôt', name: 'Hassan Agadir (Dépôt Agadir)', depot: 'Agadir' },
    { role: 'Responsable Dépôt', name: 'Mustapha Safi (Dépôt Safi)', depot: 'Safi' },
    { role: 'Responsable Dépôt', name: 'Kamil Berrechid (Dépôt Berrechid)', depot: 'Berrechid' },
    { role: 'Chauffeur', name: 'Hamza Chauffeur (TRK-CA-01)', depot: 'Casablanca' },
    { role: 'Comptable', name: 'Laila Comptable (Finance)' },
    { role: 'Responsable Commercial', name: 'Adnane Commercial' }
  ];

  const handleSelectRole = (item: { role: UserRole; name: string; depot?: string }) => {
    onUserChange({
      id: `user-${item.role.toLowerCase().replace(/\s+/g, '-')}`,
      username: item.name.split(' ')[0].toLowerCase(),
      name: item.name.split(' (')[0],
      role: item.role,
      depot: item.depot
    });
    setShowRoleMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur shadow-xs transition-colors duration-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 cursor-default"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
            className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center"
          >
            <IceCream className="h-6 w-6" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                ZAHI
              </span>
              <span className="text-xs px-2 py-0.5 bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 rounded-full font-bold tracking-wide">
                ICE LOGISTICS
              </span>
            </div>
            <p className="text-xxs text-slate-400 dark:text-slate-500 font-bold -mt-0.5 uppercase tracking-wider">
              {t.subtitle}
            </p>
          </div>
        </motion.div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Refresh & Storage Buttons */}
          <button 
            onClick={onRefresh} 
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            title={t.refresh}
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            onClick={onOpenStorageModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/60 rounded-lg transition-all font-semibold"
            title={lang === 'ar' ? 'التخزين المحلي وقاعدة البيانات على الحاسوب' : 'Stockage Local & Données PC'}
          >
            <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{lang === 'ar' ? 'بيانات الحاسوب' : 'Stockage PC'}</span>
          </button>
          
          <button 
            onClick={onReset} 
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200/50 dark:border-rose-950/50 rounded-lg transition-all font-medium"
            title={t.reset}
          >
            {t.reset}
          </button>

          {/* Sync status for driver app simulation */}
          {syncPendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 rounded-lg text-xs font-semibold animate-bounce">
              <Truck className="h-3.5 w-3.5" />
              <span>{syncPendingCount} {lang === 'fr' ? 'en attente sync' : 'في انتظار المزامنة'}</span>
            </div>
          )}

          {/* Language Selector */}
          <button 
            onClick={() => onLangChange(lang === 'fr' ? 'ar' : 'fr')}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all flex items-center gap-1"
            title={t.language}
          >
            <Globe className="h-5 w-5" />
            <span className="text-xs font-bold uppercase">{lang === 'fr' ? 'ar' : 'fr'}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button 
            onClick={onDarkModeToggle}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            title={darkMode ? t.lightMode : t.darkMode}
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifMenu(!showNotifMenu); setShowRoleMenu(false); }}
              className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all relative"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-600 dark:bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-ping" />
              )}
            </button>
            
            {showNotifMenu && (
              <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm ${lang === 'ar' ? 'left-0 right-auto' : ''}`}>
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{t.notifications}</span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => { onClearNotifications(); setShowNotifMenu(false); }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {lang === 'fr' ? 'Effacer tout' : 'مسح الكل'}
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                      {t.noNotifications}
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="px-4 py-2.5 hover:bg-slate-55 dark:hover:bg-slate-800/40 flex gap-2.5 transition-colors">
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {n.type === 'error' && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                          {n.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                          {n.type === 'info' && <Bell className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-normal">{n.text}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Quick Switcher */}
          <div className="relative">
            <button 
              onClick={() => { setShowRoleMenu(!showRoleMenu); setShowNotifMenu(false); }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer transition-all"
            >
              <div className="h-7 w-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold leading-tight truncate max-w-[140px]">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{t[currentUser.role.toLowerCase().replace(/\s+/g, '') as keyof typeof t] || currentUser.role}</p>
              </div>
              <Sliders className="h-3.5 w-3.5 opacity-60 ml-1" />
            </button>

            {showRoleMenu && (
              <div className={`absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 text-slate-700 dark:text-slate-300 text-xs ${lang === 'ar' ? 'left-0 right-auto' : ''}`}>
                <div className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                  {lang === 'fr' ? 'Changer de Rôle Utilisateur' : 'تغيير دور المستخدم'}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {availableRoles.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectRole(item)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/30 ${
                        currentUser.role === item.role && currentUser.depot === item.depot
                          ? 'bg-blue-50/60 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 font-semibold'
                          : ''
                      }`}
                    >
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] opacity-70">
                          {t[item.role.toLowerCase().replace(/\s+/g, '') as keyof typeof t] || item.role} 
                          {item.depot ? ` - ${item.depot}` : ''}
                        </p>
                      </div>
                      {currentUser.role === item.role && currentUser.depot === item.depot && (
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
