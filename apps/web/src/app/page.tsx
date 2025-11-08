import { SearchHeader } from '@/components/search/search-header'
import { MemoryGrid } from '@/components/memory/memory-grid'
import { Navigation } from '@/components/navigation/navigation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          <SearchHeader />
          <MemoryGrid />
        </div>
      </main>
    </div>
  )
}