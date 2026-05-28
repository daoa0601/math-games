/**
 * DEV-ONLY: Design canvas / Storybook-style preview.
 *
 * Renders every screen in the design as an iframe pointing at the real
 * production route, at the target device dimensions. Use this to do visual
 * QA after touching any layout. The route returns 404 in production
 * (gated by `import.meta.env.DEV`), so it never reaches end users.
 *
 * Open at: /dev/design-canvas
 */

import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'

import type { ReactNode } from 'react'

export const Route = createFileRoute('/dev/design-canvas')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: DesignCanvasRoute,
})

const PHONE_W = 402
const PHONE_H = 874
const TABLET_W = 1180
const TABLET_H = 820

interface Artboard {
  id: string
  label: string
  src: string
  width: number
  height: number
  android?: boolean
}

const MOBILE_ARTBOARDS: readonly Artboard[] = [
  {
    id: 'm-home',
    label: 'Trang chủ · Home',
    src: '/',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-daily',
    label: 'Hôm nay · Daily',
    src: '/daily',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-mg',
    label: 'Đồ Thị · Magic Graph',
    src: '/games/magic-graph',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-sr',
    label: 'Cuộc Đua · Sequence Race',
    src: '/games/sequence-race',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-fb-build',
    label: 'Phân Số · Build (target 2⁄3)',
    src: '/games/fraction-builder?level=fb-easy-two-thirds',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-fb-compare',
    label: 'Phân Số · Compare (3⁄5 vs 2⁄3)',
    src: '/games/fraction-builder?level=fb-hard-compare-3-5-vs-2-3',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-eb',
    label: 'Phương Trình · Two-Step',
    src: '/games/equation-balance?level=eb-hard-8x-minus-3',
    width: PHONE_W,
    height: PHONE_H,
  },
  {
    id: 'm-prof',
    label: 'Hồ sơ · Profile (Android)',
    src: '/profile',
    width: PHONE_W,
    height: PHONE_H,
    android: true,
  },
]

const DESKTOP_ARTBOARDS: readonly Artboard[] = [
  {
    id: 'd-home',
    label: 'Desktop · Home',
    src: '/',
    width: 1280,
    height: 1240,
  },
  {
    id: 'd-daily',
    label: 'Desktop · Daily',
    src: '/daily',
    width: 1280,
    height: 1300,
  },
  {
    id: 'd-mg',
    label: 'Desktop · Magic Graph',
    src: '/games/magic-graph',
    width: 1280,
    height: 840,
  },
  {
    id: 'd-sr',
    label: 'Desktop · Sequence Race',
    src: '/games/sequence-race',
    width: 1280,
    height: 860,
  },
  {
    id: 'd-profile',
    label: 'Desktop · Profile',
    src: '/profile',
    width: 1280,
    height: 1480,
  },
]

function DesignCanvasRoute() {
  const [showDesktop, setShowDesktop] = useState(false)
  const [scale, setScale] = useState(1)

  return (
    <div className="body-noise relative min-h-screen pb-32">
      {/* Masthead */}
      <header className="border-b border-border bg-card/50 px-8 py-10">
        <p
          className="eyebrow text-muted-foreground"
          style={{ fontSize: '0.625rem' }}
        >
          ● Dev · Design canvas
        </p>
        <h1 className="font-display mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Toán Vui · Mobile-first preview
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Each artboard is the real production route rendered in an iframe at
          the target device dimensions. Mobile is the primary target; tablet
          next; desktop kept for system reference. Read the screen — don&apos;t
          hot-reload this page after every edit, just refresh the iframes you
          care about.
        </p>
      </header>

      <Section
        id="mobile"
        title="01 · Mobile · iPhone 402×874"
        subtitle="Primary target. Vietnamese-first copy, 44pt+ touch targets, bottom tab bar."
      >
        <div className="flex flex-wrap items-start gap-8 px-8 pb-12">
          {MOBILE_ARTBOARDS.map((ab) => (
            <ArtboardCard key={ab.id} ab={ab} scale={scale}>
              <DeviceFrame
                width={ab.width}
                height={ab.height}
                android={ab.android}
              >
                <iframe
                  title={ab.label}
                  src={ab.src}
                  style={{
                    width: ab.width,
                    height: ab.height,
                    border: 0,
                    display: 'block',
                  }}
                  loading="lazy"
                />
              </DeviceFrame>
            </ArtboardCard>
          ))}
        </div>
      </Section>

      <Section
        id="tablet"
        title="02 · Tablet · 1180×820"
        subtitle="iPad landscape — parent's iPad propped on a table."
      >
        <div className="px-8 pb-12">
          <ArtboardCard
            ab={{
              id: 't-home',
              label: 'Tablet · Trang chủ',
              src: '/',
              width: TABLET_W,
              height: TABLET_H,
            }}
            scale={scale}
          >
            <div
              style={{
                width: TABLET_W,
                height: TABLET_H,
                borderRadius: 18,
                overflow: 'hidden',
                background: 'var(--card)',
                boxShadow: 'var(--card-shadow-long)',
                border: '1px solid var(--border)',
              }}
            >
              <iframe
                title="Tablet · Trang chủ"
                src="/"
                style={{
                  width: TABLET_W,
                  height: TABLET_H,
                  border: 0,
                  display: 'block',
                }}
                loading="lazy"
              />
            </div>
          </ArtboardCard>
        </div>
      </Section>

      {showDesktop ? (
        <Section
          id="desktop"
          title="03 · Desktop · reference"
          subtitle="Kept for completeness — classroom workstation use, after-school cafés."
        >
          <div className="flex flex-wrap items-start gap-10 px-8 pb-16">
            {DESKTOP_ARTBOARDS.map((ab) => (
              <ArtboardCard key={ab.id} ab={ab} scale={Math.min(scale, 0.6)}>
                <div
                  style={{
                    width: ab.width,
                    height: ab.height,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--card)',
                    boxShadow: 'var(--card-shadow-long)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <iframe
                    title={ab.label}
                    src={ab.src}
                    style={{
                      width: ab.width,
                      height: ab.height,
                      border: 0,
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                </div>
              </ArtboardCard>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── Tweaks panel ─────────────────────────────────────── */}
      <aside
        className="font-sans fixed right-6 bottom-6 z-50 w-64 rounded-2xl border border-border bg-card/95 p-4 shadow-(--card-shadow-long) backdrop-blur"
        aria-label="Canvas tweaks"
      >
        <div
          className="eyebrow text-muted-foreground"
          style={{ fontSize: '0.625rem' }}
        >
          ● Tweaks
        </div>
        <p className="font-display mt-1 text-sm font-medium tracking-tight">
          Canvas controls
        </p>

        <label className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Show desktop reference</span>
          <input
            type="checkbox"
            checked={showDesktop}
            onChange={(event) => setShowDesktop(event.target.checked)}
          />
        </label>

        <label className="mt-3 block text-xs">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-muted-foreground">Scale</span>
            <span className="font-mono text-foreground tabular-nums">
              {scale.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.05}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="w-full"
          />
        </label>

        <p
          className="mt-4 leading-snug text-muted-foreground"
          style={{ fontSize: '0.625rem', lineHeight: 1.5 }}
        >
          Each artboard owns its game theme via{' '}
          <code className="font-mono">theme-&lt;id&gt;</code>; color identity
          comes from <code className="font-mono">--game-gradient</code> + the
          glyph primitives.
        </p>
        <p
          className="mt-2 leading-snug text-muted-foreground"
          style={{ fontSize: '0.625rem', lineHeight: 1.5 }}
        >
          Dev-only route. Returns 404 in production.
        </p>
      </aside>
    </div>
  )
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section id={id}>
      <header className="px-8 pt-10 pb-5">
        <h2 className="font-display text-xl font-medium tracking-tight md:text-2xl">
          {title}
        </h2>
        <p
          className="mt-1 max-w-2xl leading-relaxed text-muted-foreground"
          style={{ fontSize: '0.8125rem' }}
        >
          {subtitle}
        </p>
      </header>
      {children}
    </section>
  )
}

function ArtboardCard({
  ab,
  scale,
  children,
}: {
  ab: Artboard
  scale: number
  children: ReactNode
}) {
  const scaledW = Math.ceil((ab.width + 40) * scale)
  const scaledH = Math.ceil((ab.height + 40) * scale)
  return (
    <figure
      className="m-0 flex flex-col gap-2"
      style={{ width: scaledW, minHeight: scaledH + 40 }}
    >
      <figcaption className="flex items-baseline justify-between text-[0.6875rem]">
        <span className="font-medium text-foreground">{ab.label}</span>
        <a
          href={ab.src}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-muted-foreground tabular-nums transition-colors hover:text-foreground"
        >
          {ab.width}×{ab.height} ↗
        </a>
      </figcaption>
      <div
        style={{
          width: scaledW,
          height: scaledH,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: ab.width + 40,
            height: ab.height + 40,
          }}
        >
          {children}
        </div>
      </div>
    </figure>
  )
}

/* ── Device frame ──────────────────────────────────────────────
 * Minimal bezel — dark rounded rectangle around the iframe.
 * iOS gets corners ≈ 56px (matches iPhone 16/Pro), Android gets
 * a squarer 32px frame.
 */
function DeviceFrame({
  width,
  height,
  android,
  children,
}: {
  width: number
  height: number
  android?: boolean
  children: ReactNode
}) {
  const outerRadius = android ? 32 : 56
  const innerRadius = android ? 22 : 44
  return (
    <div
      style={{
        width: width + 40,
        height: height + 40,
        padding: 20,
        borderRadius: outerRadius,
        background: 'oklch(0.18 0.005 50)',
        boxShadow:
          '0 1px 0 oklch(1 0 0 / 0.05) inset, 0 30px 60px oklch(0.2 0.01 50 / 0.25)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: innerRadius,
          overflow: 'hidden',
          background: 'var(--card)',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}
