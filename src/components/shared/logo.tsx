import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = { sm: 32, md: 48, lg: 64 } as const;

export function Logo({
  size = "sm",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  return (
    <Image
      src="/logo.png"
      alt="Vitals"
      width={px}
      height={px}
      priority
      className={cn("rounded-full", className)}
    />
  );
}
