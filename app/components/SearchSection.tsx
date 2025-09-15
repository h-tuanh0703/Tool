interface SearchSectionProps {
  title: string
  items: string[]
  setItems: (items: string[]) => void
  onSearch: (query: string, index: number) => void
  onBatchSearch?: (queries: string[]) => void
  placeholder: string
}

export default function SearchSection({ title, items, setItems, onSearch, onBatchSearch, placeholder }: SearchSectionProps) {
  return (
    <div className="search-section">
      <h3>{title}</h3>
      {items.map((item, i) => (
        <div key={i} className="search-input-group">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const newItems = [...items]
              newItems[i] = e.target.value
              setItems(newItems)
            }}
            placeholder={placeholder}
            className="modern-input"
          />
          <button 
            type="button" 
            onClick={() => onSearch(item, i)}
            className="search-btn"
          >
            🔍
          </button>
        </div>
      ))}
      <button 
        type="button" 
        onClick={() => setItems([...items, ''])}
        className="add-btn"
      >
        + Add {title.slice(0, -1)}
      </button>
      
      {onBatchSearch && (
        <button 
          type="button" 
          onClick={() => {
            console.log('Batch button clicked')
            const validItems = items.filter(item => item.trim())
            console.log('Valid items:', validItems)
            console.log('onBatchSearch function:', onBatchSearch)
            if (validItems.length > 0 && onBatchSearch) {
              console.log('Calling onBatchSearch...')
              onBatchSearch(validItems)
            } else {
              console.log('No valid items or onBatchSearch not available')
            }
          }}
          className="batch-search-btn"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          🚀 Search All {title}
        </button>
      )}
    </div>
  )
}