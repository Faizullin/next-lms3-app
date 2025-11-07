"use client";

import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const socialItems = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Send, href: "#", label: "Telegram" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Mail, href: "mailto:lms3io-support@gmail.com", label: "Email" },
];

const quickLinks = [
  { href: "/", key: "frontend:nav.home" },
  { href: "/courses", key: "frontend:nav.courses" },
];

export function Footer() {
  const { t } = useTranslation(["frontend", "common"]);

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              LMS3 IO
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("frontend:footer.about")}
            </p>
            <div className="flex flex-wrap gap-2">
              {socialItems.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("frontend:footer.quick_links")}
            </h3>
            <div className="space-y-2">
              {quickLinks.map(({ href, key }) => (
                <Link
                  key={key}
                  href={href}
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(key)}
                </Link>
              ))}
            </div> */}
          </div>

          <div className="space-y-4">
            {/* <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {t("frontend:footer.contact")}
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>{t("frontend:footer.address")}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </span>
                <span>+7 777 377 7270</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <span>lms3io-support@gmail.com</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>{t("frontend:footer.rights")}</p>
            <p>{t("frontend:footer.tagline")}</p>
          </div>

        </div> */}
      </div>
    </footer>
  );
}

export default Footer;
