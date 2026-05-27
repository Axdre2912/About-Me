import { EntryPage } from "@/components/EntryPage";

export default async function EntryRoute({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return <EntryPage date={date} />;
}
