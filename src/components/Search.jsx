import { FaSearch, FaTimes } from "react-icons/fa";
import { useT } from "../i18n/lang";

function Search({ value, onChange }) {
  const t = useT();
  return (
    <div className="search">
      <FaSearch className="search-icon" aria-hidden="true" />

      <input
        type="search"
        placeholder={t("Поиск по имени, тегу или категории...")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t("Поиск блогера")}
      />

      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange("")}
          aria-label={t("Очистить поиск")}
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}

export default Search;
