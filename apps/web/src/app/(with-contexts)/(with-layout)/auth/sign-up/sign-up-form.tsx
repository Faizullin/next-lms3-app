"use client";

import { ScrollAnimation } from "@/components/public/scroll-animation";
import { useFirebaseAuth } from "@/hooks/use-auth";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getUserFriendlyErrorMessage } from "@/lib/auth/error-handler";
import { z } from "zod";

// Zod validation schema
const signUpSchema = z.object({
  name: z.string().min(1, "name_required"),
  email: z.string().email("invalid_email"),
  password: z.string().min(6, "password_too_short"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "passwords_dont_match",
  path: ["confirmPassword"],
});

export default function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const firebaseAuth = useFirebaseAuth();
  const router = useRouter();
  const { t } = useTranslation(["auth"]);

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.password.trim() && formData.confirmPassword.trim();

  const handleGoogleSignup = async () => {
    try {
      setAuthError(null);
      const result = await firebaseAuth.mutateAsync({ provider: "google" });

      if (result.success) {
        router.push(redirectTo || "/dashboard");
      } else {
        const errorMessage = getUserFriendlyErrorMessage(result.error);
        setAuthError(errorMessage);
      }
    } catch (error) {
      const errorMessage = getUserFriendlyErrorMessage(error);
      setAuthError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setAuthError(null);
    setValidationErrors({});
    setIsEmailSubmitting(true);

    try {
      // Validate form with Zod
      const validatedData = signUpSchema.parse(formData);

      const result = await firebaseAuth.mutateAsync({
        provider: "signup",
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: validatedData.password,
        },
      });

      if (result.success) {
        router.push(redirectTo || "/dashboard");
      } else {
        const errorMessage = getUserFriendlyErrorMessage(result.error);
        setAuthError(errorMessage);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      } else {
        const errorMessage = getUserFriendlyErrorMessage(error);
        setAuthError(errorMessage);
      }
    } finally {
      setIsEmailSubmitting(false);
    }
  };

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
              {t("auth:signup.card_title")}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {t("auth:signup.welcome_back")}
            </h1>
          </div>
        </ScrollAnimation>

        <ScrollAnimation variant="fadeUp" delay={0.2}>
          <Card className="w-full max-w-xl overflow-hidden border border-border/60 bg-background/90 shadow-2xl backdrop-blur">
            <CardContent className="space-y-8 p-6 md:p-8">
              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex h-11 w-full items-center justify-center gap-2 text-sm"
                  onClick={handleGoogleSignup}
                  disabled={firebaseAuth.isPending}
                >
                  {firebaseAuth.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {firebaseAuth.isPending ? t("auth:signup.google_signing_up") : t("auth:signup.google_signup")}
                </Button>

                <div className="relative flex items-center gap-3">
                  <span className="h-px w-full bg-border" />
                  <span className="relative bg-background px-3 text-xs text-muted-foreground">
                    {t("auth:signup.or_continue")}
                  </span>
                  <span className="h-px w-full bg-border" />
                </div>

                {authError && (
                  <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {t(authError, { defaultValue: t("auth:signup.error") })}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="name" className="text-xs font-medium text-foreground">
                    {t("auth:signup.name_label")}
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-11 w-full rounded-md border-border bg-background pl-10 pr-3 text-sm focus-visible:ring-brand-primary"
                      placeholder={t("auth:signup.name_placeholder")}
                      required
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="text-xs text-destructive">
                      {t(`error:validation.${validationErrors.name}`)}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    {t("auth:signup.email_label")}
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-11 w-full rounded-md border-border bg-background pl-10 pr-3 text-sm focus-visible:ring-brand-primary"
                      placeholder={t("auth:signup.email_placeholder")}
                      required
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-xs text-destructive">
                      {t(`error:validation.${validationErrors.email}`)}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    {t("auth:signup.password_label")}
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="h-11 w-full rounded-md border-border bg-background pl-10 pr-11 text-sm focus-visible:ring-brand-primary"
                      placeholder={t("auth:signup.password_placeholder")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-xs text-destructive">
                      {t(`error:validation.${validationErrors.password}`)}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                    {t("auth:signup.confirm_password_label")}
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className="h-11 w-full rounded-md border-border bg-background pl-10 pr-11 text-sm focus-visible:ring-brand-primary"
                      placeholder={t("auth:signup.confirm_password_placeholder")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {t(`error:validation.${validationErrors.confirmPassword}`)}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full bg-brand-primary text-sm font-medium text-white transition hover:bg-brand-primary-hover"
                    disabled={!isFormValid || isEmailSubmitting}
                  >
                    {isEmailSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth:signup.signing_up")}
                      </>
                    ) : (
                      t("auth:signup.signup_button")
                    )}
                  </Button>
                </div>
              </form>

              <div className="space-y-3 text-center text-xs text-muted-foreground">
                <p>
                  {t("auth:signup.has_account")} {" "}
                  <Link
                    href="/auth/sign-in"
                    className="font-medium text-brand-primary transition hover:text-brand-primary-hover"
                  >
                    {t("auth:signup.signin_link")}
                  </Link>
                </p>
                <p className="leading-relaxed">
                  {t("auth:signup.terms_text")}
                </p>
              </div>
            </CardContent>
          </Card>
        </ScrollAnimation>
      </div>
    </section>
  );
}
