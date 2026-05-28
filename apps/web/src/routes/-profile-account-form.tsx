import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button, Card, CardContent, CardHeader, CardTitle, useT } from '@math-games/ui'
import { updatePlayerProfile } from '@/player/profile.functions'
import type { PlayerProfileInput } from '@/player/profile.schema'
import type { PlayerProfileRecord } from '@/player/profile.server'
import { runServerAction } from '@/routes/-server-action-result'

type Locale = 'en' | 'vi'
type GradeBand = 'elementary' | 'middle' | 'high'

const LOCALES: readonly Locale[] = ['en', 'vi']
const GRADE_BANDS: readonly GradeBand[] = ['elementary', 'middle', 'high']

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

function isGradeBand(value: string): value is GradeBand {
  return (GRADE_BANDS as readonly string[]).includes(value)
}

interface ProfileAccountFormProps {
  initialProfile: PlayerProfileRecord
  onSaved: (profile: PlayerProfileRecord) => void
}

export function ProfileAccountForm({ initialProfile, onSaved }: ProfileAccountFormProps) {
  const t = useT()
  const saveProfile = useServerFn(updatePlayerProfile)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const rawLocale = String(formData.get('locale'))
    const rawGradeBand = String(formData.get('gradeBand'))

    const payload: PlayerProfileInput = {
      displayName: String(formData.get('displayName')),
      locale: isLocale(rawLocale) ? rawLocale : 'en',
      gradeBand: isGradeBand(rawGradeBand) ? rawGradeBand : 'elementary',
    }

    const result = await runServerAction(
      () => saveProfile({ data: payload }),
      t('status.profileSaveFailed'),
    )

    if (!result.ok) {
      setStatus(result.message)
      return
    }

    onSaved(result.value)
    setStatus(t('profile.saved'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.account')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-muted-foreground">
            {t('profile.displayName')}
            <input
              aria-label={t('profile.displayName')}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-normal text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              defaultValue={initialProfile.displayName}
              maxLength={40}
              minLength={2}
              name="displayName"
              required
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-muted-foreground">
            {t('profile.language')}
            <select
              aria-label={t('profile.language')}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-normal text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              defaultValue={initialProfile.locale}
              name="locale"
            >
              <option value="en">{t('lang.english')}</option>
              <option value="vi">{t('lang.vietnamese')}</option>
            </select>
          </label>

          <label className="mt-4 block text-sm font-semibold text-muted-foreground">
            {t('profile.gradeBand')}
            <select
              aria-label={t('profile.gradeBand')}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-normal text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              defaultValue={initialProfile.gradeBand}
              name="gradeBand"
            >
              <option value="elementary">{t('grade.elementary')}</option>
              <option value="middle">{t('grade.middle')}</option>
              <option value="high">{t('grade.high')}</option>
            </select>
          </label>

          <Button className="mt-5 w-full" type="submit">
            {t('profile.save')}
          </Button>

          {status !== null ? (
            <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
              {status}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
