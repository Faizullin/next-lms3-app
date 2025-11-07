"use client";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { ScrollAnimation, ScrollGroup } from "@/components/public/scroll-animation";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ArrowRight, Award, BookOpen, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Trans, useTranslation } from "react-i18next";

export default function Page() {
  const { t } = useTranslation(["frontend"]);
  const features = [
    {
      icon: BookOpen,
      title: t("frontend:home.feature_systematic_title"),
      description: t("frontend:home.feature_systematic_desc"),
    },
    {
      icon: Users,
      title: t("frontend:home.feature_feedback_title"),
      description: t("frontend:home.feature_feedback_desc"),
    },
    {
      icon: Award,
      title: t("frontend:home.feature_growth_title"),
      description: t("frontend:home.feature_growth_desc"),
    },
    {
      icon: Zap,
      title: t("frontend:home.feature_practice_title"),
      description: t("frontend:home.feature_practice_desc"),
    },
  ];
  return ( 
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation variant="fadeUp" delay={0.2}>
              <Badge variant="secondary" className="mb-6 text-sm font-medium px-4 py-2">
                {t("frontend:home.badge_ai_platform")}
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
                <Trans
                  i18nKey="frontend:home.hero_title"
                  t={t}
                  components={{
                    "primary-label": <span className="text-primary" />,
                  }}
                />
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
                {t("frontend:home.hero_subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/courses">
                  <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                    {t("frontend:home.hero_start_learning")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold">
                  {t("frontend:home.hero_watch_lecture")}
                </Button>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollAnimation variant="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                <Trans
                  i18nKey="frontend:home.features_title"
                  t={t}
                  components={{
                    "primary-label": <span className="text-primary" />,
                  }}
                />
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t("frontend:home.features_subtitle")}
              </p>
            </div>
          </ScrollAnimation>

          <ScrollGroup staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <ScrollAnimation key={index} variant="fadeUp">
                  <Card className="group h-full border border-border/50 bg-card/95 dark:bg-slate-950/70 shadow-md transition-all duration-300 hover:border-primary/40 hover:shadow-xl">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-primary/15 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                        <feature.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </ScrollGroup>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimation variant="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                <Trans
                  i18nKey="frontend:home.courses_title"
                  t={t}
                  components={{
                    "primary-label": <span className="text-primary" />,
                  }}
                />
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t("frontend:home.courses_subtitle")}
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation variant="fadeUp">
            <div className="text-center">
              <Link href="/courses">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold">
                  {t("frontend:home.courses_explore_more")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <ScrollAnimation variant="fadeUp">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                {t("frontend:home.cta_title")}
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t("frontend:home.cta_subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="px-8 py-4 text-lg font-semibold"
                  >
                    {t("frontend:home.cta_start_learning")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary-foreground px-8 py-4 text-lg font-semibold"
                >
                  {t("frontend:home.cta_contact_us")}
                </Button>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      <Footer />
    </div>
  )
}