import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";

export type UserAvatarItem = {
  _id: string;
  email: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: {
    url?: string;
    file?: string;
  };
};

const getUserInitials = (user: UserAvatarItem) => {
  let initials = user.fullName?.[0]?.toUpperCase() || "";
  if (!initials) {
    if (user.firstName && user.lastName) {
      initials = `${user.firstName[0]}${user.lastName[0]}`;
    } else if (user.username) {
      initials = user.username[0]?.toUpperCase() || "U";
    } else {
      initials = user.email?.[0]?.toUpperCase() || "U";
    }
  }
  return initials;
};

interface UserAvatarLabelProps {
  user: UserAvatarItem;
  showEmail?: boolean;
  avatarClassName?: string;
}

export function UserAvatarLabel({ user, showEmail = false, avatarClassName = "h-6 w-6" }: UserAvatarLabelProps) {
  const displayName = user.fullName || user.username || user.email;
  const initials = getUserInitials(user);
  const avatarUrl = user.avatar?.file || user.avatar?.url;

  return (
    <div className="flex items-center gap-2">
      <Avatar className={avatarClassName}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{displayName}</span>
        {showEmail && user.email && displayName !== user.email && (
          <span className="text-xs text-muted-foreground">{user.email}</span>
        )}
      </div>
    </div>
  );
}

