import * as React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.ComponentProps<"div"> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.ComponentProps<"div"> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
        className
      )}
      {...props}
    />
  );
}

interface CardContentProps extends React.ComponentProps<"div"> {}

function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={cn("px-6", className)} {...props} />
  );
}

export { Card, CardHeader, CardContent };
