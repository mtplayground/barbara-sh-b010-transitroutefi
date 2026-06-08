import { useTranslation } from "react-i18next";

interface TrustDisclaimerProps {
  show: boolean;
}

export function TrustDisclaimer({ show }: TrustDisclaimerProps) {
  const { t } = useTranslation();

  if (!show) {
    return null;
  }

  return (
    <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft">
      <p className="text-readable font-bold text-transit-muted">
        {t("disclaimer.body")}
      </p>
    </section>
  );
}
