'use server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { storeCvFile } from '@/lib/cv/storage'
import { validateCvUpload } from '@/lib/cv/validation'
import { parseCvText } from '@/lib/cv/parser'

export type CvUploadState = {
  message?: string
  errors?: Record<string, string[]>
  uploaded?: boolean
  pendingExtraction?: boolean
}

function normalizeRawTextFromFile(fileBytes: Buffer): string {
  return fileBytes
    .toString('utf8')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500000)
}

export async function uploadCv(
  state: CvUploadState,
  formData: FormData
): Promise<CvUploadState> {
  const session = await verifySession()
  if (!session) {
    return {
      message: 'Session expirée. Reconnectez-vous.',
      errors: { cv: ['Authentification requise'] },
    }
  }

  const file = formData.get('cv')
  if (!(file instanceof File)) {
    return {
      message: 'Aucun fichier CV reçu.',
      errors: { cv: ['Veuillez sélectionner un fichier PDF ou DOCX.'] },
    }
  }

  const validation = validateCvUpload(file)
  if (!validation.ok) {
    return {
      message: validation.message,
      errors: { cv: [validation.message ?? 'CV invalide'] },
    }
  }

  try {
    const storage = await storeCvFile(session.userId, file)
    const rawBytes = Buffer.from(await file.arrayBuffer())
    const rawText = normalizeRawTextFromFile(rawBytes)

    await prisma.$transaction(async (tx) => {
      const parsed = await parseCvText(rawText)

      await tx.userCv.upsert({
        where: { userId: session.userId },
        update: {
          fileName: storage.fileName,
          mimeType: storage.mimeType,
          sizeBytes: storage.sizeBytes,
          storagePath: storage.storagePath,
          rawText,
          parsedAt: new Date(),
          parseWarnings: parsed.warnings,
          isActive: true,
        },
        create: {
          userId: session.userId,
          fileName: storage.fileName,
          mimeType: storage.mimeType,
          sizeBytes: storage.sizeBytes,
          storagePath: storage.storagePath,
          rawText,
          parsedAt: new Date(),
          parseWarnings: parsed.warnings,
          isActive: true,
        },
      })

      await tx.userProfile.upsert({
        where: { userId: session.userId },
        update: {
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          contact: parsed.contact,
        },
        create: {
          userId: session.userId,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          contact: parsed.contact,
        },
      })
    })

    return {
      uploaded: true,
      pendingExtraction: false,
      message: 'CV importe et profil pre-rempli avec extraction automatique.',
      errors: {},
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'upload du CV.'
    return {
      message,
      errors: { cv: [message] },
    }
  }
}

export async function uploadCvFromForm(formData: FormData): Promise<void> {
  await uploadCv({}, formData)
}
