"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";

export type CourseInstructorInfo = {
  userId?: string | { toString(): string };
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: { url?: string };
};

interface CourseInstructorsStackProps {
  instructors?: CourseInstructorInfo[];
  maxVisible?: number;
  showNames?: boolean;
  className?: string;
  nameClassName?: string;
}

const getDisplayName = (instructor: CourseInstructorInfo) => {
  if (instructor.fullName) {
    return instructor.fullName;
  }
  const nameParts = [instructor.firstName, instructor.lastName].filter(Boolean);
  if (nameParts.length > 0) {
    return nameParts.join(" ");
  }
  return "";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.charAt(0).toUpperCase();
  if (parts.length === 1) {
    return first || "U";
  }
  const last = parts[parts.length - 1]?.charAt(0).toUpperCase();
  return `${first || ""}${last || ""}`.trim() || "U";
};

export function CourseInstructorsStack({
  instructors = [],
  maxVisible = 3,
  showNames = true,
  className,
  nameClassName,
}: CourseInstructorsStackProps) {
  if (!instructors.length) {
    return null;
  }

  const visible = instructors.slice(0, maxVisible);
  const remaining = instructors.length - visible.length;
  const names = instructors.map(getDisplayName).filter(Boolean);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex -space-x-2">
        {visible.map((inst, index) => {
          const name = getDisplayName(inst);
          const fallback = getInitials(name || "User");
          const key = String(inst.userId ?? name ?? index);

          return (
            <Avatar key={key} className="h-8 w-8 border-2 border-card">
              <AvatarImage src={inst.avatar?.url || ""} alt={name || "Instructor"} />
              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
            </Avatar>
          );
        })}
        {remaining > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
            +{remaining}
          </div>
        )}
      </div>
      {showNames && names.length > 0 && (
        <span className={cn("text-sm text-muted-foreground", nameClassName)}>
          {names.join(", ")}
        </span>
      )}
    </div>
  );
}

