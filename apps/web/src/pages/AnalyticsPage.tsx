import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Divider } from '@/components/ui/divider'
import { TrendsTab } from '@/components/analytics/TrendsTab'
import { HistoryTab } from '@/components/analytics/HistoryTab'
import { WaterTab } from '@/components/analytics/WaterTab'

type AnalyticsTab = 'trends' | 'history' | 'water'

const TAB_LABELS: Record<AnalyticsTab, string> = {
  trends: 'Trends',
  history: 'History',
  water: 'Water',
}

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as AnalyticsTab | null) ?? 'trends'

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-6 text-3xl font-bold tracking-tight">Analytics</h1>

      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList variant="line" className="w-full justify-start gap-6 p-0">
          {(Object.keys(TAB_LABELS) as AnalyticsTab[]).map((key) => (
            <TabsTrigger key={key} value={key} className="flex-none px-0 text-base">
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        <Divider className="mt-4" />

        <TabsContent value="trends">
          <TrendsTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="water">
          <WaterTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
