export default function AccountHistory() {
  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-3">Order history</p>
        <h1 className="font-display text-display-md text-olive-900 leading-[1.05]">
          Past <span className="italic font-light">events.</span>
        </h1>
      </header>
      <p className="text-olive-700/80">
        Repeat clients can re-book with one tap. Filterable by year, status, value.
      </p>
    </div>
  );
}
