import { useMemo } from "react";
import { useBloggers } from "../hooks/useBloggers";
import { useT } from "../i18n/lang";

// Бегущая строка под первым экраном.
function Marquee() {
  const t = useT();
  const bloggers = useBloggers();

  const row = useMemo(() => {
    const categories = [...new Set(bloggers.map((blogger) => t(blogger.category)))];
    const words = [...categories, "Reels", "TikTok", "Stories", "YouTube", t("Интеграции")];
    return [...words, ...words];
  }, [bloggers, t]);

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div className="marquee-group" key={copy}>
            {row.map((word, index) => (
              <span key={`${copy}-${index}`}>
                {word}
                <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Marquee;
