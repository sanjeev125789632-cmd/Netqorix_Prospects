import React from 'react';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarClock,
  Download,
  Database,
  Moon,
  Sun,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { APP_CONFIG } from '../config';

export type ActiveTab = 'dashboard' | 'prospects' | 'call-first' | 'follow-ups';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  tierACount: number;
  followUpsCount: number;
  onOpenBackupModal: () => void;
  onExportCsv: () => void;
  onLock: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  tierACount,
  followUpsCount,
  onOpenBackupModal,
  onExportCsv,
  onLock
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'prospects' as ActiveTab,
      label: 'Prospects',
      icon: Users,
      badge: `${APP_CONFIG.EXPECTED_TOTAL}`
    },
    {
      id: 'call-first' as ActiveTab,
      label: 'Call First',
      icon: PhoneCall,
      badge: `${tierACount}`,
      highlightBadge: true
    },
    {
      id: 'follow-ups' as ActiveTab,
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: followUpsCount > 0 ? `${followUpsCount}` : null,
      alertBadge: followUpsCount > 0
    }
  ];

  const handleTabClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg tracking-tighter">N</span>
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Netqorix <span className="text-brand-600 dark:text-brand-400 font-medium">Prospects</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 -mt-1 tracking-wider uppercase font-mono">
                  {APP_CONFIG.EXPECTED_TOTAL.toLocaleString('en-IN')} Sales Leads
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 ml-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm border border-brand-200/60 dark:border-brand-800/60'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.alertBadge
                            ? 'bg-rose-500 text-white animate-pulse'
                            : item.highlightBadge
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Export CSV */}
            <button
              onClick={onExportCsv}
              title="Export filtered/all prospects to CSV"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Export CSV</span>
            </button>

            {/* Backup & Restore JSON */}
            <button
              onClick={onOpenBackupModal}
              title="Backup & restore notes/statuses JSON"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
              <span className="hidden sm:inline">Data Backup</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Lock Passcode */}
            <button
              onClick={onLock}
              title="Lock sales workspace"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.alertBadge
                        ? 'bg-rose-500 text-white'
                        : item.highlightBadge
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <button
              onClick={() => {
                onExportCsv();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                onOpenBackupModal();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
