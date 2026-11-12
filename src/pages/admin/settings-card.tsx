import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";

export type SettingsCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Controlled expanded state. When omitted, the card manages its own state. */
  open?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
  /** Optional visibility switch shown in the card header. */
  enabledToggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
  };
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Collapsible settings section used across the admin Settings page.
 * The header stays visible so every block remains easy to find when collapsed.
 */
export function SettingsCard({
  title,
  description,
  icon: Icon,
  open,
  onToggle,
  defaultOpen = false,
  enabledToggle,
  badge,
  className = "",
  children,
}: SettingsCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const expanded = open !== undefined ? open : internalOpen;
  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((v) => !v);
  };

  return (
    <section className={`overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--glass-solid)] ${className}`}>
      <div className="flex items-start gap-3 p-5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span className="mt-0.5 shrink-0 text-[var(--text-2)]">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" /> : null}
          <span className="min-w-0">
            <span className="block font-hud text-sm font-bold text-[var(--text-1)]">{title}</span>
            {description ? (
              <span className="mt-0.5 block text-xs leading-relaxed text-[var(--text-2)]">{description}</span>
            ) : null}
          </span>
        </button>

        {badge ? <div className="shrink-0">{badge}</div> : null}

        {enabledToggle ? (
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={enabledToggle.checked}
              onChange={(e) => enabledToggle.onChange(e.target.checked)}
              className="accent-[var(--gold)]"
            />
            {enabledToggle.label ?? "Visible"}
          </label>
        ) : null}
      </div>

      {expanded ? <div className="space-y-3 border-t border-[var(--line)] px-5 pb-5 pt-4">{children}</div> : null}
    </section>
  );
}
