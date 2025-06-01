interface TechListProps {
  languages: { name: string; count: number }[]
}

export default function TechList({ languages }: TechListProps) {
  // Sort by count and take top 5
  const topLanguages = [...languages]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="notion-card p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Frequently Used Technologies</h3>
      <div className="flex flex-wrap">
        {topLanguages.map((lang) => (
          <span key={lang.name} className="tech-pill">
            {lang.name}
            <span className="ml-1 text-gray-500">({lang.count})</span>
          </span>
        ))}
      </div>
    </div>
  )
}
