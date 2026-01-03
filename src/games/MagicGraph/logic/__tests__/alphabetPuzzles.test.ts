import { describe, it, expect } from 'vitest';
import {
  alphabetPuzzles,
  easyLetters,
  mediumLetters,
  hardLetters,
} from '../alphabetPuzzles';
import { checkSolvability } from '../solver';
import { validatePuzzleStructure } from '../puzzleValidator';

describe('Alphabet Puzzle Solvability', () => {
  describe('all 26 letter puzzles should be solvable', () => {
    it.each(alphabetPuzzles.map((p) => [p.letter, p]))(
      'Letter %s should be solvable',
      (_letter, puzzle) => {
        const result = checkSolvability({ ...puzzle, id: `letter_${puzzle.letter}` });
        expect(result.solvable, `
          Letter "${puzzle.letter}" (${puzzle.name}) is not solvable!
          - Target sum: ${puzzle.targetSum}
          - Available numbers: ${puzzle.availableNumbers.join(', ')}
          - Number of lines: ${puzzle.lines.length}
        `).toBe(true);
      }
    );
  });

  describe('all letter puzzles should have exactly 3 nodes per line', () => {
    it.each(alphabetPuzzles.map((p) => [p.letter, p]))(
      'Letter %s should have all lines with exactly 3 nodes',
      (_letter, puzzle) => {
        puzzle.lines.forEach((line, i) => {
          expect(line.nodeIds.length, `
            Letter "${puzzle.letter}" line ${i + 1} (${line.id}) has ${line.nodeIds.length} nodes
          `).toBe(3);
        });
      }
    );
  });

  describe('all letter puzzles should pass structure validation', () => {
    it.each(alphabetPuzzles.map((p) => [p.letter, p]))(
      'Letter %s should pass structure validation',
      (_letter, puzzle) => {
        const result = validatePuzzleStructure(puzzle);
        expect(result.valid, `
          Letter "${puzzle.letter}" failed validation:
          ${result.errors.join('\n')}
        `).toBe(true);
      }
    );
  });
});

describe('Alphabet Puzzle Difficulty Classification', () => {
  it('should have 7 easy letters', () => {
    expect(easyLetters.length).toBe(7);
    easyLetters.forEach((puzzle) => {
      expect(puzzle.letterDifficulty).toBe('easy');
    });
  });

  it('should have 9 medium letters', () => {
    expect(mediumLetters.length).toBe(9);
    mediumLetters.forEach((puzzle) => {
      expect(puzzle.letterDifficulty).toBe('medium');
    });
  });

  it('should have 10 hard letters', () => {
    expect(hardLetters.length).toBe(10);
    hardLetters.forEach((puzzle) => {
      expect(puzzle.letterDifficulty).toBe('hard');
    });
  });

  it('should have exactly 26 letters total', () => {
    expect(alphabetPuzzles.length).toBe(26);
  });

  it('should have all unique letters', () => {
    const letters = alphabetPuzzles.map((p) => p.letter);
    const uniqueLetters = new Set(letters);
    expect(uniqueLetters.size).toBe(26);
  });

  it('should include all letters A-Z', () => {
    const letters = alphabetPuzzles.map((p) => p.letter).sort();
    const expected = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').sort();
    expect(letters).toEqual(expected);
  });
});

describe('Alphabet Puzzle Structure', () => {
  it.each(alphabetPuzzles.map((p) => [p.letter, p]))(
    'Letter %s should have isSolvable flag set to true',
    (_letter, puzzle) => {
      expect(puzzle.isSolvable).toBe(true);
    }
  );

  it.each(alphabetPuzzles.map((p) => [p.letter, p]))(
    'Letter %s should have matching node count and available numbers count',
    (_letter, puzzle) => {
      expect(puzzle.nodes.length).toBe(puzzle.availableNumbers.length);
    }
  );

  it.each(alphabetPuzzles.map((p) => [p.letter, p]))(
    'Letter %s should have no duplicate nodes in any line',
    (_letter, puzzle) => {
      puzzle.lines.forEach((line) => {
        const uniqueNodes = new Set(line.nodeIds);
        expect(uniqueNodes.size, `
          Letter "${puzzle.letter}" line ${line.id} has duplicate nodes: ${line.nodeIds.join(', ')}
        `).toBe(line.nodeIds.length);
      });
    }
  );
});
