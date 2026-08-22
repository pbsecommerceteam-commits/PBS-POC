import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

/** The base surface for every grouped block in the product — a real SaaS
 *  card: a subtle border, restrained radius and a faint tint that reads as
 *  a surface rather than an outline. Replaces the prototype's blueprint/
 *  corner-mark treatment. Pass `interactive` for cards that act as a single
 *  click target (adds hover lift + pointer). */
export function Card({ children, style, className, interactive, selected, padding, onClick }: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  interactive?: boolean;
  selected?: boolean;
  padding?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className={"sl-card-surface" + (interactive ? " sl-card-surface--interactive" : "") + (selected ? " sl-card-surface--selected" : "") + (className ? " " + className : "")}
      style={{ padding: padding ?? "20px 22px", ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
