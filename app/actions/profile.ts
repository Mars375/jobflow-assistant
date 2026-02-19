'use server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { FormState } from '@/types/form'

export type ProfileSummary = {
  skills: string[]
  experience: Array<Record<string, string>>
  education: Array<Record<string, string>>
  contact: Record<string, string>
  warnings: string[]
  parsedAt: string | null
}

export async function getProfileSummary(): Promise<ProfileSummary | null> {
  const session = await verifySession()
  if (!session) return null

  const [profile, cv] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: session.userId } }),
    prisma.userCv.findUnique({ where: { userId: session.userId } }),
  ])

  if (!profile) {
    return {
      skills: [],
      experience: [],
      education: [],
      contact: {},
      warnings: ['Aucun profil extrait pour le moment.'],
      parsedAt: null,
    }
  }

  return {
    skills: Array.isArray(profile.skills) ? (profile.skills as string[]) : [],
    experience: Array.isArray(profile.experience)
      ? (profile.experience as Array<Record<string, string>>)
      : [],
    education: Array.isArray(profile.education)
      ? (profile.education as Array<Record<string, string>>)
      : [],
    contact: (profile.contact as Record<string, string>) ?? {},
    warnings: Array.isArray(cv?.parseWarnings) ? (cv?.parseWarnings as string[]) : [],
    parsedAt: cv?.parsedAt ? cv.parsedAt.toISOString() : null,
  }
}

function parseListField(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string') return []
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function getStringField(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function saveProfile(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession()
  if (!session) {
    return {
      message: 'Session expirée. Reconnectez-vous.',
      errors: { form: ['Authentification requise'] },
    }
  }

  const skills = parseListField(formData.get('skills'))
  const experience = parseListField(formData.get('experience')).map((title) => ({
    title,
    company: '',
    start: '',
    end: '',
  }))
  const education = parseListField(formData.get('education')).map((degree) => ({
    degree,
    school: '',
    year: '',
  }))

  const contact = {
    email: getStringField(formData, 'contactEmail'),
    phone: getStringField(formData, 'contactPhone'),
    location: getStringField(formData, 'contactLocation'),
  }

  await prisma.userProfile.upsert({
    where: { userId: session.userId },
    update: {
      skills,
      experience,
      education,
      contact,
      lastReviewedAt: new Date(),
    },
    create: {
      userId: session.userId,
      skills,
      experience,
      education,
      contact,
      lastReviewedAt: new Date(),
    },
  })

  return {
    message: 'Profil mis a jour avec succes.',
    errors: {},
  }
}
