"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { PublicationStatusEnum } from "@workspace/common-logic/lib/publication_status";
import { useToast } from "@workspace/components-library";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuizContext } from "./quiz-context";
import QuizQuestions from "./quiz-questions";
import QuizSettings from "./quiz-settings";
import QuizSubmissions from "./quiz-submissions";

export default function QuizContent() {
  const { mode, quiz, updateMutation } = useQuizContext();
  const { t } = useTranslation(["dashboard", "common"]);
  const { toast } = useToast();

  const breadcrumbs = useMemo(
    () => [
      {
        label: t("dashboard:lms.quizzes.module_title"),
        href: "/dashboard/lms/quizzes",
      },
      {
        label: mode === "create" ? t("dashboard:lms.quizzes.new_quiz") : t("dashboard:lms.quizzes.edit_quiz"),
        href: "#",
      },
    ],
    [mode, t],
  );

  const handleStatusChange = useCallback(
    async (newStatus: PublicationStatusEnum) => {
      if (!quiz?._id) return;

      await updateMutation.mutateAsync({
        id: quiz._id,
        data: { publicationStatus: newStatus },
      });
    },
    [quiz?._id, updateMutation],
  );

  const pulicationStatusLabel = useMemo(() => {
    const data = {
      [PublicationStatusEnum.DRAFT]: t("common:draft"),
      [PublicationStatusEnum.PUBLISHED]: t("common:published"),
      [PublicationStatusEnum.ARCHIVED]: t("common:archived"),
    }
    return data[quiz?.publicationStatus as PublicationStatusEnum] || t("common:draft");
  }, [quiz?.publicationStatus, t]);

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <HeaderTopbar
        backLink={true}
        header={{
          title: mode === "create" ? t("dashboard:lms.quizzes.new_quiz") : t("dashboard:lms.quizzes.edit_quiz"),
          subtitle:
            mode === "create"
              ? t("dashboard:lms.quizzes.create_subtitle")
              : t("dashboard:lms.quizzes.edit_subtitle"),
        }}
        rightAction={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={
                    !quiz || updateMutation.isPending || mode === "create"
                  }
                  className="flex items-center gap-2"
                >
                  {pulicationStatusLabel}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusChange(PublicationStatusEnum.DRAFT)
                  }
                  disabled={quiz?.publicationStatus === PublicationStatusEnum.DRAFT}
                >
                  {t("common:draft")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusChange(
                      PublicationStatusEnum.PUBLISHED,
                    )
                  }
                  disabled={quiz?.publicationStatus === PublicationStatusEnum.PUBLISHED}
                >
                  {t("common:published")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleStatusChange(PublicationStatusEnum.ARCHIVED)
                  }
                  disabled={quiz?.publicationStatus === PublicationStatusEnum.ARCHIVED}
                >
                  {t("common:archived")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">{t("dashboard:lms.quizzes.tabs.basic_info")}</TabsTrigger>
          <TabsTrigger value="questions" disabled={mode === "create"}>
            {t("dashboard:lms.quizzes.tabs.questions")}
          </TabsTrigger>
          <TabsTrigger value="submissions" disabled={mode === "create"}>
            {t("dashboard:lms.quizzes.tabs.submissions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <QuizSettings />
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {mode === "edit" ? (
            <QuizQuestions />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("dashboard:lms.quizzes.messages.save_first_questions")}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          {mode === "edit" ? (
            <QuizSubmissions />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("dashboard:lms.quizzes.messages.save_first_submissions")}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardContent>
  );
}

