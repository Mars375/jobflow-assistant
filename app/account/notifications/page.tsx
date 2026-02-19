import { redirect } from 'next/navigation'

import { verifySession } from '@/lib/auth/session'
import { AppHeader } from '@/components/layout/app-header'
import { NotificationSettings } from '@/components/account/notification-settings'

export default async function NotificationsPage() {
  const session = await verifySession()
  if (!session) redirect('/login')

  return (
    <main className="app-shell">
      <AppHeader />
      <div className="app-page max-w-3xl">
        <h1 className="app-title">Notifications</h1>
        <p className="app-subtitle">Digeste quotidien, fuseau horaire, et alertes temps reel.</p>

        <div className="mt-8">
          <NotificationSettings />
        </div>
      </div>
    </main>
  )
}
