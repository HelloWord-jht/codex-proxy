import { useT } from "../../../shared/i18n/context";

interface FooterProps {
  proxyVersion: string | null;
  proxyCommit: string | null;
}

export function Footer({ proxyVersion, proxyCommit }: FooterProps) {
  const t = useT();

  return (
    <footer class="mt-auto border-t border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark py-5 transition-colors">
      <div class="container mx-auto px-4 flex flex-col items-center gap-2">
        <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.75rem] text-slate-400 dark:text-text-dim font-mono">
          <span>Proxy v{proxyVersion ?? "..."}{proxyCommit ? ` (${proxyCommit})` : ""}</span>
        </div>
        <p class="text-[0.75rem] text-slate-400 dark:text-text-dim">{t("footer")}</p>
      </div>
    </footer>
  );
}
