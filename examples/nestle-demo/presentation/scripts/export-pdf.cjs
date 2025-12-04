#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now()
  const http = await import('node-fetch').catch(() => null)
  const fetchFn = (global.fetch || (http && http.default))
  if (!fetchFn) throw new Error('No fetch available in this Node environment')
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchFn(url, { method: 'HEAD' })
      if (res.ok) return true
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`)
}

async function main() {
  const port = process.env.PREVIEW_PORT || 5510
  const previewUrl = `http://localhost:${port}/?print=1`
  const repoRoot = path.resolve(__dirname, '..', '..')
  const outDir = path.join(repoRoot, 'output')
  const outFile = path.join(outDir, 'nestle-demo-presentation.pdf')

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  console.log('Building presentation...')
  execSync('npm run build', { stdio: 'inherit' })

  console.log(`Starting preview on :${port} ...`)
  const preview = spawn('npx', ['vite', 'preview', '--port', String(port)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  try {
    await waitForServer(`http://localhost:${port}/`)
    console.log('Preview ready. Launching Puppeteer...')
    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 0 })

    // Ensure fonts/render settled (no-op if immediate)
    try { await page.waitForFunction(() => document.readyState === 'complete', { timeout: 1000 }) } catch {}

    console.log(`Exporting to ${outFile} ...`)
    await page.pdf({
      path: outFile,
      printBackground: true,
      format: 'A4',
      landscape: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    })

    await browser.close()
    console.log('PDF export complete.')
  } finally {
    try { preview.kill() } catch {}
  }

  console.log(`Saved: ${outFile}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
