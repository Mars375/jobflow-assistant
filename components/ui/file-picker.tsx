'use client'

import { useId, useMemo, useRef, useState } from 'react'

type FilePickerProps = {
  name: string
  accept?: string
  required?: boolean
  label: string
  help?: string
}

export function FilePicker({ name, accept, required, label, help }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const id = useId()

  const hint = useMemo(() => {
    if (fileName) return fileName
    return help || 'Aucun fichier selectionne'
  }, [fileName, help])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-app-ink">{label}</p>
          <p className="mt-0.5 text-xs text-app-muted">{hint}</p>
        </div>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => inputRef.current?.click()}
        >
          Choisir un fichier
        </button>
      </div>

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          setFileName(file?.name ?? '')
        }}
      />
    </div>
  )
}
