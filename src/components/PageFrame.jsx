export default function PageFrame({ title, subtitle, action, children }) {
  return (
    <section className="page-enter rounded-3xl border border-cream-200 bg-cream-50/80 p-4 shadow-soft backdrop-blur md:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-sage-900 md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-sage-700">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
