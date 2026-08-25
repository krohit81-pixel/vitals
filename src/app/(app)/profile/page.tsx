import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/navigation/app-header";
import { ThemeToggle } from "@/components/profile/theme-toggle";
import { signOutAction } from "./actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="animate-fade-up space-y-6">
      <AppHeader />

      <header>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Profile</h1>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">{user?.email}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <ThemeToggle />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily goals</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-black/50 dark:text-white/50">
          Calories, protein, carbs, fat, fibre, and water — set your own targets for now.
        </p>
        <Link href="/profile/goals">
          <Button variant="outline" className="w-full">
            Edit goals
          </Button>
        </Link>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meal Shortcuts</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-black/50 dark:text-white/50">
          Manage the quick-add chips shown on Manual Entry.
        </p>
        <Link href="/profile/meal-shortcuts">
          <Button variant="outline" className="w-full">
            Manage Shortcuts
          </Button>
        </Link>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health Data</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-black/50 dark:text-white/50">
          Import steps, heart rate, HRV, and workouts from a HealthSave export.
        </p>
        <Link href="/profile/health-import">
          <Button variant="outline" className="w-full">
            Import Health Data
          </Button>
        </Link>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-black/50 dark:text-white/50">
          Height, weight, age, gender, activity level, diet type, and allergies — used by AI Coach to
          tailor its feedback and insights to you.
        </p>
        <Link href="/profile/personal-details">
          <Button variant="outline" className="w-full">
            Edit personal details
          </Button>
        </Link>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Reports</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-black/50 dark:text-white/50">
          Auto-generated focus areas, accomplishments, and next week&apos;s suggested focus — view or save
          as PDF.
        </p>
        <Link href="/reports">
          <Button variant="outline" className="w-full">
            View Weekly Reports
          </Button>
        </Link>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
