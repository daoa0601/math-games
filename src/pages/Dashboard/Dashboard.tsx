import { useState, useMemo, useEffect } from 'react';
import { usePlayer } from '@/shared/contexts';
import { DashboardTabs, type DashboardTabId } from '@/shared/components/layout';
import { ACHIEVEMENTS } from '@/shared/services/achievements';
import { CompactHeader } from './CompactHeader';
import { PlayTab, StatsTab, AchievementsTab } from './tabs';
import './Dashboard.css';

export function Dashboard() {
  const { profile, currentRankInfo, checkStreak } = usePlayer();
  const [activeTab, setActiveTab] = useState<DashboardTabId>('play');

  // Check streak on mount
  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const achievementCount = useMemo(
    () => ({
      unlocked: profile.achievements.length,
      total: ACHIEVEMENTS.length,
    }),
    [profile.achievements]
  );

  return (
    <div className="dashboard">
      <CompactHeader
        profile={profile}
        rankInfo={currentRankInfo}
        streak={profile.streak}
      />
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        achievementCount={achievementCount}
      />
      <main className="dashboard__content">
        {activeTab === 'play' && <PlayTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
      </main>
    </div>
  );
}
