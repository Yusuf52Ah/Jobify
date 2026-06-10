import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<main className="jobify-shell px-6 py-8" />}
    >
      <LoginClient />
    </Suspense>
  );
}
