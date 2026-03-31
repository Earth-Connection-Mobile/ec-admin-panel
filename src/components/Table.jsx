/**
 * Reusable Table component for EC Admin Panel
 *
 * Props:
 *   columns: Array of { key, label, render?, className? }
 *   data: Array of row objects
 *   loading: boolean
 *   emptyMessage: string
 *   emptyIcon: JSX (optional)
 */
export default function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found.',
  emptyIcon = null,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--ec-card-border)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--ec-card-border)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body ${col.className || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className={i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ec-card-border)] bg-white px-6 py-16 text-center">
        {emptyIcon && (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-[var(--ec-text-secondary)]">
            {emptyIcon}
          </div>
        )}
        <p className="text-sm text-[var(--ec-text-secondary)] font-body">
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--ec-card-border)] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--ec-card-border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ec-text-secondary)] font-body ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                className={`border-b border-[var(--ec-card-border)] last:border-b-0 transition-colors hover:bg-[var(--ec-gold)]/5 ${
                  i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={`px-4 py-3 text-sm text-[var(--ec-text)] font-body ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
