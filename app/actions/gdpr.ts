'use server'

import { redirect } from 'next/navigation'
import { verifySession, clearSession } from '@/lib/auth/session'
import { generateJSONExport, generateCSVExport } from '@/lib/gdpr/export'
import { deleteUserAccount } from '@/lib/gdpr/deletion'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db'
import { FormState } from '@/types/form'

// Require auth for all actions
async function requireAuth(): Promise<string> {
  const session = await verifySession()
  if (!session) {
    redirect('/login')
  }
  return session.userId
}

export async function exportDataJSON(): Promise<string> {
  const userId = await requireAuth()
  return await generateJSONExport(userId)
}

export async function exportDataCSV(): Promise<string> {
  const userId = await requireAuth()
  return await generateCSVExport(userId)
}

export async function deleteAccount(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requireAuth()
  const confirmation = formData.get('confirmation')

  // Require user to type "SUPPRIMER" to confirm
  if (confirmation !== 'SUPPRIMER') {
    return { message: 'Veuillez taper SUPPRIMER pour confirmer la suppression.' }
  }

  await deleteUserAccount(userId)
  await clearSession()
  redirect('/account/deleted')
}

export async function changePassword(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requireAuth()
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { message: 'Tous les champs sont requis.' }
  }

  if (newPassword !== confirmPassword) {
    return { message: 'Les nouveaux mots de passe ne correspondent pas.' }
  }

  if (newPassword.length < 8) {
    return { message: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }

  // Verify current password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  })

  if (!user) {
    redirect('/login')
  }

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) {
    return { message: 'Mot de passe actuel incorrect.' }
  }

  // Hash and save new password
  const hashedPassword = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  return { message: 'Mot de passe modifié avec succès !' }
}
