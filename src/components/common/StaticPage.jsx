import { PageTitle } from "./States";

// Mise en page commune des pages de contenu (grand public, légales, guides…).
export const Section = ({ title, children, testId }) => (
  <section data-testid={testId} className="card-elysium p-6 sm:p-8">
    {title && <h2 className="section-title">{title}</h2>}
    <div className="prose-elysium">{children}</div>
  </section>
);

export const P = ({ children }) => <p className="text-sm text-zinc-400 leading-relaxed mt-3">{children}</p>;

export default function StaticPage({ eyebrow, title, description, children, right }) {
  return (
    <div className="max-w-4xl space-y-8">
      <PageTitle eyebrow={eyebrow} title={title} right={right}>
        {description && <p className="text-sm text-zinc-400 mt-2 max-w-2xl">{description}</p>}
      </PageTitle>
      {children}
    </div>
  );
}
