'use client'

import { useState } from 'react'
import SearchSection from './components/SearchSection'
import ResultCard from './components/ResultCard'

export default function Home() {
  const [keywords, setKeywords] = useState<string[]>([''])
  const [names, setNames] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [combinedData, setCombinedData] = useState<any[]>([])
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [batchNameResults, setBatchNameResults] = useState<any[]>([])

  const searchKeyword = async (query: string, index: number) => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await res.json()
      
      const newData = [...combinedData]
      newData[index] = { type: 'keyword', query, results: data.keywords || [] }
      setCombinedData(newData)
    } catch (err: any) {
      setError(err.message || 'Search failed')
    }
    setLoading(false)
  }

  const searchName = async (query: string, index: number) => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await res.json()
      
      const newData = [...combinedData]
      newData[index + 1000] = { type: 'name', query, results: data.keywords || [] }
      setCombinedData(newData)
    } catch (err: any) {
      setError(err.message || 'Search failed')
    }
    setLoading(false)
  }

  const handleBatchKeywords = async (queries: string[]) => {
    console.log('=== handleBatchKeywords START ===')
    console.log('Queries received:', queries)
    console.log('Queries length:', queries.length)
    
    if (queries.length === 0) {
      console.log('No queries to search - returning early')
      return
    }
    
    // Clear previous batch results
    setBatchResults([])
    
    console.log('Setting loading to true...')
    setLoading(true)
    setError('')
    
    try {
      console.log('Making API call to /api/batch-search...')
      const requestBody = { queries }
      console.log('Request body:', requestBody)
      
      const res = await fetch('http://localhost:8000/api/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('Response status:', res.status)
      console.log('Response ok:', res.ok)
      
      const data = await res.json()
      console.log('Response data:', data)
      
      setBatchResults(data.results || [])
      console.log('Batch results set successfully')
    } catch (err: any) {
      console.error('Batch search error:', err)
      setError(err.message || 'Batch search failed')
    }
    
    console.log('Setting loading to false...')
    setLoading(false)
    console.log('=== handleBatchKeywords END ===')
  }

  const handleCombinedBatchSearch = async () => {
    const validKeywords = keywords.filter(k => k.trim())
    const validNames = names.filter(n => n.trim())
    
    if (validKeywords.length === 0 && validNames.length === 0) return
    
    setBatchResults([])
    setBatchNameResults([])
    setLoading(true)
    setError('')
    
    try {
      // Combine all queries into one API call
      const allQueries = [...validKeywords, ...validNames]
      
      const res = await fetch('/api/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: allQueries })
      })
      
      const data = await res.json()
      const results = data.results || []
      
      // Split results back into keywords and names
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
    let csvContent = '\uFEFFKeyword,Name\n' // Add BOM for UTF-8
    
    // Get all keywords from batch results
    const allKeywords: string[] = []
    batchResults.forEach(result => {
      allKeywords.push(result.query)
      result.keywords.forEach((keyword: string) => {
        allKeywords.push(keyword)
      })
    })
    
    // Get all names from batch name results
    const allNames: string[] = []
    batchNameResults.forEach(result => {
      allNames.push(result.query)
      result.keywords.forEach((keyword: string) => {
        allNames.push(keyword)
      })
    })
    
    // Create rows with keywords and names in separate columns
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

  const exportData = () => {
    const keywordData = combinedData.filter(item => item?.type === 'keyword')
    const nameData = combinedData.filter(item => item?.type === 'name')
    
    let csvContent = '\uFEFFKeyword,Name\n' // Add BOM for UTF-8
    
    const maxLength = Math.max(
      keywordData.reduce((max, item) => Math.max(max, item.results.length), 0),
      nameData.reduce((max, item) => Math.max(max, item.results.length), 0)
    )
    
    for (let i = 0; i < maxLength; i++) {
      const keywordRow = keywordData.map(item => (item.results[i] || '').replace(/[^\x20-\x7E]/g, '')).join(' | ')
      const nameRow = nameData.map(item => (item.results[i] || '').replace(/[^\x20-\x7E]/g, '')).join(' | ')
      csvContent += `"${keywordRow}","${nameRow}"\n`
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'keywords_names.csv'
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
          onSearch={searchKeyword}
          placeholder="Enter keyword..."
        />
        
        <SearchSection
          title="Names"
          items={names}
          setItems={setNames}
          onSearch={searchName}
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
      
      {combinedData.length > 0 && (
        <div className="results-container">
          <h2>📊 Search Results</h2>
          <div className="results-grid">
            {combinedData.map((item, i) => item && (
              <ResultCard
                key={i}
                type={item.type}
                query={item.query}
                results={item.results}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}