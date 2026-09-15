import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Authlayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();

  if (isUserAuthenticated) redirect("/");
  return <div className="auth-layout">{children}</div>;
};

export default Authlayout;
