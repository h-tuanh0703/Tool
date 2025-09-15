interface SearchSectionProps {
  title: string
  items: string[]
  setItems: (items: string[]) => void
  placeholder: string
}

export default function SearchSection({ title, items, setItems, placeholder }: SearchSectionProps) {
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
        </div>
      ))}
      <button 
        type="button" 
        onClick={() => setItems([...items, ''])}
        className="add-btn"
      >
        + Add {title.slice(0, -1)}
      </button>
    </div>
  )
}