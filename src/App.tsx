import React, { useState, useMemo, useEffect } from 'react';
import { allProspects, validateProspectsData } from './data/prospects';
import type { Prospect } from './types/prospect';
import { useTracking } from './context/TrackingContext';
import { Navbar, type ActiveTab } from './components/Navbar';
import { ValidationBanner } from './components/ValidationBanner';
import { PasscodeGate } from './components/PasscodeGate';
import { DashboardView } from './components/DashboardView';
import { ProspectsListView, type FilterState } from './components/ProspectsListView';
import { CallFirstView } from './components/CallFirstView';
import { FollowUpsView } from './components/FollowUpsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { exportProspectsToCsv } from './utils/exportCsv';
import { getISTDate } from './utils/callWindow';

export const App: React.FC = () => {
  const { trackingMap } = useTracking();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('netqorix_auth') === 'authenticated';
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Lead Detail Modal State
  const [selectedLead, setSelectedLead] = useState<Prospect | null>(null);

  // Backup & Restore Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Initial Filter overrides when jumping from Dashboard
  const [drillFilters, setDrillFilters] = useState<Partial<FilterState> | undefined>(undefined);

  // Validate dataset on load
  const validationSummary = useMemo(() => {
    return validateProspectsData(allProspects);
  }, []);

  // Compute Tier A count
  const tierACount = useMemo(() => {
    return allProspects.filter((p) => p.tier === 'A').length;
  }, []);

  // Compute scheduled follow-ups count
  const followUpsCount = useMemo(() => {
    const todayStr = getISTDate().toISOString().slice(0, 10);
    return allProspects.filter((p) => {
      const t = trackingMap[p.id];
      return t && t.followUpDate && t.followUpDate <= todayStr;
    }).length;
  }, [trackingMap]);

  // Handle drill-down navigation from dashboard clicks
  const handleDashboardFilter = (filters: {
    region?: string;
    city?: string;
    locality?: string;
    tier?: string;
    segment?: string;
    package?: string;
    phoneFilter?: string;
  }) => {
    setDrillFilters({
      region: filters.region || 'all',
      city: filters.city || 'all',
      locality: filters.locality || 'all',
      tier: filters.tier || 'all',
      segment: filters.segment || 'all',
      package: filters.package || 'all',
      phoneFilter: (filters.phoneFilter as any) || 'all'
    });
    setActiveTab('prospects');
  };

  // Lock workspace
  const handleLock = () => {
    localStorage.removeItem('netqorix_auth');
    setIsAuthenticated(false);
  };

  // Export CSV handler
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportProspectsToCsv(
      allProspects,
      trackingMap,
      `netqorix_prospects_full_export_${timestamp}.csv`
    );
  };

  // Navigation inside LeadDetailModal (Next/Prev)
  const currentLeadIndex = useMemo(() => {
    if (!selectedLead) return -1;
    return allProspects.findIndex((p) => p.id === selectedLead.id);
  }, [selectedLead]);

  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (currentLeadIndex === -1) return;
    if (direction === 'prev' && currentLeadIndex > 0) {
      setSelectedLead(allProspects[currentLeadIndex - 1]);
    } else if (direction === 'next' && currentLeadIndex < allProspects.length - 1) {
      setSelectedLead(allProspects[currentLeadIndex + 1]);
    }
  };

  // Keyboard shortcut listener (Escape to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedLead) {
        setSelectedLead(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLead]);

  // If not authenticated, show Passcode Gate
  if (!isAuthenticated) {
    return <PasscodeGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Integrity Validation Banner */}
      <ValidationBanner summary={validationSummary} />

      {/* Main Top Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'prospects' && activeTab !== 'prospects') {
            // Keep drill filters or clear
          }
          setActiveTab(tab);
        }}
        tierACount={tierACount}
        followUpsCount={followUpsCount}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onExportCsv={handleExportCsv}
        onLock={handleLock}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            prospects={allProspects}
            onNavigateToFilter={handleDashboardFilter}
          />
        )}

        {activeTab === 'prospects' && (
          <ProspectsListView
            key={JSON.stringify(drillFilters)}
            prospects={allProspects}
            onSelectLead={(lead) => setSelectedLead(lead)}
            initialFilters={drillFilters}
          />
        )}

        {activeTab === 'call-first' && (
          <CallFirstView
            prospects={allProspects}
            onSelectLead={(lead) => setSelectedLead(lead)}
          />
        )}

        {activeTab === 'follow-ups' && (
          <FollowUpsView
            prospects={allProspects}
            onSelectLead={(lead) => setSelectedLead(lead)}
          />
        )}
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          prospect={selectedLead}
          onClose={() => setSelectedLead(null)}
          onNavigate={handleModalNavigate}
          hasPrev={currentLeadIndex > 0}
          hasNext={currentLeadIndex < allProspects.length - 1}
        />
      )}

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};
