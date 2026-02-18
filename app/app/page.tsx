import { redirect } from "next/navigation";

/** The root page redirects straight to the Trade screen. */
export default function Home() {
  redirect("/trade");
}
