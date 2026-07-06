import type {
  AnalyzeLabelInput,
  AnalyzePhotoInput,
  LabelAnalysisResult,
  PhotoAnalysisResult,
} from '@omnomnom/shared'
import { apiRequest } from './client'

export async function analyzePhoto(input: AnalyzePhotoInput): Promise<PhotoAnalysisResult> {
  return apiRequest<PhotoAnalysisResult>('/api/ai/analyze-photo', { method: 'POST', body: input })
}

export async function analyzeLabel(input: AnalyzeLabelInput): Promise<LabelAnalysisResult> {
  return apiRequest<LabelAnalysisResult>('/api/ai/analyze-label', { method: 'POST', body: input })
}
