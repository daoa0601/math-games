import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './BottomNav.css';

export type NavTabId = 'home' | 'profile' | 'learn' | 'settings';

interface BottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onFeedbackClick?: () => void;
}

interface NavItem {
  id: NavTabId;
  glyph: string;
  labelKey: string;
}

// Main navigation tabs (shown on both mobile and desktop)
const MAIN_TABS: NavItem[] = [
  { id: 'home', glyph: '⬡', labelKey: 'nav.home' },
  { id: 'profile', glyph: '⬢', labelKey: 'nav.profile' },
  { id: 'learn', glyph: '⎔', labelKey: 'nav.learn' },
];

// Settings tab (shown in desktop sidebar, hidden in mobile "more" menu)
const SETTINGS_TAB: NavItem = { id: 'settings', glyph: '✦', labelKey: 'nav.settings' };

export function BottomNav({ activeTab, onTabChange, onFeedbackClick }: BottomNavProps) {
  const { t } = useTranslation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    if (!isMoreMenuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
        moreButtonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMoreMenuOpen]);

  const handleMoreClick = useCallback(() => {
    setIsMoreMenuOpen((prev) => !prev);
  }, []);

  const handleSettingsClick = useCallback(() => {
    onTabChange('settings');
    setIsMoreMenuOpen(false);
  }, [onTabChange]);

  const handleFeedbackClick = useCallback(() => {
    onFeedbackClick?.();
    setIsMoreMenuOpen(false);
  }, [onFeedbackClick]);

  // Memoized handler for tab changes to avoid creating new functions in map loop
  const handleTabClick = useCallback((id: NavTabId) => {
    onTabChange(id);
  }, [onTabChange]);

  const isMoreActive = activeTab === 'settings' || isMoreMenuOpen;

  return (
    <nav className="nav" role="tablist" aria-label={t('nav.label')}>
      {/* Main tabs - visible on both mobile and desktop */}
      {MAIN_TABS.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={activeTab === item.id}
          aria-controls={`panel-${item.id}`}
          tabIndex={activeTab === item.id ? 0 : -1}
          className={`nav__item ${activeTab === item.id ? 'nav__item--active' : ''}`}
          onClick={() => handleTabClick(item.id)}
        >
          <span className="nav__icon" aria-hidden="true">{item.glyph}</span>
          <span className="nav__label">{t(item.labelKey)}</span>
        </button>
      ))}

      {/* Settings tab - visible only on desktop sidebar */}
      <button
        role="tab"
        aria-selected={activeTab === SETTINGS_TAB.id}
        aria-controls={`panel-${SETTINGS_TAB.id}`}
        tabIndex={activeTab === SETTINGS_TAB.id ? 0 : -1}
        className={`nav__item nav__item--desktop-only ${activeTab === SETTINGS_TAB.id ? 'nav__item--active' : ''}`}
        onClick={handleSettingsClick}
      >
        <span className="nav__icon" aria-hidden="true">{SETTINGS_TAB.glyph}</span>
        <span className="nav__label">{t(SETTINGS_TAB.labelKey)}</span>
      </button>

      {/* Feedback button - visible only on desktop sidebar */}
      <button
        type="button"
        className="nav__item nav__item--desktop-only"
        onClick={onFeedbackClick}
        aria-label={t('feedback.title')}
      >
        <span className="nav__icon" aria-hidden="true">✉</span>
        <span className="nav__label">{t('nav.feedback')}</span>
      </button>

      {/* More button - visible only on mobile */}
      <div className="nav__more-wrapper nav__more-wrapper--mobile-only">
        <button
          ref={moreButtonRef}
          type="button"
          className={`nav__item ${isMoreActive ? 'nav__item--active' : ''}`}
          onClick={handleMoreClick}
          aria-expanded={isMoreMenuOpen}
          aria-haspopup="menu"
          aria-label={t('nav.more')}
        >
          <span className="nav__icon" aria-hidden="true">⋮</span>
          <span className="nav__label">{t('nav.more')}</span>
        </button>

        {/* More menu popover */}
        {isMoreMenuOpen && (
          <div
            ref={menuRef}
            className="nav__menu"
            role="menu"
            aria-label={t('nav.moreMenu')}
          >
            <button
              className={`nav__menu-item ${activeTab === 'settings' ? 'nav__menu-item--active' : ''}`}
              onClick={handleSettingsClick}
              role="menuitem"
            >
              <span className="nav__menu-icon" aria-hidden="true">⚙</span>
              <span>{t('nav.settings')}</span>
            </button>
            <button
              className="nav__menu-item"
              onClick={handleFeedbackClick}
              role="menuitem"
            >
              <span className="nav__menu-icon" aria-hidden="true">✉</span>
              <span>{t('nav.feedback')}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
