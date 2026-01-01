/**
 * Tests for Tutorial Components
 *
 * Tests the Tutorial, TutorialStep, and TutorialTooltip components
 * for proper rendering, navigation, and callback behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tutorial } from '../Tutorial';
import { TutorialStep } from '../TutorialStep';
import { TutorialTooltip } from '../TutorialTooltip';

// ═══════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════

describe('Tutorial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // Basic Rendering
  // ─────────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <Tutorial totalSteps={3}>
          <div data-testid="child">Child content</div>
        </Tutorial>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders with tutorial container', () => {
      const { container } = render(
        <Tutorial totalSteps={2}>
          <div>Content</div>
        </Tutorial>
      );
      expect(container.querySelector('.tutorial-container')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Auto-Start Behavior
  // ─────────────────────────────────────────────────────────────────

  describe('autoStart', () => {
    it('auto-starts when autoStart is true (default)', async () => {
      render(
        <Tutorial totalSteps={2} autoStart={true}>
          <TutorialStep step={1}>
            <div data-testid="step1">Step 1</div>
          </TutorialStep>
        </Tutorial>
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1')).toBeInTheDocument();
      });
    });

    it('does not auto-start when autoStart is false', () => {
      render(
        <Tutorial totalSteps={2} autoStart={false}>
          <TutorialStep step={1}>
            <div data-testid="step1">Step 1</div>
          </TutorialStep>
        </Tutorial>
      );

      expect(screen.queryByTestId('step1')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Step Visibility
  // ─────────────────────────────────────────────────────────────────

  describe('step visibility', () => {
    it('shows step 1 content when on step 1', async () => {
      render(
        <Tutorial totalSteps={2} autoStart={true}>
          <TutorialStep step={1}>
            <div data-testid="step1">Step 1</div>
          </TutorialStep>
          <TutorialStep step={2}>
            <div data-testid="step2">Step 2</div>
          </TutorialStep>
        </Tutorial>
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('step2')).not.toBeInTheDocument();
    });

    it('shows step 2 after advancing from step 1', async () => {
      render(
        <Tutorial totalSteps={2} autoStart={true}>
          <TutorialStep step={1}>
            <TutorialTooltip>
              <span data-testid="step1-content">Step 1</span>
            </TutorialTooltip>
          </TutorialStep>
          <TutorialStep step={2}>
            <TutorialTooltip>
              <span data-testid="step2-content">Step 2</span>
            </TutorialTooltip>
          </TutorialStep>
        </Tutorial>
      );

      // Wait for step 1 to be visible
      await waitFor(() => {
        expect(screen.getByTestId('step1-content')).toBeInTheDocument();
      });

      // Click next to advance to step 2
      const nextButton = screen.getByText('tutorial.next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('step2-content')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('step1-content')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onComplete when tutorial finishes', async () => {
      const onComplete = vi.fn();
      render(
        <Tutorial totalSteps={1} onComplete={onComplete} autoStart={true}>
          <TutorialStep step={1}>
            <TutorialTooltip>Step 1</TutorialTooltip>
          </TutorialStep>
        </Tutorial>
      );

      // Wait for tooltip to render
      await waitFor(() => {
        expect(screen.getByText('tutorial.finish')).toBeInTheDocument();
      });

      // Click Finish button (shown on last step)
      const finishButton = screen.getByText('tutorial.finish');
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onSkip when skip is clicked', async () => {
      const onSkip = vi.fn();
      render(
        <Tutorial totalSteps={3} onSkip={onSkip} autoStart={true}>
          <TutorialStep step={1}>
            <TutorialTooltip>Step 1</TutorialTooltip>
          </TutorialStep>
        </Tutorial>
      );

      // Wait for tooltip to render
      await waitFor(() => {
        expect(screen.getByText('tutorial.skip')).toBeInTheDocument();
      });

      const skipButton = screen.getByText('tutorial.skip');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onComplete when skipped', async () => {
      const onComplete = vi.fn();
      const onSkip = vi.fn();
      render(
        <Tutorial totalSteps={3} onComplete={onComplete} onSkip={onSkip} autoStart={true}>
          <TutorialStep step={1}>
            <TutorialTooltip>Step 1</TutorialTooltip>
          </TutorialStep>
        </Tutorial>
      );

      await waitFor(() => {
        expect(screen.getByText('tutorial.skip')).toBeInTheDocument();
      });

      const skipButton = screen.getByText('tutorial.skip');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledTimes(1);
      });
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('shows Previous button on step 2 when showPrevious is true', async () => {
      render(
        <Tutorial totalSteps={2} autoStart={true}>
          <TutorialStep step={1}>
            <TutorialTooltip>Step 1</TutorialTooltip>
          </TutorialStep>
          <TutorialStep step={2}>
            <TutorialTooltip showPrevious={true}>Step 2</TutorialTooltip>
          </TutorialStep>
        </Tutorial>
      );

      // Wait for step 1
      await waitFor(() => {
        expect(screen.getByText('tutorial.next')).toBeInTheDocument();
      });

      // Advance to step 2
      fireEvent.click(screen.getByText('tutorial.next'));

      await waitFor(() => {
        expect(screen.getByText('tutorial.previous')).toBeInTheDocument();
      });
    });

    it('can navigate back with Previous button', async () => {
      render(
        <Tutorial totalSteps={2} autoStart={true}>
          <TutorialStep step={1}>
            <TutorialTooltip>
              <span data-testid="step1">Step 1</span>
            </TutorialTooltip>
          </TutorialStep>
          <TutorialStep step={2}>
            <TutorialTooltip showPrevious={true}>
              <span data-testid="step2">Step 2</span>
            </TutorialTooltip>
          </TutorialStep>
        </Tutorial>
      );

      // Wait for step 1
      await waitFor(() => {
        expect(screen.getByTestId('step1')).toBeInTheDocument();
      });

      // Go to step 2
      fireEvent.click(screen.getByText('tutorial.next'));

      await waitFor(() => {
        expect(screen.getByTestId('step2')).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.click(screen.getByText('tutorial.previous'));

      await waitFor(() => {
        expect(screen.getByTestId('step1')).toBeInTheDocument();
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// TutorialStep Tests
// ═══════════════════════════════════════════════════════════════════

describe('TutorialStep', () => {
  it('only renders when step matches current step', async () => {
    render(
      <Tutorial totalSteps={3} autoStart={true}>
        <TutorialStep step={1}>
          <div data-testid="step1">Step 1</div>
        </TutorialStep>
        <TutorialStep step={2}>
          <div data-testid="step2">Step 2</div>
        </TutorialStep>
        <TutorialStep step={3}>
          <div data-testid="step3">Step 3</div>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByTestId('step1')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('step2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step3')).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════
// TutorialTooltip Tests
// ═══════════════════════════════════════════════════════════════════

describe('TutorialTooltip', () => {
  it('renders tooltip content', async () => {
    render(
      <Tutorial totalSteps={1} autoStart={true}>
        <TutorialStep step={1}>
          <TutorialTooltip>
            <span data-testid="tooltip-content">Tooltip message</span>
          </TutorialTooltip>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });
  });

  it('shows progress indicator', async () => {
    render(
      <Tutorial totalSteps={3} autoStart={true}>
        <TutorialStep step={1}>
          <TutorialTooltip>Step 1</TutorialTooltip>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByText('tutorial.stepOf')).toBeInTheDocument();
    });
  });

  it('hides skip button when showSkip is false', async () => {
    render(
      <Tutorial totalSteps={2} autoStart={true}>
        <TutorialStep step={1}>
          <TutorialTooltip showSkip={false}>Step 1</TutorialTooltip>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByText('tutorial.next')).toBeInTheDocument();
    });

    expect(screen.queryByText('tutorial.skip')).not.toBeInTheDocument();
  });

  it('hides next button when showNext is false', async () => {
    render(
      <Tutorial totalSteps={2} autoStart={true}>
        <TutorialStep step={1}>
          <TutorialTooltip showNext={false}>Step 1</TutorialTooltip>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByText('tutorial.skip')).toBeInTheDocument();
    });

    expect(screen.queryByText('tutorial.next')).not.toBeInTheDocument();
  });

  it('shows finish button on last step', async () => {
    render(
      <Tutorial totalSteps={1} autoStart={true}>
        <TutorialStep step={1}>
          <TutorialTooltip>Last step</TutorialTooltip>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByText('tutorial.finish')).toBeInTheDocument();
    });

    expect(screen.queryByText('tutorial.next')).not.toBeInTheDocument();
  });

  it('has accessible dialog role', async () => {
    render(
      <Tutorial totalSteps={1} autoStart={true}>
        <TutorialStep step={1}>
          <TutorialTooltip>Step content</TutorialTooltip>
        </TutorialStep>
      </Tutorial>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
