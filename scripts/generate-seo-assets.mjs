import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const outputDir = path.resolve(process.cwd(), "dist")
const robotsPath = path.join(outputDir, "robots.txt")
const sitemapPath = path.join(outputDir, "sitemap.xml")
const indexableRoutes = ["/", "/docs"]

function resolveSiteUrl() {
  const rawUrl =
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    ""

  if (!rawUrl) return null

  const normalized = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
  return normalized.replace(/\/+$/, "")
}

function buildRobots(siteUrl) {
  const lines = ["User-agent: *", "Allow: /"]

  if (siteUrl) {
    lines.push(`Sitemap: ${siteUrl}/sitemap.xml`)
  }

  return `${lines.join("\n")}\n`
}

function buildSitemap(siteUrl) {
  const lastmod = new Date().toISOString()
  const urls = indexableRoutes
    .map((route) => {
      const loc = route === "/" ? siteUrl : `${siteUrl}${route}`
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "  </url>",
      ].join("\n")
    })
    .join("\n")

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n")
}

await mkdir(outputDir, { recursive: true })

const siteUrl = resolveSiteUrl()

await writeFile(robotsPath, buildRobots(siteUrl), "utf8")

if (siteUrl) {
  await writeFile(sitemapPath, buildSitemap(siteUrl), "utf8")
  console.log(`[seo] Generated robots.txt and sitemap.xml for ${siteUrl}`)
} else {
  await rm(sitemapPath, { force: true })
  console.warn(
    "[seo] Skipped sitemap.xml because SITE_URL/VITE_SITE_URL/VERCEL_* was not set.",
  )
}
