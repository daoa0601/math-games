import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './DashboardTabs.css';

export type DashboardTabId = 'play' | 'stats' | 'achievements' | 'learn';

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
  { id: 'learn', icon: '📖', labelKey: 'dashboard.tabs.learn' },
];

export function DashboardTabs({ activeTab, onTabChange, achievementCount }: DashboardTabsProps) {
  const { t } = useTranslation();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const tabCount = TABS.length;
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % tabCount;
          break;
        case 'ArrowLeft':
          nextIndex = (currentIndex - 1 + tabCount) % tabCount;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = tabCount - 1;
          break;
        default:
          return; // Don't prevent default for other keys
      }

      e.preventDefault();
      onTabChange(TABS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    },
    [onTabChange]
  );

  return (
    <nav className="dashboard-tabs" role="tablist" aria-label={t('dashboard.tabsLabel')}>
      {TABS.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={`dashboard-tabs__tab ${activeTab === tab.id ? 'dashboard-tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          data-testid={`tab-${tab.id}`}
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
