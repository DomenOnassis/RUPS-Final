"use client";

import { useUser } from "../../hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userType = useUser();
  const router = useRouter();

  useEffect(() => {
    if (userType === null) return; 
    if (!userType) router.push("/"); 
  }, [userType, router]);

  if (!userType) {
     
    return <p>Niste prijavljeni</p>;
  }

  return <>{children}</>;
}
