"use client";

import { ErrorComponent } from "@/components/error/error-component";
import { Button } from "@workspace/ui/components/button";
import { AlertTriangle } from "lucide-react";

export default function NoDomainPage({
  rootUrl,
}: {
  rootUrl: string;
}) {
  const handleGoToRoot = () => {
    window.location.href = rootUrl;
  };

  return (
    <ErrorComponent>
      <ErrorComponent.Card>
        <ErrorComponent.CardHeader>
          <ErrorComponent.Icon>
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </ErrorComponent.Icon>
          <ErrorComponent.Title>Subdomain Not Found</ErrorComponent.Title>
          <ErrorComponent.Description>
            The subdomain you're looking for doesn't exist or is not configured
            properly.
          </ErrorComponent.Description>
        </ErrorComponent.CardHeader>
        <ErrorComponent.CardBody>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              onClick={handleGoToRoot}
              className="flex-1"
            >
              Go to Main Site
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="flex-1"
            >
              Go Back
            </Button>
          </div>
        </ErrorComponent.CardBody>
      </ErrorComponent.Card>
    </ErrorComponent>
  );
}

