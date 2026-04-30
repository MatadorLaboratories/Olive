export function AdminPagePlaceholder({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
}) {
  return (
    <div className="space-y-10 max-w-5xl">
      <header>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          {title}
        </h1>
      </header>
      <div className="rounded-md border border-dashed border-olive-300 bg-cream-50/60 p-12 text-center">
        <p className="font-display italic text-olive-700 text-2xl max-w-xl mx-auto leading-snug">
          {body}
        </p>
      </div>
    </div>
  );
}
