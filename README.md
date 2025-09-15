# MerchantWords Crawler

Deploy to Netlify for free web scraping with Next.js and Playwright.

## Deploy to Netlify

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

3. **Set Environment Variables**:
   - In Netlify dashboard → Site settings → Environment variables
   - Add:
     - `MERCHANTWORDS_USERNAME`: your_username
     - `MERCHANTWORDS_PASSWORD`: your_password

4. **Deploy**: Netlify will automatically build and deploy

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Batch keyword search
- Excel export
- Optimized browser usage
- Free Netlify deployment