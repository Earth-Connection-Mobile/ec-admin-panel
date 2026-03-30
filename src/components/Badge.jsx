export default function Badge({ children, color = 'gray' }) {
  const colorMap = {
    green: 'bg-[#2D6A4F]/10 text-[#2D6A4F]',
    gold: 'bg-[#D8A657]/15 text-[#B8862D]',
    forest: 'bg-[#1B4332]/10 text-[#1B4332]',
    gray: 'bg-gray-100 text-gray-600',
    rust: 'bg-[#9C4A1A]/10 text-[#9C4A1A]',
  }

  const classes = colorMap[color] || colorMap.gray

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-body ${classes}`}
    >
      {children}
    </span>
  )
}
