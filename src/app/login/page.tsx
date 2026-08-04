import { Suspense } from "react";
import { config } from "@/lib/config";
import { Logo } from "@/components/ui/logo";
import { AuthForm } from "@/components/auth/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in or create a free Prompt Studio account to unlock and generate.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-modal border border-hairline bg-surface p-8 shadow-card">
        <div className="mb-7 space-y-2 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="font-display text-h2 font-semibold text-hi">Welcome back</h1>
          <p className="text-caption text-mid">Sign in to unlock prompts and create.</p>
        </div>
        <Suspense>
          <AuthForm mode="login" googleEnabled={config.googleEnabled} />
        </Suspense>
      </div>
    </div>
  );
}
