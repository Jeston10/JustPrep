import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { getCurrentUser } from "@/server/auth/session";

const Authlayout = async ({ children }: { children: ReactNode }) => {
  if (await getCurrentUser()) redirect("/");
  return <div className="auth-layout">{children}</div>;
};

export default Authlayout;
