"use client";

import { useProfile } from "@/components/contexts/profile-context";
import { useSiteInfo } from "@/components/contexts/site-info-context";
import { NavMain } from "@/components/dashboard/dashboard-skeleton/nav-main";
import { NavProjects } from "@/components/dashboard/dashboard-skeleton/nav-projects";
import { NavUser } from "@/components/dashboard/dashboard-skeleton/nav-user";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { checkPermission } from "@workspace/utils";
import {
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  Database,
  FileText,
  Globe,
  GraduationCap,
  Key,
  LayoutDashboard,
  LibraryBig,
  type LucideIcon,
  Palette,
  Settings,
  Star,
  Tag,
  Target,
  Users,
  Video
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { NavSecondary } from "./nav-secondary";


export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation(["dashboard", "common"]); 
  const { siteInfo } = useSiteInfo();
  const { profile } = useProfile();
  const path = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");

  const { navMainItems, navProjectItems, navSecondaryItems } = getSidebarItems(
    profile,
    path || "",
    tab,
    t,
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src={siteInfo?.logo?.url || "/img/logo.svg"}
                    alt={siteInfo?.logo?.caption || siteInfo?.title || "Logo"}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {siteInfo.title}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={navProjectItems} />
        {navMainItems.length > 0 && <NavMain items={navMainItems} />}
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  beta?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
}

interface NavProjectItem {
  name: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
}

interface NavSecondaryItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
}

function getSidebarItems(
  profile: ReturnType<typeof useProfile>["profile"],
  path: string,
  tab: string | null,
  t: (key: string) => string,
) {
  const navMainItems: NavMainItem[] = [];
  const navProjectItems: NavProjectItem[] = [];
  const navSecondaryItems: NavSecondaryItem[] = [];

  if (!profile) {
    return { navMainItems, navProjectItems, navSecondaryItems };
  }

  const isInstructor = profile.roles?.includes("instructor");

  const isAdmin = profile.roles?.includes("admin");

  // Instructor/Teacher Section
  if (isInstructor) {
    navMainItems.push({
      title: t("dashboard:sidebar.instructor_dashboard"),
      url: "/dashboard/instructor",
      icon: LayoutDashboard,
      isActive: path === "/dashboard/instructor",
    });

    navMainItems.push({
      title: t("dashboard:sidebar.lms"), 
      url: "/dashboard/lms",
      icon: LibraryBig,
      isActive: path.startsWith("/dashboard/lms"),
      items: [
        {
          title: t("common:courses"),
          url: "/dashboard/lms/courses",
          icon: BookOpen,
          isActive: path.startsWith("/dashboard/lms/courses"),
        },
        {
          title: t("dashboard:lms.cohort.module_title"), 
          url: "/dashboard/lms/cohorts",
          icon: Users,
          isActive: path === "/dashboard/lms/cohorts",
        },
        {
          title: t("dashboard:lms.quizzes.module_title"),
          url: "/dashboard/lms/quizzes",
          icon: FileText,
          isActive: path.startsWith("/dashboard/lms/quizzes"),
        },
        {
          title: t("dashboard:lms.assignment.module_title"),
          url: "/dashboard/lms/assignments",
          icon: ClipboardList,
          isActive: path.startsWith("/dashboard/lms/assignments"),
        },
        {
          title: t("dashboard:lms.live_classes.module_title"),
          url: "/dashboard/lms/live-classes",
          icon: Video,
          isActive: path === "/dashboard/lms/live-classes",
        },
        // {
        //   title: t("dashboard:lms.schedule.module_title"), 
        //   url: "/dashboard/lms/schedule",
        //   icon: Calendar,
        //   isActive: path === "/dashboard/lms/schedule",
        // },
        {
          title: t("dashboard:lms.reviews.module_title"),
          url: "/dashboard/lms/reviews",
          icon: Star,
          isActive: path === "/dashboard/lms/reviews",
        },
        {
          title: t("dashboard:lms.theme.module_title"),
          url: "/dashboard/lms/themes",
          icon: Palette,
          isActive: path.startsWith("/dashboard/lms/themes"),
        },
      ],
    });
  }

  // Admin Section
  if (isAdmin) {
    navMainItems.push({
      title: t("dashboard:sidebar.admin"), 
      url: "/dashboard/admin",
      icon: Settings,
      isActive: path.startsWith("/dashboard/admin"),
      items: [
        {
          title: t("dashboard:sidebar.users"),
          url: "/dashboard/admin/users",
          icon: Users,
          isActive: path.startsWith("/dashboard/admin/users"),
        },
        {
          title: t("dashboard:sidebar.organizations"),
          url: "/dashboard/admin/organizations",
          icon: Building2,
          isActive: path.startsWith("/dashboard/admin/organizations"),
        },
        {
          title: t("dashboard:sidebar.tags"),
          url: "/dashboard/admin/tags",
          icon: Tag,
          isActive: path.startsWith("/dashboard/admin/tags"),
        },
        {
          title: t("common:settings"), 
          url: "/dashboard/admin/settings",
          icon: Settings,
          isActive: path.startsWith("/dashboard/admin/settings") && !path.includes("/website-settings") && !path.includes("/external-api-keys"),
        },
        {
          title: t("dashboard:sidebar.website_settings"),
          url: "/dashboard/admin/settings/website-settings",
          icon: Globe,
          isActive: path.startsWith("/dashboard/admin/settings/website-settings"),
        },
        {
          title: t("dashboard:sidebar.external_api_keys"),
          url: "/dashboard/admin/settings/external-api-keys",
          icon: Key,
          isActive: path.includes("/external-api-keys"),
        },
        {
          title: t("dashboard:sidebar.studio"),
          url: "/dashboard/admin/studio",
          icon: Database,
          isActive: path.startsWith("/dashboard/admin/studio"),
        }
      ],
    });
  }

  // Student Section
  navProjectItems.push({
    name: t("dashboard:sidebar.student_dashboard"),
    url: "/dashboard/student",
    icon: GraduationCap,
    isActive: path === "/dashboard/student",
  });

  navProjectItems.push({
    name: t("dashboard:my_courses"),
    url: "/dashboard/student/courses",
    icon: BookOpen,
    isActive: path.startsWith("/dashboard/student/courses"),
  });

  // TODO: FIX this page
  // navProjectItems.push({
  //   name: t("dashboard:sidebar.my_assignments"),
  //   url: "/dashboard/student/assignments",
  //   icon: ClipboardList,
  //   isActive: path.startsWith("/dashboard/student/assignments"),
  // });

  // TODO: FIX this page
  // navProjectItems.push({
  //   name: t("dashboard:sidebar.my_schedule"),
  //   url: "/dashboard/student/schedule",
  //   icon: Calendar,
  //   isActive: path === "/dashboard/student/schedule",
  // });

  navProjectItems.push({
    name: t("dashboard:sidebar.my_grades"),
    url: "/dashboard/student/grades",
    icon: Target,
    isActive: path === "/dashboard/student/grades",
  });

  // Secondary Items
  navSecondaryItems.push({
    title: t("dashboard:sidebar.notifications"),
    url: "/dashboard/notifications",
    icon: Star,
    isActive: path === "/dashboard/notifications",
  });

  navSecondaryItems.push({
    title: t("dashboard:sidebar.profile"),
    url: "/dashboard/profile",
    icon: Users,
    isActive: path === "/dashboard/profile",
  });

  return {
    navMainItems,
    navProjectItems,
    navSecondaryItems,
  };
}
