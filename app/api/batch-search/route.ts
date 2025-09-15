import { NextRequest, NextResponse } from 'next/server'

interface KeywordResult {
  keyword: string
  volume: string | number
}

interface QueryResult {
  query: string
  keywords: string[]
  volumes: (string | number)[]
}

export const runtime = 'nodejs'
export const maxDuration = 26 // Netlify max timeout

export async function POST(request: NextRequest) {
  try {
    console.log('Batch search API called')
    const { queries }: { queries: string[] } = await request.json()
    console.log('Queries received:', queries)
    
    if (!queries || queries.length === 0) {
      return NextResponse.json({ error: 'No queries provided' }, { status: 400 })
    }
    
    // Limit queries for Netlify timeout (26 seconds)
    if (queries.length > 2) {
      return NextResponse.json({ 
        error: 'Too many queries. Maximum 2 queries per request due to Netlify timeout limits.' 
      }, { status: 400 })
    }
    
    console.log('Loading playwright...')
    const playwright = require('playwright-aws-lambda')
    console.log('Launching browser...')
    const browser = await playwright.launchChromium({ 
      headless: true
    })
    
    const page = await browser.newPage()
    
    // Advanced anti-detection
    await page.addInitScript(() => {
      delete (window as any).webdriver
      delete (navigator as any).webdriver
      
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
      
      ;(window as any).chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined
        }
      }
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' }
        ]
      })
    })
    
    // Navigate with retry mechanism
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        await page.goto('https://www.merchantwords.com/', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        })
        
        // Check if we hit bot detection
        const isBlocked = await page.evaluate(() => {
          return document.body.innerText.toLowerCase().includes('bot') ||
                 document.body.innerText.toLowerCase().includes('captcha') ||
                 document.body.innerText.toLowerCase().includes('blocked') ||
                 document.title.toLowerCase().includes('access denied')
        })
        
        if (isBlocked) {
          console.log(`Bot detection hit, retry ${retryCount + 1}/${maxRetries}`)
          await page.waitForTimeout(5000 + Math.random() * 5000)
          retryCount++
          continue
        }
        
        break
      } catch (error) {
        console.log(`Navigation failed, retry ${retryCount + 1}/${maxRetries}:`, error)
        retryCount++
        if (retryCount >= maxRetries) throw error
        await page.waitForTimeout(3000)
      }
    }
    
    // Login once
    const username = process.env.MERCHANTWORDS_USERNAME
    const password = process.env.MERCHANTWORDS_PASSWORD
    console.log('Environment variables:', { 
      hasUsername: !!username, 
      hasPassword: !!password,
      usernameLength: username?.length || 0,
      passwordLength: password?.length || 0,
      nodeEnv: process.env.NODE_ENV
    })
    
    if (username && password) {
      console.log('Starting login process...')
      await page.click('a[href="/login"].btn.login-btn')
      await page.waitForLoadState('domcontentloaded')
      
      await page.fill('#field-email-3\\#', username)
      await page.fill('#field-pass-3\\#', password)
      
      await page.waitForSelector('#submitButton')
      await page.waitForFunction('document.querySelector("#submitButton").disabled === false')
      await page.click('#submitButton')
      await page.waitForLoadState('domcontentloaded')
      
    }
    
    const allResults: QueryResult[] = []
    
    try {
      // Process each query in the same browser session
      console.log(`Processing ${queries.length} queries...`)
      for (const query of queries) {
        if (!query.trim()) continue
        
        try {
          console.log(`Processing query: ${query}`)
          await page.click('#usersearchbox')
          await page.fill('#usersearchbox', query)
          await page.keyboard.press('Enter')
          await page.waitForLoadState('domcontentloaded')
          await page.waitForTimeout(1000) // Reduced for Netlify timeout
          
          await page.waitForSelector('#resultsTable tbody tr', { timeout: 8000 })
          
          const filteredKeywords = await page.evaluate((): KeywordResult[] => {
            const rows = document.querySelectorAll('#resultsTable tbody tr')
            const results: KeywordResult[] = []
            const seenKeywords = new Set<string>()
            
            Array.from(rows).forEach(row => {
              try {
                const keywordElem = row.querySelector('li.keywords span') as HTMLElement
                if (!keywordElem) return
                
                const keyword = keywordElem.innerText.trim()
                if (!keyword || seenKeywords.has(keyword)) return
                
                const tds = row.querySelectorAll('td')
                Array.from(tds).forEach(td => {
                  const text = td.textContent?.trim() || ''
                  
                  if (text === '< 100') {
                    results.push({ keyword, volume: '< 100' })
                    seenKeywords.add(keyword)
                    return
                  }
                  
                  const numMatch = text.match(/^(\d+)$/)
                  if (numMatch) {
                    const volume = parseInt(numMatch[1])
                    if (volume < 100) {
                      results.push({ keyword, volume })
                      seenKeywords.add(keyword)
                      return
                    }
                  }
                })
              } catch (e) {
                // continue
              }
            })
            return results
          })
          
          console.log(`Found ${filteredKeywords.length} keywords for query: ${query}`)
          allResults.push({
            query: query.trim(),
            keywords: filteredKeywords.map((item: KeywordResult) => item.keyword),
            volumes: filteredKeywords.map((item: KeywordResult) => item.volume)
          })
          
        } catch (error) {
          console.error(`Error processing query "${query}":`, error)
          allResults.push({
            query: query.trim(),
            keywords: [],
            volumes: []
          })
        }
      }
    } finally {
      console.log('Closing browser...')
      await browser.close()
    }
    
    // Remove duplicates across all results
    const globalKeywordSet = new Set<string>()
    const deduplicatedResults = allResults.map(result => {
      const uniqueKeywords: string[] = []
      const uniqueVolumes: (string | number)[] = []
      
      result.keywords.forEach((keyword, index) => {
        if (!globalKeywordSet.has(keyword)) {
          globalKeywordSet.add(keyword)
          uniqueKeywords.push(keyword)
          uniqueVolumes.push(result.volumes[index])
        }
      })
      
      return {
        ...result,
        keywords: uniqueKeywords,
        volumes: uniqueVolumes
      }
    })
    
    console.log(`Returning ${deduplicatedResults.length} results with duplicates removed`)
    return NextResponse.json({ results: deduplicatedResults })
    
  } catch (error) {
    console.error('Batch search error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Batch search failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}