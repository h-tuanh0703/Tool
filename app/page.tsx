'use client'

import { useState } from 'react'
import SearchSection from './components/SearchSection'

export default function Home() {
  const [keywords, setKeywords] = useState<string[]>([''])
  const [names, setNames] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [batchNameResults, setBatchNameResults] = useState<any[]>([])

  const handleCombinedBatchSearch = async () => {
    const validKeywords = keywords.filter(k => k.trim())
    const validNames = names.filter(n => n.trim())
    
    if (validKeywords.length === 0 && validNames.length === 0) return
    
    setBatchResults([])
    setBatchNameResults([])
    setLoading(true)
    setError('')
    
    try {
      const allQueries = [...validKeywords, ...validNames]
      
      const res = await fetch('/api/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: allQueries })
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const results = data.results || []
      
      const keywordResults = results.slice(0, validKeywords.length)
      const nameResults = results.slice(validKeywords.length)
      
      setBatchResults(keywordResults)
      setBatchNameResults(nameResults)
    } catch (err: any) {
      setError(err.message || 'Batch search failed')
    }
    setLoading(false)
  }

  const exportBatchData = () => {
    let csvContent = '\uFEFFKeyword,Name\n'
    
    const allKeywords: string[] = []
    batchResults.forEach(result => {
      allKeywords.push(result.query)
      result.keywords.forEach((keyword: string) => {
        allKeywords.push(keyword)
      })
    })
    
    const allNames: string[] = []
    batchNameResults.forEach(result => {
      allNames.push(result.query)
      result.keywords.forEach((keyword: string) => {
        allNames.push(keyword)
      })
    })
    
    const maxLength = Math.max(allKeywords.length, allNames.length)
    for (let i = 0; i < maxLength; i++) {
      const keyword = (allKeywords[i] || '').replace(/[^\x20-\x7E]/g, '')
      const name = (allNames[i] || '').replace(/[^\x20-\x7E]/g, '')
      csvContent += `"${keyword}","${name}"\n`
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch_results.csv'
    a.click()
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>🔍 MerchantWords Crawler</h1>
        <p>Search keywords and names, then export your results</p>
      </div>
      
      <div className="search-grid">
        <SearchSection
          title="Keywords"
          items={keywords}
          setItems={setKeywords}
          placeholder="Enter keyword..."
        />
        
        <SearchSection
          title="Names"
          items={names}
          setItems={setNames}
          placeholder="Enter name..."
        />
      </div>
      
      <div className="combined-search-section">
        <button 
          onClick={handleCombinedBatchSearch}
          className="combined-batch-btn"
          disabled={keywords.filter(k => k.trim()).length === 0 && names.filter(n => n.trim()).length === 0}
        >
          🚀 Search All Keywords & Names
        </button>
      </div>
      
      {(batchResults.length > 0 || batchNameResults.length > 0) && (
        <div className="batch-results-section">
          <div className="batch-header">
            <h2>📈 Batch Results (Keywords: {batchResults.length}, Names: {batchNameResults.length})</h2>
            <button onClick={exportBatchData} className="batch-export-btn">
              📊 Export Excel
            </button>
          </div>
          <div className="batch-results-grid">
            {batchResults.map((result, i) => (
              <div key={`keyword-${i}`} className="batch-result-card">
                <h4>Keyword: {result.query}</h4>
                <div className="batch-keyword-count">{result.keywords.length} results</div>
                <div className="batch-keyword-preview">
                  {result.keywords.slice(0, 5).map((keyword: string, j: number) => (
                    <span key={j} className="batch-keyword-tag">{keyword}</span>
                  ))}
                  {result.keywords.length > 5 && (
                    <span className="batch-more-tag">+{result.keywords.length - 5}</span>
                  )}
                </div>
              </div>
            ))}
            {batchNameResults.map((result, i) => (
              <div key={`name-${i}`} className="batch-result-card">
                <h4>Name: {result.query}</h4>
                <div className="batch-keyword-count">{result.keywords.length} results</div>
                <div className="batch-keyword-preview">
                  {result.keywords.slice(0, 5).map((keyword: string, j: number) => (
                    <span key={j} className="batch-keyword-tag">{keyword}</span>
                  ))}
                  {result.keywords.length > 5 && (
                    <span className="batch-more-tag">+{result.keywords.length - 5}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {loading && <div className="loading-spinner">🔄 Searching...</div>}
      {error && <div className="error-message">❌ {error}</div>}
    </div>
  )
}