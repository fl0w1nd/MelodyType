import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-border/60 bg-card/70 px-6 py-12 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
        404
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-foreground">
        {t("notFound.title")}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {t("notFound.description")}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("notFound.backHome")}
        </Link>
        <Link
          to="/docs"
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
        >
          {t("notFound.readDocs")}
        </Link>
      </div>
    </section>
  )
}
