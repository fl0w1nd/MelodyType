import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

const SITE_NAME = "MelodyType"
const DEFAULT_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
const NOINDEX_ROBOTS = "noindex,nofollow"

function upsertNamedMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute("name", name)
    document.head.appendChild(element)
  }

  element.content = content
}

function upsertPropertyMeta(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute("property", property)
    document.head.appendChild(element)
  }

  element.content = content
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!element) {
    element = document.createElement("link")
    element.rel = "canonical"
    document.head.appendChild(element)
  }

  element.href = href
}

export function RouteSeo() {
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const meta = useMemo(() => {
    switch (location.pathname) {
      case "/":
        return {
          title: `${SITE_NAME} | ${t("settingsPage.about.tagline")}`,
          description: t("settingsPage.about.description"),
          robots: DEFAULT_ROBOTS,
        }
      case "/docs":
        return {
          title: `${t("nav.docs")} | ${SITE_NAME}`,
          description: t("docsPage.overview.p1"),
          robots: DEFAULT_ROBOTS,
        }
      case "/dashboard":
        return {
          title: `${t("nav.dashboard")} | ${SITE_NAME}`,
          description: t("docsPage.dashboard.p1"),
          robots: NOINDEX_ROBOTS,
        }
      case "/midi":
        return {
          title: `${t("nav.midi")} | ${SITE_NAME}`,
          description: t("docsPage.melody.p1"),
          robots: NOINDEX_ROBOTS,
        }
      case "/settings":
        return {
          title: `${t("nav.settings")} | ${SITE_NAME}`,
          description: t("settingsPage.about.description"),
          robots: NOINDEX_ROBOTS,
        }
      default:
        return {
          title: SITE_NAME,
          description: t("settingsPage.about.description"),
          robots: NOINDEX_ROBOTS,
        }
    }
  }, [location.pathname, t])

  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${location.pathname}`

    document.title = meta.title
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language ?? "en"

    upsertNamedMeta("description", meta.description)
    upsertNamedMeta("robots", meta.robots)
    upsertNamedMeta("googlebot", meta.robots)
    upsertNamedMeta("twitter:card", "summary")
    upsertNamedMeta("twitter:title", meta.title)
    upsertNamedMeta("twitter:description", meta.description)

    upsertPropertyMeta("og:type", "website")
    upsertPropertyMeta("og:site_name", SITE_NAME)
    upsertPropertyMeta("og:title", meta.title)
    upsertPropertyMeta("og:description", meta.description)
    upsertPropertyMeta("og:url", canonicalUrl)

    upsertCanonical(canonicalUrl)
  }, [i18n.language, i18n.resolvedLanguage, location.pathname, meta])

  return null
}
