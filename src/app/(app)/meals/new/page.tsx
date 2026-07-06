import { Suspense } from "react";
import { NewMealFlow } from "./new-meal-flow";

export default function NewMealPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 w-full" />}>
      <NewMealFlow />
    </Suspense>
  );
}
