/**
 * Rank Up Overlay Component
 * Celebration modal when player reaches a new rank
 *
 * Accessibility:
 * - Focus trap keeps keyboard focus within modal
 * - Escape key dismisses the overlay
 * - Auto-focuses the continue button
 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { playSound } from '../../utils';
import { getRankInfo, getNextRank, type PlayerRank } from '../../services';
import { Button } from '../Button';
import { useFocusTrap } from '../../hooks';
import './RankUpOverlay.css';

interface RankUpOverlayProps {
  previousRank: PlayerRank;
  newRank: PlayerRank;
  onClose: () => void;
}

export function RankUpOverlay({
  previousRank,
  newRank,
  onClose,
}: RankUpOverlayProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const previousRankInfo = getRankInfo(previousRank);
  const newRankInfo = getRankInfo(newRank);
  const nextRankInfo = getNextRank(newRank);

  // Ref to track if animation should continue
  const animatingRef = useRef(true);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Focus trap with Escape key handling
  useFocusTrap({
    containerRef: modalRef,
    enabled: isVisible,
    autoFocus: true,
    onEscape: handleClose,
  });

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Play celebration effects
    playSound('win');

    // Lazy load and fire confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const startConfetti = async () => {
      try {
        const { default: confetti } = await import('canvas-confetti');

        const frame = () => {
          if (!animatingRef.current) return;

          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#9B59B6'],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#9B59B6'],
          });

          if (Date.now() < end && animatingRef.current) {
            requestAnimationFrame(frame);
          }
        };

        frame();
      } catch {
        // Silently fail if confetti fails to load
      }
    };

    startConfetti();

    return () => {
      animatingRef.current = false;
    };
  }, []);

  return (
    <div
      className={`rank-up-overlay ${isVisible ? 'rank-up-overlay--visible' : ''}`}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className={`rank-up-modal ${isVisible ? 'rank-up-modal--visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rank-up-title"
        aria-modal="true"
      >
        {/* Decorative stars */}
        <div className="rank-up-modal__stars" aria-hidden="true">
          <span className="rank-up-modal__star rank-up-modal__star--1">⭐</span>
          <span className="rank-up-modal__star rank-up-modal__star--2">✨</span>
          <span className="rank-up-modal__star rank-up-modal__star--3">🌟</span>
          <span className="rank-up-modal__star rank-up-modal__star--4">⭐</span>
          <span className="rank-up-modal__star rank-up-modal__star--5">✨</span>
        </div>

        {/* Title */}
        <h2 id="rank-up-title" className="rank-up-modal__title">
          {t('rankUp.title')}
        </h2>

        {/* Rank Transition */}
        <div className="rank-up-modal__transition">
          <div className="rank-up-modal__old-rank">
            <span className="rank-up-modal__rank-icon">{previousRankInfo.icon}</span>
            <span className="rank-up-modal__rank-name">
              {t(previousRankInfo.displayNameKey)}
            </span>
          </div>

          <div className="rank-up-modal__arrow">→</div>

          <div className="rank-up-modal__new-rank">
            <span className="rank-up-modal__rank-icon rank-up-modal__rank-icon--new">
              {newRankInfo.icon}
            </span>
            <span className="rank-up-modal__rank-name rank-up-modal__rank-name--new">
              {t(newRankInfo.displayNameKey)}
            </span>
          </div>
        </div>

        {/* Congratulations */}
        <p className="rank-up-modal__message">
          {t('rankUp.reached', { rank: t(newRankInfo.displayNameKey) })}
        </p>

        {/* Next Rank Info */}
        {nextRankInfo && (
          <div className="rank-up-modal__next-goal">
            <span className="rank-up-modal__next-label">
              {t('rankUp.nextGoal')}
            </span>
            <span className="rank-up-modal__next-rank">
              {nextRankInfo.icon} {t(nextRankInfo.displayNameKey)}
            </span>
            <span className="rank-up-modal__next-requirements">
              {t('rankUp.requirements', {
                games: nextRankInfo.requiredGames,
                solves: nextRankInfo.requiredSolves,
              })}
            </span>
          </div>
        )}

        {/* Continue Button */}
        <Button
          variant="primary"
          size="large"
          onClick={handleClose}
          className="rank-up-modal__button"
        >
          {t('rankUp.continue')}
        </Button>
      </div>
    </div>
  );
}

export default RankUpOverlay;
