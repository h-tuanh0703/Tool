interface ResultCardProps {
  type: string
  query: string
  results: string[]
}

export default function ResultCard({ type, query, results }: ResultCardProps) {
  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-type">{type}</span>
        <span className="result-query">{query}</span>
      </div>
      <div className="result-grid">
        {results.map((result: string, i: number) => (
          <div key={i} className="result-item-tag">
            {result}
          </div>
        ))}
      </div>
    </div>
  )
}