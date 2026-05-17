import { useLocale } from "./locale-context";
import { learnContent } from "./learn-content";
import { ResponsiveSection } from "./responsive-section";
import { useT } from "./use-t";

interface LearnSectionProps {
  gameId: string;
}

export function LearnSection({ gameId }: LearnSectionProps) {
  const { locale } = useLocale();
  const t = useT();
  const content = learnContent[gameId]?.[locale];

  if (!content) return null;

  return (
    <ResponsiveSection
      title={t("game.learn")}
      className="border-y border-border py-5"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">{content.whatIsIt.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {content.whatIsIt.body}
          </p>
        </div>

        <div>
          <h3 className="font-semibold">{content.mathBehind.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {content.mathBehind.intro}
          </p>
          {content.mathBehind.concepts ? (
            <ul className="mt-2 grid gap-1.5">
              {content.mathBehind.concepts.map((concept) => (
                <li className="text-sm" key={concept.term}>
                  <span className="font-medium">{concept.term}:</span>{" "}
                  <span className="text-muted-foreground">
                    {concept.description}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <h3 className="font-semibold">{content.tips.title}</h3>
          {content.tips.items ? (
            <ul className="mt-1 grid gap-1 text-sm text-muted-foreground">
              {content.tips.items.map((tip, i) => (
                <li key={i}>- {tip}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <h3 className="font-semibold">{content.funFact.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {content.funFact.body}
          </p>
        </div>
      </div>
    </ResponsiveSection>
  );
}
