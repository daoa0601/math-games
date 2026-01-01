/**
 * Tutorial State Machine Tests
 *
 * Tests the tutorialMachine for proper state transitions and context updates.
 */

import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { tutorialMachine } from '../tutorialMachine';

describe('tutorialMachine', () => {
  // ═══════════════════════════════════════════════════════════════════
  // INITIAL STATE
  // ═══════════════════════════════════════════════════════════════════

  it('starts in idle state', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
    actor.stop();
  });

  it('initializes context with correct values', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 5 } });
    actor.start();
    const context = actor.getSnapshot().context;
    expect(context.currentStep).toBe(0);
    expect(context.totalSteps).toBe(5);
    expect(context.completedSteps.size).toBe(0);
    expect(context.skipped).toBe(false);
    actor.stop();
  });

  // ═══════════════════════════════════════════════════════════════════
  // START TRANSITION
  // ═══════════════════════════════════════════════════════════════════

  it('transitions to active on START', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('active');
    expect(actor.getSnapshot().context.currentStep).toBe(1);
    actor.stop();
  });

  // ═══════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════

  it('advances step on NEXT', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().context.currentStep).toBe(2);
    actor.stop();
  });

  it('decrements step on PREVIOUS when not on first step', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().context.currentStep).toBe(3);
    actor.send({ type: 'PREVIOUS' });
    expect(actor.getSnapshot().context.currentStep).toBe(2);
    actor.stop();
  });

  it('does not go below step 1 on PREVIOUS', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().context.currentStep).toBe(1);
    actor.send({ type: 'PREVIOUS' });
    // Should remain at step 1, not go to 0
    expect(actor.getSnapshot().context.currentStep).toBe(1);
    actor.stop();
  });

  // ═══════════════════════════════════════════════════════════════════
  // COMPLETION
  // ═══════════════════════════════════════════════════════════════════

  it('completes on final NEXT', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 2 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('completed');
    actor.stop();
  });

  it('marks steps as completed with COMPLETE_STEP', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'COMPLETE_STEP', step: 1 });
    expect(actor.getSnapshot().context.completedSteps.has(1)).toBe(true);
    actor.send({ type: 'COMPLETE_STEP', step: 2 });
    expect(actor.getSnapshot().context.completedSteps.has(2)).toBe(true);
    expect(actor.getSnapshot().context.completedSteps.size).toBe(2);
    actor.stop();
  });

  // ═══════════════════════════════════════════════════════════════════
  // SKIP
  // ═══════════════════════════════════════════════════════════════════

  it('skips to completed on SKIP', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 5 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().value).toBe('completed');
    expect(actor.getSnapshot().context.skipped).toBe(true);
    actor.stop();
  });

  it('preserves current step when skipping', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 5 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'SKIP' });
    // Step should remain where it was when skipped
    expect(actor.getSnapshot().context.currentStep).toBe(3);
    actor.stop();
  });

  // ═══════════════════════════════════════════════════════════════════
  // RESTART
  // ═══════════════════════════════════════════════════════════════════

  it('restarts tutorial from completed state', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 2 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('completed');

    actor.send({ type: 'RESTART' });
    expect(actor.getSnapshot().value).toBe('active');
    expect(actor.getSnapshot().context.currentStep).toBe(1);
    expect(actor.getSnapshot().context.skipped).toBe(false);
    expect(actor.getSnapshot().context.completedSteps.size).toBe(0);
    actor.stop();
  });

  it('clears skipped flag on restart', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 5 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().context.skipped).toBe(true);

    actor.send({ type: 'RESTART' });
    expect(actor.getSnapshot().context.skipped).toBe(false);
    actor.stop();
  });

  // ═══════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════

  it('ignores invalid events in idle state', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 3 } });
    actor.start();
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'PREVIOUS' });
    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().value).toBe('idle');
    expect(actor.getSnapshot().context.currentStep).toBe(0);
    actor.stop();
  });

  it('ignores NEXT and PREVIOUS in completed state', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 1 } });
    actor.start();
    actor.send({ type: 'START' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('completed');

    actor.send({ type: 'NEXT' });
    actor.send({ type: 'PREVIOUS' });
    expect(actor.getSnapshot().value).toBe('completed');
    actor.stop();
  });

  it('handles single step tutorial', () => {
    const actor = createActor(tutorialMachine, { input: { totalSteps: 1 } });
    actor.start();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().context.currentStep).toBe(1);
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('completed');
    actor.stop();
  });
});
