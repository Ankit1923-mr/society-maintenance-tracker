import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import HeroScene from "@/components/HeroScene";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/complaints");
    }
  }

  return <HeroScene />;
}
