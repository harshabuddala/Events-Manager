import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export interface LetterheadInfo {
  id: string
  filePath: string        // e.g. /uploads/letterheads/{uuid}.png
  cropX: number
  cropY: number
  cropW: number
  cropH: number
  imageW: number
  imageH: number
}

export interface ReportStallRow {
  name: string
  code: string
  score: number | null   // 0-10
  grade: string | null
  remarks: string | null
  volunteer: string | null
  metrics: Array<{ name: string; score: number }>
}

export interface ReportCardData {
  student: {
    name: string
    rollNumber: string
    grade: string
    age: number | null
  }
  event: {
    name: string
    code: string
    community: string
  }
  stalls: ReportStallRow[]
  averageScore: number
  overallGrade: string
  status: string         // COMPLETED / IN_PROGRESS / REGISTERED
  generatedAt: string    // ISO
  isSample?: boolean
}

export async function loadLetterheadBuffer(lh: LetterheadInfo): Promise<Buffer | null> {
  const filePath = path.join(process.cwd(), lh.filePath.replace(/^\//, ''))
  if (!existsSync(filePath)) return null
  return await readFile(filePath)
}
