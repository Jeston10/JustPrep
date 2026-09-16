import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";

import Agent from "@/components/Agent";

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <h3>Interview generation</h3>

      <Agent userName={user.name} userId={user.id} type="generate" />
    </>
  );
};

export default Page;
