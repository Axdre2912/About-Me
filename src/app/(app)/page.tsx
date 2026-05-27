import { redirect } from "next/navigation";
import { formatDateKey } from "@/lib/utils";

export default function HomePage() {
  redirect(`/entry/${formatDateKey(new Date())}`);
}
