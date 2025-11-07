"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@workspace/components-library";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LOGIN_URL = "/auth/sign-in";

const Logout = () => {
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();
  const { t } = useTranslation(["auth"]);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut({ callbackUrl: LOGIN_URL });

        toast({
          title: t("auth:logout.signing_out"),
          description: t("auth:logout.signed_out"),
        });

        router.replace(LOGIN_URL);
      } catch (error) {
        console.error("Logout error:", error);
        toast({
          title: t("auth:logout.error_title"),
          description: t("auth:logout.error_description"),
          variant: "destructive",
        });

        router.replace(LOGIN_URL);
      }
    };

    if (status === "authenticated") {
      handleLogout();
    } else if (status === "unauthenticated") {
      router.replace(LOGIN_URL);
    }
  }, [status, router, toast, t]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_60%)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur">
          {t("auth:logout.signing_out")}
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-background/80 p-10 shadow-2xl backdrop-blur">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("auth:logout.logging_out")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Logout;
