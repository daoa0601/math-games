import { describe, it, expect } from 'vitest'
import { puzzleTemplates } from '../puzzles'
import { checkSolvability } from '../solver'

describe('MagicGraph Preset Validation', () => {
  describe('all puzzle templates should be solvable', () => {
    puzzleTemplates.forEach((template) => {
      it(`${template.name} should have a valid solution`, () => {
        // Create a full puzzle config for testing
        const puzzle = {
          ...template,
          id: `test_${template.name}`,
        }

        const result = checkSolvability(puzzle)

        expect(
          result.solvable,
          `
          Puzzle "${template.name}" is not solvable!
          - Target sum: ${template.targetSum}
          - Available numbers: ${template.availableNumbers.join(', ')}
          - Number of lines: ${template.lines.length}
        `,
        ).toBe(true)
      })
    })
  })

  describe('all puzzle templates should have isSolvable flag', () => {
    puzzleTemplates.forEach((template) => {
      it(`${template.name} should have isSolvable: true`, () => {
        expect(
          template.isSolvable,
          `
          Puzzle "${template.name}" is missing isSolvable field or it's not true.
        `,
        ).toBe(true)
      })
    })
  })

  describe('solvability consistency', () => {
    it('every template with isSolvable: true should actually be solvable by the solver', () => {
      const mismatched: string[] = []

      for (const template of puzzleTemplates) {
        const puzzle = { ...template, id: `test_${template.name}` }
        const result = checkSolvability(puzzle)

        if (template.isSolvable && !result.solvable) {
          mismatched.push(template.name)
        }
      }

      expect(mismatched).toEqual([])
    })
  })
})
