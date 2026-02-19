import { promises as fs } from 'node:fs'
import path from 'node:path'
import { validateCvUpload } from './validation'

export type StoredCvMetadata = {
  fileName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  extension: 'pdf' | 'docx'
}

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'cv')

export async function storeCvFile(userId: string, file: File): Promise<StoredCvMetadata> {
  const validation = validateCvUpload(file)
  if (!validation.ok || !validation.normalizedExtension || !validation.normalizedMimeType) {
    throw new Error(validation.message ?? 'CV invalide')
  }

  const userDir = path.join(STORAGE_ROOT, userId)
  await fs.mkdir(userDir, { recursive: true })

  const entries = await fs.readdir(userDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!entry.name.startsWith('current.')) continue
    await fs.rm(path.join(userDir, entry.name), { force: true })
  }

  const targetName = `current.${validation.normalizedExtension}`
  const targetPath = path.join(userDir, targetName)
  const tmpPath = `${targetPath}.tmp`

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(tmpPath, buffer)
  await fs.rename(tmpPath, targetPath)

  return {
    fileName: file.name,
    mimeType: validation.normalizedMimeType,
    sizeBytes: file.size,
    storagePath: path.relative(process.cwd(), targetPath),
    extension: validation.normalizedExtension,
  }
}
