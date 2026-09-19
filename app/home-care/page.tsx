import { currentUser } from "@/lib/auth";
import HomeCareClient from "./client";

export default async function HomeCarePage() {
  const user = await currentUser();
  return <HomeCareClient isLoggedIn={!!user} />;
}

