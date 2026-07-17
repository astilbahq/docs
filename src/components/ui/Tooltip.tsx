import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { type ReactElement, type ReactNode, useState } from "react";

import { tooltipStyles as styles } from "./Tooltip.styles";

interface TooltipProps {
  active?: boolean;
  activeLabel?: string;
  children: ReactElement;
  label: string;
  onActiveDismiss?: () => void;
}

export const Tooltip = ({
  active = false,
  activeLabel,
  children,
  label,
  onActiveDismiss,
}: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const currentLabel = active && activeLabel ? activeLabel : label;

  return (
    <BaseTooltip.Root
      onOpenChange={(nextOpen, eventDetails) => {
        setOpen(nextOpen);

        if (!nextOpen && active && eventDetails.reason === "escape-key") {
          onActiveDismiss?.();
        }
      }}
      open={open || active}
    >
      <BaseTooltip.Trigger closeOnClick={false} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          align="center"
          className={styles.positioner}
          collisionPadding={8}
          side="top"
          sideOffset={8}
        >
          <BaseTooltip.Popup
            aria-label={currentLabel}
            className={styles.popup}
            role="tooltip"
          >
            <span
              aria-hidden="true"
              className={styles.labels}
              data-active={active ? "true" : "false"}
            >
              <span data-tooltip-label="idle">{label}</span>
              {activeLabel ? (
                <span data-tooltip-label="active">{activeLabel}</span>
              ) : null}
            </span>
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
};

interface TooltipProviderProps {
  children: ReactNode;
}

export const TooltipProvider = ({ children }: TooltipProviderProps) => (
  <BaseTooltip.Provider closeDelay={0} delay={0}>
    {children}
  </BaseTooltip.Provider>
);
