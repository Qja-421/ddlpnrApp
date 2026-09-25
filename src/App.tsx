import { useState } from 'react';
import { Navbar, TabType } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AtelierRedaction } from './components/AtelierRedaction.tsx';
import { RegistreActes, DossierRecord } from './components/RegistreActes.tsx';
import { SuiviPTA } from './components/SuiviPTA.tsx';
import { ReferentielTextes } from './components/ReferentielTextes.tsx';
import { MoteurTarifsActivites } from './components/MoteurTarifsActivites.tsx';
import { ModuleTerrainRecouvrement } from './components/ModuleTerrainRecouvrement.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleOpenInAtelier = (_dossier: DossierRecord) => {
    setActiveTab('atelier');
  };

  const handleOpenAtelierWithActivity = (_activityCode: string) => {
    setActiveTab('atelier');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#161c27] antialiased selection:bg-[#d5e3ff] selection:text-[#001c3b]">
      {/* Official Fixed Navigation Header */}
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Administrative Workplace */}
      <main className="flex-1 w-full pt-20 xl:pt-24 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {activeTab === 'dashboard' && <Dashboard onNavigateToTab={setActiveTab} />}
          {activeTab === 'terrain' && <ModuleTerrainRecouvrement />}
          {activeTab === 'agenda' && <ModuleTerrainRecouvrement initialSubTab="agenda-rdv" />}
          {activeTab === 'atelier' && <AtelierRedaction />}
          {activeTab === 'registre' && <RegistreActes onOpenInAtelier={handleOpenInAtelier} />}
          {activeTab === 'tarifs' && (
            <MoteurTarifsActivites onInjectIntoActe={handleOpenAtelierWithActivity} />
          )}
          {activeTab === 'suivi-pta' && <SuiviPTA />}
          {activeTab === 'referentiel' && <ReferentielTextes />}
        </div>
      </main>

      {/* Official Footnote and Archive Credentials */}
      <Footer />
    </div>
  );
}
