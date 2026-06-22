import type { Metadata } from "next";
import { Suspense } from "react";
import { config } from "@/lib/config";
import { Logo } from "@/components/ui/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-modal border border-hairline bg-surface p-8 shadow-card">
        <div className="mb-7 space-y-2 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="font-display text-h2 font-semibold text-hi">Create your account</h1>
          <p className="text-caption text-mid">Join free — unlock prompts and start creating.</p>
        </div>
        <Suspense>
          <AuthForm mode="signup" googleEnabled={config.googleEnabled} />
        </Suspense>
      </div>
    </div>
  );
}
