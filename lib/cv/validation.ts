const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export type CvValidationResult = {
  ok: boolean
  message?: string
  normalizedMimeType?: string
  normalizedExtension?: 'pdf' | 'docx'
}

function extractExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

export function validateCvUpload(file: File): CvValidationResult {
  if (!(file instanceof File)) {
    return { ok: false, message: 'Fichier CV invalide.' }
  }

  if (file.size === 0) {
    return { ok: false, message: 'Le fichier CV est vide.' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: 'Le CV dépasse 5 Mo. Réduisez la taille du fichier.',
    }
  }

  const extension = extractExtension(file.name)
  const mimeFromExt = EXT_TO_MIME[extension]
  const mimeFromType = MIME_TO_EXT[file.type] ? file.type : undefined
  const normalizedMimeType = mimeFromType ?? mimeFromExt

  if (!normalizedMimeType) {
    return {
      ok: false,
      message: 'Format non supporté. Utilisez un PDF ou un DOCX.',
    }
  }

  const normalizedExtension = MIME_TO_EXT[normalizedMimeType] as 'pdf' | 'docx'

  return {
    ok: true,
    normalizedMimeType,
    normalizedExtension,
  }
}

export const CV_UPLOAD_LIMIT_BYTES = MAX_FILE_SIZE_BYTES
