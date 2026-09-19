import { formatPolishDate } from "@/lib/formatters";
import { User, Calendar, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

interface UserProfileCardProps {
  name: string | null;
  email: string;
  createdAt: Date;
}

export function UserProfileCard({
  name,
  email,
  createdAt,
}: UserProfileCardProps) {
  const displayName =
    name?.trim() || email.split("@")[0] || DASHBOARD_MESSAGES.defaultUserName;

  return (
    <Card className="p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {DASHBOARD_MESSAGES.greetingPrefix} {displayName}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-muted-foreground border-t border-border">
          <div className="flex items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {DASHBOARD_MESSAGES.emailLabel}{" "}
              <strong className="font-semibold text-foreground">{email}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <span>
              {DASHBOARD_MESSAGES.accountCreatedLabel}{" "}
              <strong className="font-semibold text-foreground">
                {formatPolishDate(createdAt)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
