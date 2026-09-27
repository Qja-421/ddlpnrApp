import { useState } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import type { TabType } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AtelierRedaction } from './components/AtelierRedaction.tsx';
import { RegistreActes, DossierRecord } from './components/RegistreActes.tsx';
import { SuiviPTA } from './components/SuiviPTA.tsx';
import { RapportTrimestriel } from './components/RapportTrimestriel.tsx';
import { ReferentielTextes } from './components/ReferentielTextes.tsx';
import { MoteurTarifsActivites } from './components/MoteurTarifsActivites.tsx';
import { ModuleTerrainRecouvrement } from './components/ModuleTerrainRecouvrement.tsx';
import { SessionProvider, useSession } from './lib/sessionContext.tsx';
import { SessionLoginModal } from './components/SessionLoginModal.tsx';
import { LandingPageConnexion } from './components/LandingPageConnexion.tsx';

function MainAppContent() {
  const { isAuthenticated } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleOpenInAtelier = (_dossier: DossierRecord) => {
    setActiveTab('atelier');
  };

  const handleOpenAtelierWithActivity = (_activityCode: string) => {
    setActiveTab('atelier');
  };

  const handleSuccessLogin = (targetTab: TabType) => {
    setActiveTab(targetTab);
  };

  // If not authenticated, render the Republican & Field Agent Landing Page
  if (!isAuthenticated) {
    return <LandingPageConnexion onSuccessLogin={handleSuccessLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-[#f9f9ff] text-[#161c27] antialiased selection:bg-[#d5e3ff] selection:text-[#001c3b]">
      {/* Menu Vertical à Gauche (Sidebar Officielle) */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Zone de Travail Principale (Décalée de la Sidebar sur grand écran) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 w-full">
        <main className="flex-1 w-full pt-16 lg:pt-6 pb-8 px-3 sm:px-6 max-w-7xl mx-auto main-content-area">
          {activeTab === 'dashboard' && <Dashboard onNavigateToTab={setActiveTab} />}
          {activeTab === 'agenda' && <ModuleTerrainRecouvrement initialSubTab="agenda-rdv" />}
          {activeTab === 'terrain' && <ModuleTerrainRecouvrement initialSubTab="recensement" />}
          {activeTab === 'terminal-mobile' && <ModuleTerrainRecouvrement initialSubTab="mode-mobile" />}
          {activeTab === 'registre' && <RegistreActes onOpenInAtelier={handleOpenInAtelier} />}
          {activeTab === 'atelier' && <AtelierRedaction />}
          {activeTab === 'rapport-trimestriel' && <RapportTrimestriel />}
          {activeTab === 'suivi-pta' && <SuiviPTA onNavigateToTab={setActiveTab} />}
          {activeTab === 'tarifs' && (
            <MoteurTarifsActivites onInjectIntoActe={handleOpenAtelierWithActivity} />
          )}
          {activeTab === 'referentiel' && <ReferentielTextes />}
        </main>

        {/* Pied de page officiel */}
        <Footer />
      </div>
      <SessionLoginModal />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <MainAppContent />
    </SessionProvider>
  );
}
