/**
 * @component SurfaceCard
 * @author ali
 * @description Styled card wrapper that optionally renders a header with title and description.
 *              Used as a layout surface throughout the dashboard for content sections.
 */
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SurfaceCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function SurfaceCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: SurfaceCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header section is only rendered when at least a title or description is provided */}
      {(title || description) && (
        <CardHeader className="border-b border-border/60">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(title || description ? "pt-6" : "pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
