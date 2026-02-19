import { spawn } from 'node:child_process'
import path from 'node:path'

export type ParsedCv = {
  skills: string[]
  experience: Array<Record<string, string>>
  education: Array<Record<string, string>>
  contact: Record<string, string>
  warnings: string[]
}

const DEFAULT_RESULT: ParsedCv = {
  skills: [],
  experience: [],
  education: [],
  contact: {},
  warnings: [],
}

function normalizeParsedCv(input: unknown): ParsedCv {
  if (!input || typeof input !== 'object') {
    return {
      ...DEFAULT_RESULT,
      warnings: ['Sortie parseur invalide'],
    }
  }

  const data = input as Record<string, unknown>
  return {
    skills: Array.isArray(data.skills)
      ? data.skills.filter((item): item is string => typeof item === 'string')
      : [],
    experience: Array.isArray(data.experience)
      ? data.experience.filter((item): item is Record<string, string> => !!item && typeof item === 'object')
      : [],
    education: Array.isArray(data.education)
      ? data.education.filter((item): item is Record<string, string> => !!item && typeof item === 'object')
      : [],
    contact:
      data.contact && typeof data.contact === 'object'
        ? (data.contact as Record<string, string>)
        : {},
    warnings: Array.isArray(data.warnings)
      ? data.warnings.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

export async function parseCvText(rawText: string): Promise<ParsedCv> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'cv_parse.py')

  return new Promise<ParsedCv>((resolve) => {
    const child = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', () => {
      resolve({
        ...DEFAULT_RESULT,
        warnings: ['Impossible de lancer le parseur CV Python.'],
      })
    })

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({
          ...DEFAULT_RESULT,
          warnings: [`Parseur CV en echec (${code}). ${stderr.trim()}`.trim()],
        })
        return
      }

      try {
        const parsed = JSON.parse(stdout)
        const normalized = normalizeParsedCv(parsed)
        resolve(normalized)
      } catch {
        resolve({
          ...DEFAULT_RESULT,
          warnings: ['Sortie parseur illisible.'],
        })
      }
    })

    child.stdin.write(rawText)
    child.stdin.end()
  })
}
