import { useId } from "react";

// Логотип DARKOR: фирменная буква D с косым разрезом и надпись,
// где «OR» подсвечено оранжевым.
function Logo({ size = 30 }) {
  const gradientId = useId();

  return (
    <span className="logo" role="img" aria-label="DARKOR">
      <svg
        className="logo-mark"
        width={Math.round((size * 35) / 34)}
        height={size}
        viewBox="4 3 35 34"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff2b3a" />
            <stop offset="1" stopColor="#ff9a3d" />
          </linearGradient>
        </defs>

        <path
          className="d-stem"
          fill={`url(#${gradientId})`}
          d="M6 6H17L10 34H6Z"
        />
        <path
          className="d-bowl"
          fill={`url(#${gradientId})`}
          d="M21 6H24C32 6 37 12 37 20S32 34 24 34H14L16.2 28H24C28.4 28 31.4 24.8 31.4 20S28.4 12 24 12H19.6Z"
        />
      </svg>

      <span className="logo-text" aria-hidden="true">
        DARK<span>OR</span>
      </span>
    </span>
  );
}

export default Logo;
