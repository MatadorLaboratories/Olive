export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-olive-700/80 max-w-xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
