/**
 * SettingsTab - App settings and preferences
 * Linear Editorial design
 */

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher, SoundToggle } from '@/shared/components';
import './SettingsTab.css';

interface SettingsTabProps {
  onFeedbackClick?: () => void;
}

export function SettingsTab({ onFeedbackClick }: SettingsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-tab" role="tabpanel" id="panel-settings">
      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.preferences')}</h2>

        <div className="settings-row">
          <div className="settings-row__label">
            <span className="settings-row__name">{t('settings.sound')}</span>
            <span className="settings-row__description">{t('settings.soundDescription')}</span>
          </div>
          <SoundToggle />
        </div>

        <div className="settings-row">
          <div className="settings-row__label">
            <span className="settings-row__name">{t('settings.language')}</span>
            <span className="settings-row__description">{t('settings.languageDescription')}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.support')}</h2>

        <div className="settings-row settings-row--clickable" onClick={onFeedbackClick}>
          <div className="settings-row__label">
            <span className="settings-row__name">{t('feedback.title')}</span>
            <span className="settings-row__description">{t('feedback.description')}</span>
          </div>
          <span className="settings-row__arrow" aria-hidden="true">→</span>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">{t('settings.about')}</h2>

        <div className="settings-info">
          <div className="settings-info__row">
            <span className="settings-info__label">{t('settings.version')}</span>
            <span className="settings-info__value">3.0.0</span>
          </div>
          <div className="settings-info__row">
            <span className="settings-info__label">{t('settings.theme')}</span>
            <span className="settings-info__value">Linear Editorial</span>
          </div>
        </div>
      </section>
    </div>
  );
}
