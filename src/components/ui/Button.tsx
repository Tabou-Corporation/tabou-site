import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type AnchorProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

type Props = ButtonProps | AnchorProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-gold text-text-inverted font-semibold",
    "hover:bg-gold-light",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:pointer-events-none",
  ].join(" "),
  secondary: [
    "bg-transparent text-gold border border-gold/40",
    "hover:border-gold hover:bg-gold/5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:pointer-events-none",
  ].join(" "),
  ghost: [
    "bg-transparent text-text-secondary border border-border",
    "hover:text-text-primary hover:border-border-accent",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:pointer-events-none",
  ].join(" "),
  danger: [
    "bg-red text-white font-semibold",
    "hover:bg-red-light",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:pointer-events-none",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm tracking-wide",
  md: "px-6 py-2.5 text-sm tracking-wide",
  lg: "px-8 py-3.5 text-base tracking-wide",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-body rounded transition-all duration-[180ms] cursor-pointer select-none";

export function Button(props: Props) {
  const { variant = "primary", size = "md", className, as, ...rest } = props;

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (as === "a") {
    const { ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return <a className={classes} {...anchorRest} />;
  }

  const { ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button className={classes} {...buttonRest} />;
}
