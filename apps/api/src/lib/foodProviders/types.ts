export interface ExternalFoodResult {
  source: 'openfoodfacts' | 'usda'
  sourceId: string
  name: string
  brand: string | null
  barcode: string | null
  servingSize: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
}
