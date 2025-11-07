"use client";

import { ScrollAnimation } from "@/components/public/scroll-animation";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebase";
import { getUserFriendlyErrorMessage } from "@/lib/auth/error-handler";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { t } = useTranslation(["auth"]);

  const isFormValid = email.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error) {
      const errorMessage = getUserFriendlyErrorMessage(error);
      setAuthError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_60%)]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" aria-hidden />
        <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-20 text-center">
          <ScrollAnimation variant="fadeUp" delay={0.1}>
            <div className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur">
              {t("auth:forgot_password.card_title")}
            </div>
          </ScrollAnimation>

          <ScrollAnimation variant="fadeUp" delay={0.2}>
            <Card className="w-full max-w-lg overflow-hidden border border-border/60 bg-background/90 shadow-2xl backdrop-blur">
              <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500" aria-hidden />
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {t("auth:forgot_password.success_title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("auth:forgot_password.success_description")}
                  </p>
                </div>
                <Button asChild size="lg" className="h-11 w-full bg-brand-primary text-sm font-medium text-white transition hover:bg-brand-primary-hover">
                  <Link href="/auth/sign-in">{t("auth:forgot_password.back_to_signin")}</Link>
                </Button>
              </CardContent>
            </Card>
          </ScrollAnimation>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_60%)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-20">
        <ScrollAnimation variant="fadeUp" delay={0.1}>
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur">
              {t("auth:forgot_password.card_title")}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {t("auth:forgot_password.title")}
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("auth:forgot_password.subtitle")}
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation variant="fadeUp" delay={0.2}>
          <Card className="w-full max-w-xl overflow-hidden border border-border/60 bg-background/90 shadow-2xl backdrop-blur">
            <CardContent className="space-y-6 p-6 md:p-8">
              {authError && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {t(authError)}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    {t("auth:forgot_password.email_label")}
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-md border-border bg-background pl-10 pr-3 text-sm focus-visible:ring-brand-primary"
                      placeholder={t("auth:forgot_password.email_placeholder")}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full bg-brand-primary text-sm font-medium text-white transition hover:bg-brand-primary-hover"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("auth:forgot_password.sending")}
                    </>
                  ) : (
                    t("auth:forgot_password.send_button")
                  )}
                </Button>
              </form>

              <div className="text-center text-xs text-muted-foreground">
                <Link
                  href="/auth/sign-in"
                  className="font-medium text-brand-primary transition hover:text-brand-primary-hover"
                >
                  {t("auth:forgot_password.back_to_signin")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </ScrollAnimation>
      </div>
    </section>
  );
}

