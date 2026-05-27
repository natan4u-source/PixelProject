import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/config";
import { operatorLine } from "@/lib/business";

type Props = {
  showOperatorLine?: boolean;
  className?: string;
};

export function LegalBusinessDetails({ showOperatorLine = true, className = "" }: Props) {
  return (
    <div className={`space-y-2 text-sm leading-relaxed text-white/75 ${className}`}>
      {showOperatorLine && (
        <p>
          <strong className="text-white">{operatorLine()}</strong>
        </p>
      )}
      <p>
        <span className="text-white/50">Company:</span>{" "}
        <strong className="text-white">{BUSINESS_NAME}</strong>
      </p>
      <p>
        <span className="text-white/50">Email:</span>{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
