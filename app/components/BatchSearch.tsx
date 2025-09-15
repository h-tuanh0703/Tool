'use client'

import { useState } from 'react'

export default function BatchSearch() {
  const [keywords, setKeywords] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])

  const handleBatchSearch = async () => {
    const queries = keywords.split('\n').filter(q => q.trim())
    if (queries.length === 0) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries })
      })

      const data = await res.json()
      setResults(data.results || [])
    } catch (err: any) {
      setError(err.message || 'Batch search failed')
    }
    setLoading(false)
  }

  const exportToExcel = () => {
    let csvContent = 'Keyword\n'
    
    results.forEach(result => {
      csvContent += `${result.query}\n`
      result.keywords.forEach((keyword: string) => {
        csvContent += `${keyword}\n`
      })
      csvContent += '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch_keywords.csv'
    a.click()
  }

  return (
    <div className="batch-search-container">
      <h2>🚀 Batch Search</h2>
      
      <div className="batch-input-section">
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Enter keywords (one per line)&#10;shoes&#10;clothing&#10;electronics"
          className="batch-textarea"
          rows={8}
        />
        
        <div className="batch-controls">
          <button 
            onClick={handleBatchSearch}
            disabled={loading || !keywords.trim()}
            className="batch-search-btn"
          >
            {loading ? '🔄 Searching...' : '🔍 Search All'}
          </button>
          
          {results.length > 0 && (
            <button onClick={exportToExcel} className="batch-export-btn">
              📊 Export Excel
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {results.length > 0 && (
        <div className="batch-results">
          <h3>📊 Results ({results.length} searches)</h3>
          {results.map((result, i) => (
            <div key={i} className="batch-result-item">
              <h4>{result.query} ({result.keywords.length} keywords)</h4>
              <div className="keyword-tags">
                {result.keywords.slice(0, 10).map((keyword: string, j: number) => (
                  <span key={j} className="keyword-tag">{keyword}</span>
                ))}
                {result.keywords.length > 10 && (
                  <span className="more-tag">+{result.keywords.length - 10} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}