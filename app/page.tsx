import { redirect } from "next/navigation";

// The public card lives at /card — redirect the root to it
export default function RootPage() {
  redirect("/card");
}
