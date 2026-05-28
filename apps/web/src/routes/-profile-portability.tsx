import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { ChangeEvent } from 'react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  useLocale,
  useT,
} from '@math-games/ui'
import { formatGameTitle } from '@/i18n-format'
import { importPlayerAchievementBackup } from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'
import { runServerAction } from '@/routes/-server-action-result'

interface AchievementBackupFile {
  app: 'math-games'
  kind: 'achievement-backup'
  version: 1
  exportedAt: string
  achievementIds: string[]
}

function createAchievementBackup(
  achievementIds: readonly string[],
): AchievementBackupFile {
  return {
    app: 'math-games',
    kind: 'achievement-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    achievementIds: [...achievementIds],
  }
}

function parseAchievementBackup(text: string): string[] | null {
  const parsed: unknown = JSON.parse(text)
  if (parsed === null || typeof parsed !== 'object') return null

  const record = parsed as Record<string, unknown>
  if (
    record.app !== 'math-games' ||
    record.kind !== 'achievement-backup' ||
    record.version !== 1 ||
    !Array.isArray(record.achievementIds)
  )
    return null

  const ids = record.achievementIds.filter(
    (id): id is string => typeof id === 'string',
  )
  return ids.length > 0 ? ids : null
}

interface ProfilePortabilityProps {
  achievementIds: readonly string[]
  progressRows: PlayerProgressSummary[]
  onImported: (ids: string[]) => void
}

export function ProfilePortability({
  achievementIds,
  progressRows,
  onImported,
}: ProfilePortabilityProps) {
  const t = useT()
  const { locale } = useLocale()
  const importAchievements = useServerFn(importPlayerAchievementBackup)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  function handleExport() {
    const backup = createAchievementBackup(achievementIds)
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `math-games-achievements-${backup.exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''

    if (file === null) {
      setImportStatus(t('profile.achievementImportEmpty'))
      return
    }

    let idsToImport: string[] | null = null
    try {
      idsToImport = parseAchievementBackup(await file.text())
    } catch {
      idsToImport = null
    }

    if (idsToImport === null) {
      setImportStatus(t('profile.achievementImportInvalid'))
      return
    }

    const result = await runServerAction(
      () => importAchievements({ data: { achievementIds: idsToImport } }),
      t('status.achievementImportFailed'),
    )

    if (!result.ok) {
      setImportStatus(result.message)
      return
    }

    onImported(result.value.achievementIds)
    setImportStatus(
      `${t('profile.achievementImportSuccess')} ${t('status.importedAchievements')}: ${result.value.achievementIds.length}.`,
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.portability')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Button variant="outline" onClick={handleExport} type="button">
            {t('profile.exportAchievements')}
          </Button>
          <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">
            {t('profile.importAchievements')}
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleImport(event)}
            />
          </label>
        </div>
        {importStatus !== null ? (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            {importStatus}
          </p>
        ) : null}

        <Separator className="my-6" />

        <h3 className="text-sm font-semibold text-muted-foreground">
          {t('profile.progress')}
        </h3>
        {progressRows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('profile.noProgress')}
          </p>
        ) : (
          <ol className="mt-2 divide-y divide-border/60">
            {progressRows.slice(0, 8).map((row) => (
              <li
                className="grid gap-1 py-2 text-sm sm:grid-cols-[1fr_auto]"
                key={`${row.gameId}-${row.levelId}`}
              >
                <span className="truncate">
                  <span className="font-medium">
                    {formatGameTitle(locale, row.gameId)}
                  </span>{' '}
                  <span className="text-muted-foreground">/ {row.levelId}</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t('profile.attempts')} {row.attempts}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
