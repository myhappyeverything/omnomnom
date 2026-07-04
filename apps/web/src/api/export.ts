import { apiRequest } from './client'

export interface DataExport {
  version: number
  exportedAt: string
  [key: string]: unknown
}

export async function fetchDataExport(): Promise<DataExport> {
  return apiRequest<DataExport>('/api/export')
}

export function downloadDataExport(data: DataExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `omnomnom-export-${data.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
