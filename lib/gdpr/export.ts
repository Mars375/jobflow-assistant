import 'server-only'
import { prisma } from '@/lib/db'

export async function generateJSONExport(userId: string) {
  // Fetch all user data with related records
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sessions: true,
      deletionRequests: true,
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Structure export data
  const exportData = {
    version: "v1.0",
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      gdprConsentedAt: user.gdprConsentedAt,
      consentedToPrivacyPolicy: user.consentedToPrivacyPolicy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    sessions: user.sessions.map(session => ({
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    })),
    deletionRequests: user.deletionRequests.map(request => ({
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
      completed: request.completed,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

export async function generateCSVExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sessions: true,
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Escape CSV values (handle commas, quotes, newlines)
  function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Generate CSV for tabular data
  const rows = [
    ['Field', 'Value'],
    ['User ID', user.id],
    ['Email', user.email],
    ['Username', user.username || ''],
    ['Name', user.name || ''],
    ['GDPR Consent Date', user.gdprConsentedAt?.toISOString() || ''],
    ['Privacy Policy Consent', user.consentedToPrivacyPolicy ? 'Yes' : 'No'],
    ['Account Created', user.createdAt.toISOString()],
    ['Account Updated', user.updatedAt.toISOString()],
    ['Active Sessions', user.sessions.length.toString()],
    ['', ''],
    ['Sessions', ''],
    ['Created At', 'Expires At'],
    ...user.sessions.map(s => [
      s.createdAt.toISOString(),
      s.expiresAt.toISOString()
    ])
  ]

  return rows.map(row => row.map(escapeCSV).join(',')).join('\n')
}
