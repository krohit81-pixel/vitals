import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/profile/theme-toggle";
import { signOutAction } from "./actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="animate-fade-up space-y-6">
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
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <p className="text-sm text-black/50 dark:text-white/50">
          Weight, height, age, gender, activity level, diet type, and allergies — editable form lands
          in Milestone 3, backed by the <code className="rounded bg-black/5 px-1 dark:bg-white/10">users</code> table.
        </p>
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
