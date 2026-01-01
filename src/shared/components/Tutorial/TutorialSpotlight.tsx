import { useEffect, useState } from 'react';
import { useTutorialContext } from './TutorialContext';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TutorialSpotlight() {
  const { highlightedElement, isActive } = useTutorialContext();
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!highlightedElement || !isActive) {
      setRect(() => null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(highlightedElement);
      if (element) {
        const domRect = element.getBoundingClientRect();
        const padding = 8;
        setRect({
          top: domRect.top - padding,
          left: domRect.left - padding,
          width: domRect.width + padding * 2,
          height: domRect.height + padding * 2,
        });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [highlightedElement, isActive]);

  if (!isActive || !rect) return null;

  return (
    <>
      <div className="tutorial-overlay" aria-hidden="true" />
      <div
        className="tutorial-spotlight"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        aria-hidden="true"
      />
    </>
  );
}
