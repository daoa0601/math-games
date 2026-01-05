import { useTranslation } from 'react-i18next';

export type NavTabId = 'home' | 'profile' | 'learn' | 'settings';

interface BottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
}

interface NavItem {
  id: NavTabId;
  glyph: string;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', glyph: '⌂', labelKey: 'nav.home' },
  { id: 'profile', glyph: '◯', labelKey: 'nav.profile' },
  { id: 'learn', glyph: '◇', labelKey: 'nav.learn' },
  { id: 'settings', glyph: '⚙', labelKey: 'nav.settings' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav className="nav" role="tablist" aria-label={t('nav.label')}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={activeTab === item.id}
          aria-controls={`panel-${item.id}`}
          tabIndex={activeTab === item.id ? 0 : -1}
          className={`nav__item ${activeTab === item.id ? 'nav__item--active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="nav__icon" aria-hidden="true">{item.glyph}</span>
          <span>{t(item.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
