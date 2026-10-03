import Dashboard from "./components/Dashboard";
import { getIssues, getKnowledge } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [knowledge, issues] = await Promise.all([getKnowledge(), getIssues()]);

  return (
    <main>
      <Dashboard knowledge={knowledge} initialIssues={issues} />
    </main>
  );
}
