interface ExportButtonProps {
  combinedData: any[]
  onClick: () => void
}

export default function ExportButton({ combinedData, onClick }: ExportButtonProps) {
  const hasData = combinedData.some(item => item && item.results.length > 0)
  
  return (
    <button 
      className={`export-btn ${hasData ? 'active' : 'disabled'}`}
      onClick={onClick}
      disabled={!hasData}
    >
      📊 Export CSV ({combinedData.filter(item => item).length} searches)
    </button>
  )
}