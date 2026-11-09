// Крупные цветы-орнаменты, медленно вращающиеся по краям экрана.
// Только декор: не мешает кликам и скрыт от скринридеров.
function Flower() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="-100 -100 200 200" fill="none" stroke="currentColor" strokeWidth="1.2">
      {petals.map((a) => (
        <path key={a} d="M0 -22 C 14 -44 14 -72 0 -92 C -14 -72 -14 -44 0 -22 Z" transform={`rotate(${a})`} />
      ))}
      {petals.map((a) => (
        <circle key={`d${a}`} cx="0" cy="-98" r="1.8" transform={`rotate(${a + 15})`} />
      ))}
      <circle r="18" />
      <circle r="8" />
    </svg>
  );
}

function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <span className="bloom bloom-1">
        <Flower />
      </span>
      <span className="bloom bloom-2">
        <Flower />
      </span>
    </div>
  );
}

export default Ornament;
