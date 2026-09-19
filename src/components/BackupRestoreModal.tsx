import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileJson
} from 'lucide-react';
import { useTracking } from '../context/TrackingContext';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const {
    trackingMap,
    exportBackupJson,
    importBackupJson,
    resetAllTracking
  } = useTracking();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const trackedCount = Object.keys(trackingMap).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupJson(content);
      if (res.success) {
        setImportStatus({
          success: true,
          message: `Successfully imported and restored tracking data for ${res.count} leads!`
        });
      } else {
        setImportStatus({
          success: false,
          message: res.error || 'Failed to parse JSON backup file.'
        });
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Backup & Restore Sales Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Safe JSON backup for all statuses, notes, emails, and follow-ups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Current Status Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <FileJson className="w-4 h-4 text-brand-500" />
              <span>Currently Saved in LocalStorage:</span>
            </div>
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
              {trackedCount} lead records
            </span>
          </div>

          {/* Export Action */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Download Backup (JSON)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save your notes and sales outreach progress to your computer or phone. You can restore it anytime.
            </p>
            <button
              onClick={exportBackupJson}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Tracking Backup JSON</span>
            </button>
          </div>

          {/* Import / Restore Action */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              2. Restore from Backup File
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload a previously exported JSON backup file to restore or merge your notes and statuses.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-accent-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select JSON Backup File to Restore</span>
            </button>
          </div>

          {/* Status Alert */}
          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Danger Zone: Reset */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Reset All Local Data
              </div>
              <div className="text-[11px] text-slate-400">
                Clears all tracked notes & statuses
              </div>
            </div>
            <button
              onClick={resetAllTracking}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
