/**
 * FeedbackModal - Allows users to submit feedback about games or the app
 * Uses mailto: to route feedback to developer email
 */

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '@/shared/hooks/accessibility';
import './FeedbackModal.css';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'general' | 'magic-graph' | 'sequence-race' | 'shape-architect' | 'bug';

// Update this email to receive feedback
const FEEDBACK_EMAIL = 'feedback@mathgames.example.com';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useFocusTrap({
    containerRef,
    onEscape: onClose,
    enabled: isOpen,
    autoFocus: true,
    restoreFocus: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const subject = encodeURIComponent(
      `[Math Games Feedback] ${t(`feedback.types.${feedbackType}`)}`
    );
    const body = encodeURIComponent(
      `Type: ${t(`feedback.types.${feedbackType}`)}\n\n${message}\n\n---\nSent from Math Games App`
    );

    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

    setSubmitted(true);
    setTimeout(() => {
      setMessage('');
      setFeedbackType('general');
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    setMessage('');
    setFeedbackType('general');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="feedback-modal" onClick={handleClose}>
      <div className="feedback-modal__backdrop" aria-hidden="true" />
      <div
        className="feedback-modal__card"
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="feedback-modal__header">
          <h2 id="feedback-modal-title" className="feedback-modal__title">
            {t('feedback.title')}
          </h2>
          <button
            className="feedback-modal__close"
            onClick={handleClose}
            aria-label={t('learn.close')}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="feedback-modal__body">
          {submitted ? (
            <div className="feedback-modal__success">
              <span className="feedback-modal__success-icon" aria-hidden="true">✓</span>
              <p>{t('feedback.thankYou')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="feedback-form__field">
                <label htmlFor="feedback-type" className="feedback-form__label">
                  {t('feedback.typeLabel')}
                </label>
                <select
                  id="feedback-type"
                  className="feedback-form__select"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                >
                  <option value="general">{t('feedback.types.general')}</option>
                  <option value="magic-graph">{t('feedback.types.magic-graph')}</option>
                  <option value="sequence-race">{t('feedback.types.sequence-race')}</option>
                  <option value="shape-architect">{t('feedback.types.shape-architect')}</option>
                  <option value="bug">{t('feedback.types.bug')}</option>
                </select>
              </div>

              <div className="feedback-form__field">
                <label htmlFor="feedback-message" className="feedback-form__label">
                  {t('feedback.messageLabel')}
                </label>
                <textarea
                  id="feedback-message"
                  className="feedback-form__textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('feedback.placeholder')}
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                className="feedback-form__submit action action--primary"
                disabled={!message.trim()}
              >
                {t('feedback.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default FeedbackModal;
