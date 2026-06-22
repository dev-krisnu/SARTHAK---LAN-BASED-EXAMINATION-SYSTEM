import { Suspense } from "react";

import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
