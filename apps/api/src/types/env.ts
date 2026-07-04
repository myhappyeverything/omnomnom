export interface Env {
  DB: D1Database
  CACHE: KVNamespace
  MEAL_IMAGES: R2Bucket
  JWT_SECRET: string
  OPENAI_API_KEY: string
  ONESIGNAL_APP_ID: string
  ONESIGNAL_REST_API_KEY: string
  USDA_FDC_API_KEY: string
  ENVIRONMENT: 'development' | 'production'
  /** Exact origin the Pages frontend is served from, e.g. https://omnomnom.pages.dev */
  ALLOWED_ORIGIN: string
}
