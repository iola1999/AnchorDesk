import { type ReactNode, type SVGProps } from "react";

import { cn } from "@/lib/ui";

export type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function IconBase({
  children,
  className,
  title,
  viewBox = "0 0 20 20",
  ...props
}: IconProps & {
  children: ReactNode;
  viewBox?: string;
}) {
  const isDecorative = !title && !props["aria-label"] && !props["aria-labelledby"];

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden={isDecorative ? true : undefined}
      role={isDecorative ? undefined : "img"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function ArrowLeftIcon({
  className,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M12.5 4.75 7.25 10l5.25 5.25" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function PlusIcon({
  className,
  strokeWidth = 1.7,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M10 4.5v11M4.5 10h11" strokeLinecap="round" />
    </IconBase>
  );
}

export function ArrowUpIcon({
  className,
  strokeWidth = 1.7,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M10 4.167v11.666m0-11.666 4.166 4.166M10 4.167 5.833 8.333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ShareIcon({
  className,
  strokeWidth = 1.7,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M8.75 10.833 13.958 5.625M11.458 5.625h2.5v2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.583 6.25H7.25a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 2.5 2.5h5.5a2.5 2.5 0 0 0 2.5-2.5v-2.333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function MenuIcon({
  className,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-5", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M3.75 5.5h12.5M3.75 10h12.5M3.75 14.5h12.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function CloseIcon({
  className,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-[18px]", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
    </IconBase>
  );
}

export function AnswerIcon({
  className,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M4.167 5.833h11.666M4.167 10h8.333M4.167 14.167H10" strokeLinecap="round" />
    </IconBase>
  );
}

export function SourceIcon({
  className,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M8.125 6.667 5.833 8.96a2.357 2.357 0 0 0 3.334 3.334l2.083-2.084M11.875 13.333l2.292-2.293a2.357 2.357 0 1 0-3.334-3.334L8.75 9.79"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ExportIcon({
  className,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M10 3.75v8.333m0 0 3.125-3.125M10 12.083 6.875 8.958M4.583 15.417h10.834"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function CopyIcon({
  className,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <rect x="7.083" y="5.417" width="8.333" height="10" rx="2" />
      <path
        d="M5.833 12.5h-.625A1.875 1.875 0 0 1 3.333 10.625V5.208c0-1.035.84-1.875 1.875-1.875h5.417c1.035 0 1.875.84 1.875 1.875v.625"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function RegenerateIcon({
  className,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M15.208 8.333a5.417 5.417 0 1 0 1.042 3.125m0-3.125V4.583m0 3.75h-3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ShieldCheckIcon({
  className,
  strokeWidth = 1.7,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M10 2.75c1.52 1.24 3.3 1.94 5.5 2.2v3.28c0 4.02-2.19 6.88-5.5 9.02C6.69 15.11 4.5 12.25 4.5 8.23V4.95c2.2-.26 3.98-.96 5.5-2.2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m7.75 10.1 1.55 1.56 2.95-3.22" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function UserIcon({
  className,
  strokeWidth = 1.7,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M10 10.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4.75 16.25a5.25 5.25 0 0 1 10.5 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ChevronDownIcon({
  className,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M5.5 7.5 10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SlidersIcon({
  className,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M7.25 4.25v11.5M12.75 4.25v11.5M4.25 7.25h6M9.75 12.75h6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.25" cy="7.25" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="12.75" cy="12.75" r="1.75" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function LogoutIcon({
  className,
  strokeWidth = 1.7,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        d="M8 4.75H6.75a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2H8M11.25 6.5 14.75 10m0 0-3.5 3.5M14.75 10H8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function MoreHorizontalIcon({
  className,
  ...props
}: IconProps) {
  return (
    <IconBase
      className={cn("size-5", className)}
      fill="currentColor"
      {...props}
    >
      <circle cx="4" cy="10" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="16" cy="10" r="1.6" />
    </IconBase>
  );
}

export function TrashIcon({
  className,
  strokeWidth = 1.8,
  ...props
}: IconProps) {
  return (
    <IconBase
      viewBox="0 0 24 24"
      className={cn("size-4", className)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function AnchorDeskLogo({
  className,
  ...props
}: Omit<IconProps, "strokeWidth">) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("shrink-0", className)}
      aria-hidden={!props.title && !props["aria-label"] ? true : undefined}
      role={!props.title && !props["aria-label"] ? undefined : "img"}
      {...props}
    >
      {props.title ? <title>{props.title}</title> : null}
      <defs>
        <linearGradient id="ad-m" x1=".5" y1="0" x2=".5" y2="1">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="76" fill="#09090b" />
      <g
        fill="none"
        stroke="url(#ad-m)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="30"
      >
        <circle cx="256" cy="138" r="30" />
        <line x1="256" y1="168" x2="256" y2="348" />
        <line x1="182" y1="258" x2="330" y2="258" />
        <path d="M256 348c0 44-58 58-82 30" />
        <path d="M256 348c0 44 58 58 82 30" />
      </g>
    </svg>
  );
}
