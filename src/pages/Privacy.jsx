import { CONTACT } from "../config";
import privacy from "../content/privacy";
import { useLang } from "../i18n/lang";

function Privacy() {
  const { lang } = useLang();
  const page = privacy[lang] || privacy.ru;
  const withEmail = (text) => text.replace("{email}", CONTACT.email);

  return (
    <main className="privacy-page">
      <span className="section-label">DARKOR</span>
      <h1>{page.title}</h1>
      <p className="privacy-updated">{page.updated}</p>

      {page.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.text && <p>{withEmail(section.text)}</p>}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}

export default Privacy;
