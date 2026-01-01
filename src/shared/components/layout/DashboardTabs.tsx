import { useTranslation } from 'react-i18next';
import './DashboardTabs.css';

export type DashboardTabId = 'play' | 'stats' | 'achievements';

interface DashboardTabsProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  achievementCount: { unlocked: number; total: number };
}

interface TabConfig {
  id: DashboardTabId;
  icon: string;
  labelKey: string;
}

const TABS: TabConfig[] = [
  { id: 'play', icon: '🎮', labelKey: 'dashboard.tabs.play' },
  { id: 'stats', icon: '📊', labelKey: 'dashboard.tabs.stats' },
  { id: 'achievements', icon: '🏆', labelKey: 'dashboard.tabs.achievements' },
];

export function DashboardTabs({ activeTab, onTabChange, achievementCount }: DashboardTabsProps) {
  const { t } = useTranslation();

  return (
    <nav className="dashboard-tabs" role="tablist" aria-label={t('dashboard.tabsLabel')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          className={`dashboard-tabs__tab ${activeTab === tab.id ? 'dashboard-tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="dashboard-tabs__icon">{tab.icon}</span>
          <span className="dashboard-tabs__label">{t(tab.labelKey)}</span>
          {tab.id === 'achievements' && (
            <span className="dashboard-tabs__badge">
              {achievementCount.unlocked}/{achievementCount.total}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
