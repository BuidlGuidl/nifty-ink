"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// previous create page
const CreateInk = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="mt-5">Redirecting...</h1>
    </div>
  );
};

export default CreateInk;
