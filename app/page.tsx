import { sql } from "@/lib/db";
import GoalsBoard, { type Goal } from "./goals-board";

export const dynamic = "force-dynamic";

export default async function Home() {
  const goals = (await sql`
    SELECT * FROM goals ORDER BY created_at DESC
  `) as unknown as Goal[];

  return (
    <main className="mx-auto max-w-2xl w-full p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Life Dashboard</h1>
      <GoalsBoard initialGoals={goals} />
    </main>
  );
}
