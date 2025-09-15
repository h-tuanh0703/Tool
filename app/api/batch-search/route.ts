import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { queries } = await request.json()
    
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })
    })
    
    await page.goto('https://www.merchantwords.com/', { waitUntil: 'domcontentloaded' })
    
    // Login once
    const username = process.env.MERCHANTWORDS_USERNAME
    const password = process.env.MERCHANTWORDS_PASSWORD
    
    if (username && password) {
      await page.click('a[href="/login"].btn.login-btn')
      await page.waitForLoadState('domcontentloaded')
      
      await page.fill('#field-email-3\\#', username)
      await page.fill('#field-pass-3\\#', password)
      
      await page.waitForSelector('#submitButton')
      await page.waitForFunction('document.querySelector("#submitButton").disabled === false')
      await page.click('#submitButton')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(8000)
      
      await page.goto('https://www.merchantwords.com/search/us/*/sort-highest')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)
    }
    
    const allResults = []
    
    // Process each query in the same browser session
    for (const query of queries) {
      if (!query.trim()) continue
      
      try {
        await page.click('#usersearchbox')
        await page.fill('#usersearchbox', query)
        await page.keyboard.press('Enter')
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(3000)
        
        await page.waitForSelector('#resultsTable tbody tr', { timeout: 8000 })
        
        const filteredKeywords = await page.evaluate(() => {
          const rows = document.querySelectorAll('#resultsTable tbody tr')
          const results = []
          
          for (let row of rows) {
            try {
              const keywordElem = row.querySelector('li.keywords span')
              if (!keywordElem) continue
              
              const keyword = keywordElem.innerText.trim()
              if (!keyword) continue
              
              const tds = row.querySelectorAll('td')
              for (let td of tds) {
                const text = td.textContent.trim()
                
                if (text === '< 100') {
                  results.push({ keyword, volume: '< 100' })
                  break
                }
                
                const numMatch = text.match(/^(\d+)$/)
                if (numMatch) {
                  const volume = parseInt(numMatch[1])
                  if (volume < 100) {
                    results.push({ keyword, volume })
                    break
                  }
                }
              }
            } catch (e) {
              continue
            }
          }
          return results
        })
        
        allResults.push({
          query: query.trim(),
          keywords: filteredKeywords.map(item => item.keyword),
          volumes: filteredKeywords.map(item => item.volume)
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
    
    await browser.close()
    
    return NextResponse.json({ results: allResults })
    
  } catch (error) {
    console.error('Batch search error:', error)
    return NextResponse.json(
      { error: 'Batch search failed' },
      { status: 500 }
    )
  }
}