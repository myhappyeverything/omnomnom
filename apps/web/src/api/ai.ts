import type { AnalyzePhotoInput, PhotoAnalysisResult } from '@omnomnom/shared'
import { apiRequest } from './client'

export async function analyzePhoto(input: AnalyzePhotoInput): Promise<PhotoAnalysisResult> {
  return apiRequest<PhotoAnalysisResult>('/api/ai/analyze-photo', { method: 'POST', body: input })
}
