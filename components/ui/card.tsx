"use client";

import { PropsWithChildren } from "react";

type WithClassName = PropsWithChildren<{ className?: string }>;

export function Card({ children, className }: WithClassName) {
  return (
    <div
      className={(
        "rounded-lg border bg-white shadow-sm " + (className || "")
      ).trim()}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: WithClassName) {
  return (
    <div className={("p-4 border-b " + (className || "")).trim()}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: WithClassName) {
  return (
    <h3
      className={(
        "text-lg font-semibold leading-none tracking-tight " + (className || "")
      ).trim()}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: WithClassName) {
  return <div className={("p-4 " + (className || "")).trim()}>{children}</div>;
}

export function CardFooter({ children, className }: WithClassName) {
  return (
    <div className={("p-4 border-t " + (className || "")).trim()}>
      {children}
    </div>
  );
}
