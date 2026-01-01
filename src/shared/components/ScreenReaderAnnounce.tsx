import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';

/**
 * Priority levels for announcements
 * - polite: Waits for screen reader to finish current speech
 * - assertive: Interrupts current speech immediately
 */
export type AnnouncePriority = 'polite' | 'assertive';

interface AnnounceContextValue {
  announce: (message: string, priority?: AnnouncePriority) => void;
  clearAnnouncements: () => void;
}

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

/**
 * ScreenReaderAnnounceProvider
 *
 * Provides a context for announcing messages to screen readers.
 * Place this near the root of your app.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ScreenReaderAnnounceProvider>
 *       <GameRoutes />
 *     </ScreenReaderAnnounceProvider>
 *   );
 * }
 * ```
 */
export function ScreenReaderAnnounceProvider({ children }: { children: ReactNode }) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    if (priority === 'assertive') {
      // Clear and re-set to trigger announcement
      setAssertiveAnnouncement('');
      requestAnimationFrame(() => {
        setAssertiveAnnouncement(message);
      });
    } else {
      setPoliteAnnouncement('');
      requestAnimationFrame(() => {
        setPoliteAnnouncement(message);
      });
    }

    // Clear after announcement has been read (approximate)
    setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveAnnouncement('');
      } else {
        setPoliteAnnouncement('');
      }
    }, 3000);
  }, []);

  /**
   * Clear all pending announcements
   */
  const clearAnnouncements = useCallback(() => {
    setPoliteAnnouncement('');
    setAssertiveAnnouncement('');
  }, []);

  return (
    <AnnounceContext.Provider value={{ announce, clearAnnouncements }}>
      {children}

      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {politeAnnouncement}
      </div>

      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {assertiveAnnouncement}
      </div>
    </AnnounceContext.Provider>
  );
}

/**
 * useAnnounce
 *
 * Hook to access the announcement function from context.
 *
 * @example
 * ```tsx
 * function Timer({ seconds }) {
 *   const { announce } = useAnnounce();
 *
 *   useEffect(() => {
 *     if (seconds === 30) {
 *       announce('30 seconds remaining', 'polite');
 *     }
 *     if (seconds === 10) {
 *       announce('10 seconds remaining', 'assertive');
 *     }
 *   }, [seconds, announce]);
 *
 *   return <div>{seconds}s</div>;
 * }
 * ```
 */
export function useAnnounce(): AnnounceContextValue {
  const context = useContext(AnnounceContext);

  if (!context) {
    // Return a no-op version if used outside provider
    // This prevents errors in tests or when provider is missing
    return {
      announce: () => {},
      clearAnnouncements: () => {},
    };
  }

  return context;
}

/**
 * ScreenReaderAnnounce
 *
 * Standalone component for simple announcements.
 * Use when you don't need the full provider pattern.
 *
 * @example
 * ```tsx
 * function GameStatus({ status }) {
 *   return (
 *     <>
 *       <div>Status: {status}</div>
 *       <ScreenReaderAnnounce message={status} />
 *     </>
 *   );
 * }
 * ```
 */
export function ScreenReaderAnnounce({
  message,
  priority = 'polite',
}: {
  message: string;
  priority?: AnnouncePriority;
}) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      // Clear and re-set to trigger announcement
      setCurrentMessage('');
      requestAnimationFrame(() => {
        setCurrentMessage(message);
      });

      // Clear after announcement
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {currentMessage}
    </div>
  );
}

export default ScreenReaderAnnounceProvider;
