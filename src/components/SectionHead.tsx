export function SectionHead({ index, label, title }: { index: string; label: string; title?: string }) {
  return (
    <div className="section-head reveal">
      <p className="section-label">
        <span>{index}</span> {label}
      </p>
      {title && <h2 className="section-title">{title}</h2>}
    </div>
  )
}
