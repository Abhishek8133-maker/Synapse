'use client'

import { useState } from 'react'
import { Input } from '@synapse/ui'
import { Search, Sparkles } from 'lucide-react'

export function SearchHeader() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // TODO: Implement semantic search API call
      console.log('Searching for:', searchQuery)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          Your Visual Memory
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Search your thoughts naturally. Try &quot;AI articles from last month&quot; or
          &quot;black leather shoes under $300&quot;
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your memory naturally..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 pl-12 pr-24 text-base"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-2">
            {isSearching && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>Understanding...</span>
              </div>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="px-3 py-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Example Queries */}
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-3">Try searching for:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Karpathy\'s quote on tokenization',
            'AI articles from last month',
            'Black leather shoes under $300',
            'Todo lists from yesterday',
            'Quotes about innovation',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}