import { getT } from "@/app/i18n/server";
import DashboardContent from "@/components/dashboard/dashboard-content";
import { getCachedCourseData } from "@/lib/course/get-course-data";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { truncate } from "@workspace/utils";
import { CourseNavSidebar } from "../_components/course-nav-sidebar";
import { Separator } from "@workspace/ui/components/separator";

export default async function ContentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const {t} = await getT(["common"])
  const { id } = await params;
  const courseData = await getCachedCourseData(id);

  const breadcrumbs = [
    { label: t("common:courses"), href: "/dashboard/lms/courses" },
    { label: truncate(courseData.title, 20), href: `/dashboard/lms/courses/${id}/` },
    { label: t("common:content"), href: `/dashboard/lms/courses/${id}/content` },
  ];
  return (
    <DashboardContent
      breadcrumbs={breadcrumbs} contentClassName="p-0 gap-0">
      <Separator />
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={70} minSize={30}>
          {children}
        </ResizablePanel>
 
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={0} maxSize={50}>
          <CourseNavSidebar editable={true} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </DashboardContent>
  );
}
