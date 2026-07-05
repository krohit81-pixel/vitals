import { cn } from "@/lib/utils";

export function Card({
  className,
  solid = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { solid?: boolean }) {
  return (
    <div
      className={cn(solid ? "glass-card-solid" : "glass-card", "p-5", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-center justify-between", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-[15px] font-medium text-ink dark:text-cream-100", className)}
      {...props}
    />
  );
}
