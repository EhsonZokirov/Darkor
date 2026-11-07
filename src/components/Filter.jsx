import { GENDERS } from "../config";

function Chips({ title, options, value, onChange }) {
  return (
    <div className="filter-group">
      <span className="filter-title">{title}</span>

      <div className="chips">
        <button
          type="button"
          className={`chip ${value === "" ? "active" : ""}`}
          aria-pressed={value === ""}
          onClick={() => onChange("")}
        >
          Все
        </button>

        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={`chip ${value === option ? "active" : ""}`}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Filter({ categories, category, setCategory, gender, setGender }) {
  return (
    <div className="filters">
      <Chips
        title="Категория"
        options={categories}
        value={category}
        onChange={setCategory}
      />

      <Chips
        title="Пол"
        options={GENDERS}
        value={gender}
        onChange={setGender}
      />
    </div>
  );
}

export default Filter;
