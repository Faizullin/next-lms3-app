"use client";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import {
  ScrollAnimation,
  ScrollGroup,
} from "@/components/public/scroll-animation";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ArrowRight, BookOpen, Users, Award, Clock, Star, CheckCircle, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { WebsiteSettings } from "@workspace/common-models";
import { useSiteInfo } from "@/components/contexts/site-info-context";

interface HomePageClientProps {
  websiteSettings: WebsiteSettings;
}

export default function HomePageClient({ websiteSettings }: HomePageClientProps) {
  const { siteInfo } = useSiteInfo();
  const { t } = useTranslation("common");

  const features = [
    {
      icon: BookOpen,
      title: t("home.features.interactive_learning.title"),
      description: t("home.features.interactive_learning.description"),
    },
    {
      icon: Users,
      title: t("home.features.expert_instructors.title"),
      description: t("home.features.expert_instructors.description"),
    },
    {
      icon: Award,
      title: t("home.features.certified_programs.title"),
      description: t("home.features.certified_programs.description"),
    },
    {
      icon: Zap,
      title: t("home.features.ai_powered_learning.title"),
      description: t("home.features.ai_powered_learning.description"),
    },
  ];

  const stats = [
    { number: "50K+", label: t("home.stats.students_enrolled") },
    { number: "200+", label: t("home.stats.expert_instructors") },
    { number: "95%", label: t("home.stats.success_rate") },
    { number: "24/7", label: t("home.stats.support_available") },
  ];

  // Featured courses with new content
  const courses = useMemo(() => {
    const defaultCourses = [
      {
        slug: "web-development-fundamentals",
        image: "/img/web-dev-course.jpg",
        title: "Web Development Fundamentals",
        level: "Beginner",
        duration: "12 weeks",
        rating: 4.8,
        students: 15420,
        price: "Free",
        shortDescription: "Master HTML, CSS, and JavaScript to build modern web applications.",
      },
      {
        slug: "data-science-with-python",
        image: "/img/data-science-course.jpg",
        title: "Data Science with Python",
        level: "Intermediate",
        duration: "16 weeks",
        rating: 4.9,
        students: 12850,
        price: "Premium",
        shortDescription: "Learn data analysis, machine learning, and visualization using Python.",
      },
      {
        slug: "mobile-app-development",
        image: "/img/mobile-dev-course.jpg",
        title: "Mobile App Development",
        level: "Intermediate",
        duration: "14 weeks",
        rating: 4.7,
        students: 9870,
        price: "Free",
        shortDescription: "Build cross-platform mobile apps with React Native and Flutter.",
      },
    ];

    return (
      websiteSettings?.mainPage.featuredCourses
        ?.sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((course, index) => ({
          ...defaultCourses[index % defaultCourses.length],
          title: course.title,
          shortDescription: course.shortDescription,
        })) || defaultCourses
    );
  }, [websiteSettings?.mainPage.featuredCourses]);


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
                {t("home.hero.badge")}
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
                {t("home.hero.title")}{" "}
                <span className="text-primary">{t("home.hero.title_highlight")}</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
                {t("home.hero.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/courses">
                  <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                    {t("home.hero.explore_courses")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold">
                  {t("home.hero.watch_demo")}
                </Button>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <ScrollGroup staggerDelay={0.1}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <ScrollAnimation key={index} variant="scale">
                  <Card className="text-center border-0 shadow-none bg-transparent">
                    <CardContent className="p-6">
                      <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                        {stat.number}
                      </div>
                      <div className="text-muted-foreground font-medium text-sm">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </ScrollGroup>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <ScrollAnimation variant="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {t("home.features.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t("home.features.description")}
              </p>
            </div>
          </ScrollAnimation>

          <ScrollGroup staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <ScrollAnimation key={index} variant="fadeUp">
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <feature.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-4">
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
                {t("home.courses.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t("home.courses.description")}
              </p>
            </div>
          </ScrollAnimation>

          <ScrollGroup staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {courses.map((course, index) => (
                <ScrollAnimation key={index} variant="fadeUp">
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="relative">
                      <Image
                        src={course.image || "/placeholder-course.jpg"}
                        alt={course.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                      <Badge 
                        className={`absolute top-4 right-4 ${
                          course.price === "Free" ? "bg-green-500" : "bg-primary"
                        } text-white`}
                      >
                        {course.price}
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {course.level}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{course.duration}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {course.shortDescription}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(course.rating || 0) ? "fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground ml-1">
                            {course.rating}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {(course.students || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <Link href={`/courses/${course.slug}`}>
                        <Button className="w-full">
                          {t("home.courses.enroll_now")}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          </ScrollGroup>

          <ScrollAnimation variant="fadeUp">
            <div className="text-center">
              <Link href="/courses">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold">
                  {t("home.courses.view_all_courses")}
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
                {t("home.cta.title")}
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t("home.cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="px-8 py-4 text-lg font-semibold"
                  >
                    {t("home.cta.get_started_free")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg font-semibold"
                >
                  {t("home.cta.learn_more")}
                </Button>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      <Footer />
    </div>
  );
}
