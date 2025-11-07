"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface DangerZoneProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DangerZone({ children, title, description }: DangerZoneProps) {
  const { t } = useTranslation("common");

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">
          {title || t("danger_zone")}
        </CardTitle>
        {(description || !title) && (
          <CardDescription>
            {description || t("danger_zone_description")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

