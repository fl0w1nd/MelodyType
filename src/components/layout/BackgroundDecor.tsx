export function BackgroundDecor() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-24 left-1/4 w-[32rem] h-[32rem] bg-primary/[0.04] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-accent/[0.05] rounded-full blur-[100px]" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-chart-2/[0.03] rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-chart-4/[0.02] rounded-full blur-[120px]" />

      <div
        className="absolute inset-0 opacity-[0.012] dark:opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  )
}
