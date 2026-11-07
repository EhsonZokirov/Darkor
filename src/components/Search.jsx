import { FaSearch, FaTimes } from "react-icons/fa";

function Search({ value, onChange }) {
  return (
    <div className="search">
      <FaSearch className="search-icon" aria-hidden="true" />

      <input
        type="search"
        placeholder="Поиск по имени, тегу или категории..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Поиск блогера"
      />

      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange("")}
          aria-label="Очистить поиск"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}

export default Search;
