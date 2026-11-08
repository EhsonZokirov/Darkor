// Скрытое поле-ловушка для ботов: люди его не видят и не заполняют.
function Honeypot({ value, onChange }) {
  return (
    <div className="hp-wrap" aria-hidden="true">
      <label>
        Это поле не заполняйте
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export default Honeypot;
