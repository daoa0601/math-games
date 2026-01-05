import { useState, useEffect } from 'react';
import { usePlayer } from '@/shared/contexts';
import { BottomNav, type NavTabId } from '@/shared/components/layout';
import { SkipLinks } from '@/shared/components';
import { CompactHeader } from './CompactHeader';
import { PlayTab, ProfileTab, LearnTab, SettingsTab } from './tabs';
import './Dashboard.css';

export function Dashboard() {
  const { profile, currentRankInfo, checkStreak } = usePlayer();
  const [activeTab, setActiveTab] = useState<NavTabId>('home');

  // Check streak on mount
  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  return (
    <div className="page">
      <SkipLinks mainId="dashboard-main" />
      <div className="content-wrap">
        <CompactHeader
          profile={profile}
          rankInfo={currentRankInfo}
          streak={profile.streak}
        />
        <main id="dashboard-main" tabIndex={-1}>
          {activeTab === 'home' && <PlayTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'learn' && <LearnTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
