/**
 * FeedbackModal - Allows users to submit feedback about games or the app
 * Uses mailto: to route feedback to developer email
 * Now uses BottomSheet for consistent modal behavior
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/components/ui';
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
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const footerContent = !submitted && (
    <button
      type="submit"
      form="feedback-form"
      className="feedback-form__submit action action--primary"
      disabled={!message.trim()}
    >
      {t('feedback.submit')}
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t('feedback.title')}
      className="feedback-modal-sheet"
      footer={footerContent}
    >
      {submitted ? (
        <div className="feedback-modal__success">
          <span className="feedback-modal__success-icon" aria-hidden="true">✓</span>
          <p>{t('feedback.thankYou')}</p>
        </div>
      ) : (
        <form id="feedback-form" onSubmit={handleSubmit} className="feedback-form">
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
        </form>
      )}
    </BottomSheet>
  );
}

export default FeedbackModal;
