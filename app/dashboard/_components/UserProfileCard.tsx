import { formatPolishDate, formatUserDisplayName } from "@/lib/formatters";
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
  const displayName = formatUserDisplayName(
    { name, email },
    DASHBOARD_MESSAGES.defaultUserName,
  );

  return (
    <Card className="p-5 shadow-xs sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {DASHBOARD_MESSAGES.greetingPrefix} {displayName}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-2 text-sm text-muted-foreground sm:grid-cols-2">
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
