import {
  BookOpen,
  Check,
  ChevronDown,
  Database,
  GitBranch,
  LockKeyhole,
  Rocket,
  ServerCog,
  ShieldCheck,
  Tags,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

import type { DocsIcon as DocsIconName } from "../docs/types";

type InterfaceIcon = "approve-check" | "down-caret";

type IconName = DocsIconName | InterfaceIcon;

const iconComponents: Record<IconName, LucideIcon> = {
  "approve-check": Check,
  "approve-check-circle": ShieldCheck,
  "code-branch": GitBranch,
  database: Database,
  "down-caret": ChevronDown,
  link: Tags,
  "open-book": BookOpen,
  padlock: LockKeyhole,
  rocket: Rocket,
  server: ServerCog,
};

interface DocsIconProps {
  className?: string;
  label?: string;
  name: IconName;
  size?: LucideProps["size"];
  strokeWidth?: LucideProps["strokeWidth"];
}

export const DocsIcon = ({
  className,
  label,
  name,
  size = 16,
  strokeWidth = 1.25,
}: DocsIconProps) => {
  const Icon = iconComponents[name];

  return (
    <Icon
      absoluteStrokeWidth
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      focusable="false"
      role={label ? "img" : undefined}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
};
