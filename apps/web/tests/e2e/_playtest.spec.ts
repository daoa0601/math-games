// Comprehensive playtest: drives each game to completion with correct selectors,
// measures per-step timing, and captures friction notes. The output is logged
// as PLAYTEST_REPORT JSON that we read into docs/playtest-report.md.

import { test, type Page } from '@playwright/test'

interface Timing {
  step: string
  ms: number
}
interface Report {
  game: string
  scenario: string
  result: 'solved' | 'failed'
  steps: Timing[]
  friction: string[]
}
const reports: Report[] = []

function timer() {
  const t0 = Date.now()
  return (step: string): Timing => ({ step, ms: Date.now() - t0 })
}
async function bodyText(page: Page) {
  return page.evaluate(() => document.body.innerText)
}

// ============================================================
// SHAPE-ARCHITECT — guided solve on 2D easy
// ============================================================
test('shape-architect 2D easy guided', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'shape-architect',
    scenario: '2D-easy-guided',
    result: 'failed',
    steps,
    friction,
  }

  await page.goto('http://localhost:3000/games/shape-architect', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1200)

  // Hover the Guided button first to trigger the prefetch, then click after
  // a beat. This mirrors a real player who moves their mouse to the button
  // before clicking, and lets us measure the prefetch's effect.
  const guidedBtn = page.locator('button:has-text("Guided")').first()
  await guidedBtn.hover()
  await page.waitForTimeout(800)

  const t = timer()
  await page.locator('button:has-text("Guided")').first().click()
  await page.waitForTimeout(2500)
  steps.push(t('guided-fetch'))

  // "Place piece" (lowercase p) is the actual button text.
  for (let i = 0; i < 8; i++) {
    const btn = page.locator('button:has-text("Place piece")').first()
    if (!(await btn.isVisible().catch(() => false))) break
    const st = timer()
    await btn.click()
    await page.waitForTimeout(900)
    steps.push(st(`place-${i}`))
    const body = await bodyText(page)
    if (/Placed 3\/3|Walkthrough complete/i.test(body)) {
      report.result = 'solved'
      break
    }
  }
  if (report.result !== 'solved') friction.push('never reached Placed 3/3')

  // Friction: time per placement (server round-trip + render)
  const avgPlace =
    steps
      .filter((s) => s.step.startsWith('place-'))
      .reduce((a, b) => a + b.ms, 0) /
    Math.max(1, steps.filter((s) => s.step.startsWith('place-')).length)
  if (avgPlace > 1200)
    friction.push(
      `avg placement ${Math.round(avgPlace)}ms (server round-trip heavy)`,
    )

  await page.screenshot({ path: 'test-results/playtest/sa-2d.png' })
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

// ============================================================
// SHAPE-ARCHITECT — 3D cube guided
// ============================================================
test('shape-architect 3D cube guided', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'shape-architect',
    scenario: '3D-cube-guided',
    result: 'failed',
    steps,
    friction,
  }

  await page.goto('http://localhost:3000/games/shape-architect', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1200)
  const t = timer()
  await page.locator('button:has-text("Two-Layer Cube")').first().click()
  await page.waitForTimeout(1500)
  steps.push(t('select-3d'))
  // Confirm 3D auto-selected (ToggleGroupItem uses data-state="on").
  const is3d = await page.evaluate(() => {
    const tog = [...document.querySelectorAll('button')].find(
      (b) => (b.textContent ?? '').trim() === '3D',
    )
    return tog ? tog.getAttribute('data-state') === 'on' : false
  })
  if (!is3d) friction.push('3D view did not auto-activate for 3D level')

  await page.locator('button:has-text("Guided")').first().click()
  await page.waitForTimeout(3000)
  steps.push(t('guided-fetch'))

  for (let i = 0; i < 6; i++) {
    const btn = page.locator('button:has-text("Place piece")').first()
    if (!(await btn.isVisible().catch(() => false))) break
    const st = timer()
    await btn.click()
    await page.waitForTimeout(1000)
    steps.push(st(`place-3d-${i}`))
    const body = await bodyText(page)
    if (/Walkthrough complete/i.test(body)) {
      report.result = 'solved'
      break
    }
  }
  if (report.result !== 'solved') friction.push('3D never completed')

  await page.screenshot({ path: 'test-results/playtest/sa-3d.png' })
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

// ============================================================
// MAGIC-GRAPH — Line of Three (easy)
// ============================================================
test('magic-graph Line of Three', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'magic-graph',
    scenario: 'line-of-three',
    result: 'failed',
    steps,
    friction,
  }

  await page.goto('http://localhost:3000/games/magic-graph', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1200)
  const t = timer()
  await page.locator('button:has-text("Line of Three")').first().click()
  await page.waitForTimeout(1000)
  steps.push(t('select-line3'))

  // Line of Three: target 6, place 1,2,3.
  for (const n of [1, 2, 3]) {
    const rt = timer()
    await page.locator(`button:has-text("${n}")`).first().click()
    await page.waitForTimeout(150)
    steps.push(rt(`rail-${n}`))
    const nt = timer()
    await page.evaluate(() => {
      const empties = [...document.querySelectorAll('button')].filter((b) => {
        const s = getComputedStyle(b)
        return (
          s.position === 'absolute' &&
          b.getBoundingClientRect().width === 48 &&
          !(b.textContent ?? '').trim()
        )
      })
      if (empties[0]) (empties[0] as HTMLElement).click()
    })
    await page.waitForTimeout(400)
    steps.push(nt(`node-${n}`))
  }
  await page.waitForTimeout(800)
  const body = await bodyText(page)
  if (/Solved/i.test(body)) report.result = 'solved'
  else
    friction.push(
      `no Solved marker; tail="${body.slice(-150).replace(/\s+/g, ' ')}"`,
    )

  await page.screenshot({ path: 'test-results/playtest/mg.png' })
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

// ============================================================
// SEQUENCE-RACE — vs AI
// ============================================================
test('sequence-race vs AI', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'sequence-race',
    scenario: 'vs-ai',
    result: 'failed',
    steps,
    friction,
  }

  await page.goto('http://localhost:3000/games/sequence-race', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1200)

  for (let turn = 0; turn < 25; turn++) {
    const state = await page.evaluate(() => {
      const body = document.body.innerText
      const gameOver = /You win|You lose|Winner|Draw/i.test(body)
      const moves = [...document.querySelectorAll('button')]
        .filter(
          (b) => /^\+\d+$/.test((b.textContent ?? '').trim()) && !b.disabled,
        )
        .map((b) => (b.textContent ?? '').trim())
      return { gameOver, moves }
    })
    if (state.gameOver) {
      report.result = 'solved'
      break
    }
    if (state.moves.length === 0) {
      friction.push(`turn ${turn}: no moves; checking game-over again`)
      const body = await bodyText(page)
      if (/win|lose|draw/i.test(body)) report.result = 'solved'
      break
    }
    const st = timer()
    await page.locator(`button:has-text("${state.moves[0]}")`).first().click()
    await page.waitForTimeout(1000) // AI think
    steps.push(st(`turn-${turn}-${state.moves[0]}`))
  }
  if (report.result !== 'solved') friction.push('never saw win/lose text')

  await page.screenshot({ path: 'test-results/playtest/sr.png' })
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

// ============================================================
// PATTERN-DETECTIVE — 3 levels
// ============================================================
test('pattern-detective 3 levels', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'pattern-detective',
    scenario: '3-levels',
    result: 'failed',
    steps,
    friction,
  }
  let solvedCount = 0

  await page.goto('http://localhost:3000/games/pattern-detective', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1000)

  for (let level = 0; level < 3; level++) {
    // Get the choices — only enabled answer buttons in the answer grid.
    const choices = await page.evaluate(() => {
      const grids = [
        ...document.querySelectorAll(
          '.grid.grid-cols-2.sm\\:grid-cols-4, .grid.sm\\:grid-cols-4, [class*="grid-cols-4"]',
        ),
      ]
      for (const g of grids) {
        const btns = [...g.querySelectorAll('button')].filter(
          (b) => /^\d+$/.test((b.textContent ?? '').trim()) && !b.disabled,
        )
        if (btns.length >= 4)
          return btns.map((b) => Number((b.textContent ?? '').trim()))
      }
      return []
    })
    let solvedThis = false
    let tries = 0
    for (const c of choices) {
      tries++
      const st = timer()
      // Answer buttons disable after submit (result card shows). Bail if so.
      const btn = page.locator(`button:has-text("${c}")`).first()
      const enabled = await btn.isEnabled().catch(() => false)
      if (!enabled) break
      await btn.click()
      await page.waitForTimeout(500)
      steps.push(st(`L${level}-try${tries}-${c}`))
      const body = await bodyText(page)
      if (/Solved|correct|missing number is/i.test(body)) {
        solvedThis = true
        solvedCount++
        if (tries === 1)
          friction.push(`L${level}: solved first try (too easy?)`)
        else friction.push(`L${level}: took ${tries} tries`)
        break
      }
    }
    if (!solvedThis) friction.push(`L${level}: never solved`)
    const next = page.locator('button:has-text("Next")').first()
    if (await next.isVisible().catch(() => false)) {
      await next.click()
      // Wait for the next level's answer buttons to re-enable.
      await page
        .waitForFunction(
          () =>
            [...document.querySelectorAll('button')].some(
              (b) => /^\d+$/.test((b.textContent ?? '').trim()) && !b.disabled,
            ),
          undefined,
          { timeout: 3000 },
        )
        .catch(() => {})
      await page.waitForTimeout(300)
    }
  }
  report.result = solvedCount >= 2 ? 'solved' : 'failed'
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

// ============================================================
// FRACTION-BUILDER — build 1/2
// ============================================================
test('fraction-builder build 1/2', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'fraction-builder',
    scenario: 'build-1/2',
    result: 'failed',
    steps,
    friction,
  }

  await page.goto('http://localhost:3000/games/fraction-builder', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1200)

  // The build mode shows numerator row + denominator row. Click num=1 then denom=2 then Check.
  const t = timer()
  await page.evaluate(() => {
    const all = [...document.querySelectorAll('button')].filter(
      (b) => /^\d+$/.test((b.textContent ?? '').trim()) && !b.disabled,
    )
    // First 4 are numerator (1,2,3,4), next 4 are denominator.
    const n1 = all.slice(0, 4).find((b) => (b.textContent ?? '').trim() === '1')
    const d2 = all.slice(4, 8).find((b) => (b.textContent ?? '').trim() === '2')
    if (n1) (n1 as HTMLElement).click()
    setTimeout(() => {
      if (d2) (d2 as HTMLElement).click()
    }, 150)
  })
  await page.waitForTimeout(500)
  // Check button.
  const checkBtn = page.locator('button:has-text("Check")').first()
  const enabled = await checkBtn.isEnabled().catch(() => false)
  if (!enabled) {
    friction.push(
      'Check button disabled even after picking numerator + denominator',
    )
  } else {
    await checkBtn.click()
    await page.waitForTimeout(600)
    steps.push(t('check'))
    const body = await bodyText(page)
    if (/Solved|correct/i.test(body)) report.result = 'solved'
    else
      friction.push(
        `not solved; tail="${body.slice(-200).replace(/\s+/g, ' ')}"`,
      )
  }

  await page.screenshot({ path: 'test-results/playtest/fb.png' })
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

// ============================================================
// EQUATION-BALANCE — fill ?+3=8 → answer 5
// ============================================================
test('equation-balance fill', async ({ page }) => {
  const steps: Timing[] = []
  const friction: string[] = []
  const report: Report = {
    game: 'equation-balance',
    scenario: 'fill',
    result: 'failed',
    steps,
    friction,
  }

  await page.goto('http://localhost:3000/games/equation-balance', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(1200)

  // Read the equation and solve it client-side.
  const equation = await page.evaluate(() => {
    const m = document.body.innerText.match(
      /\?\s*([+\-×÷*])\s*(\d+)\s*=\s*(\d+)/,
    )
    return m ? { op: m[1], n: Number(m[2]), rhs: Number(m[3]) } : null
  })
  if (!equation) {
    friction.push('could not parse equation')
  } else {
    // Solve: ? op n = rhs → ? = rhs inverse-op n
    let answer: number
    if (equation.op === '+') answer = equation.rhs - equation.n
    else if (equation.op === '-') answer = equation.rhs + equation.n
    else if (equation.op === '×' || equation.op === '*')
      answer = equation.rhs / equation.n
    else answer = equation.rhs * equation.n
    answer = Math.round(answer)

    const t = timer()
    // Click the answer. It's in the answer grid (4 buttons). Pick the right one
    // from the first grid-cols-4 group.
    const clicked = await page.evaluate((ans) => {
      const grids = [
        ...document.querySelectorAll(
          '[class*="grid-cols-4"], [class*="grid-cols-2"]',
        ),
      ]
      for (const g of grids) {
        const btns = [...g.querySelectorAll('button')].filter(
          (b) => /^-?\d+$/.test((b.textContent ?? '').trim()) && !b.disabled,
        )
        if (btns.length >= 4) {
          const target = btns.find(
            (b) => Number((b.textContent ?? '').trim()) === ans,
          )
          if (target) {
            ;(target as HTMLElement).click()
            return true
          }
        }
      }
      return false
    }, answer)
    if (!clicked) {
      friction.push(`could not click answer ${answer}`)
    } else {
      await page.waitForTimeout(300)
      // The answer choice alone may not auto-submit; click Check.
      const checkBtn = page.locator('button:has-text("Check")').first()
      if (await checkBtn.isVisible().catch(() => false)) {
        await checkBtn.click()
        await page.waitForTimeout(700)
        steps.push(t('check'))
        const body = await bodyText(page)
        if (/Solved|correct/i.test(body)) report.result = 'solved'
        else
          friction.push(
            `not solved; tail="${body.slice(-200).replace(/\s+/g, ' ')}"`,
          )
      }
    }
  }

  await page.screenshot({ path: 'test-results/playtest/eb.png' })
  reports.push(report)
  console.log('REPORT:', JSON.stringify(report))
})

test.afterAll(() => {
  console.log('PLAYTEST_FINAL:', JSON.stringify(reports, null, 2))
})
