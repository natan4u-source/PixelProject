import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/config";
import {
  BUSINESS_GSTIN,
  BUSINESS_PHONE,
  businessPhoneTel,
  formatBusinessAddress,
  operatorLine,
} from "@/lib/business";

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
        <span className="text-white/50">Legal name:</span>{" "}
        <strong className="text-white">{BUSINESS_NAME}</strong>
      </p>
      <p>
        <span className="text-white/50">Registered address:</span>
        <br />
        <span className="whitespace-pre-line">{formatBusinessAddress()}</span>
      </p>
      <p>
        <span className="text-white/50">Email:</span>{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--kamal-bright)] underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
      {BUSINESS_PHONE ? (
        <p>
          <span className="text-white/50">Mobile:</span>{" "}
          <a href={`tel:${businessPhoneTel()}`} className="text-[var(--kamal-bright)] underline">
            {BUSINESS_PHONE}
          </a>
        </p>
      ) : null}
      {BUSINESS_GSTIN ? (
        <p>
          <span className="text-white/50">GSTIN:</span>{" "}
          <span className="font-mono text-white">{BUSINESS_GSTIN}</span>
        </p>
      ) : null}
    </div>
  );
}
