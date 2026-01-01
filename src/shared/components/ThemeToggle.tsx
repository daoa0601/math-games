import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const icon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️';
  const label = t(`theme.${theme}`, theme);

  return (
    <button
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label={t('theme.toggle', 'Toggle theme')}
      title={label}
    >
      <span className="theme-toggle__icon">{icon}</span>
    </button>
  );
}
