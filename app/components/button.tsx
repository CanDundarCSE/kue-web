import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: [
    "bg-[#1e40af] text-white hover:bg-[#1b3895]",
    "dark:bg-[#6b7bf5] dark:hover:bg-[#818cf8]",
    "focus-visible:ring-[#1e40af] dark:focus-visible:ring-[#6b7bf5]",
    "focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
  ].join(" "),
  secondary: [
    "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
    "dark:border-white/15 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900",
    "focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500",
    "focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
  ].join(" "),
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-sm",
  md: "h-11 gap-2 px-6 text-[15px]",
  lg: "h-12 gap-2 px-7 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return [
    "inline-flex shrink-0 select-none items-center justify-center rounded-xl font-sans font-semibold",
    "transition-colors duration-150 motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    fullWidth ? "w-full" : "",
    className ?? "",
  ].join(" ");
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return <a {...props} className={buttonClasses({ variant, size, fullWidth, className })} />;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
