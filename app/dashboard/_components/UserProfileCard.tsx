import { formatUserDisplayName } from "@/lib/formatters";
import { ResponsiveDateTime } from "@/components/ui/responsive-date-time";
import { User, Calendar, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { PropertyRow } from "@/components/ui/property-row";
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
          <Heading level={1}>
            {DASHBOARD_MESSAGES.greetingPrefix} {displayName}
          </Heading>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-2 text-sm text-muted-foreground sm:grid-cols-2">
          <PropertyRow
            icon={Mail}
            iconClassName="size-4"
            label={`${DASHBOARD_MESSAGES.emailLabel} `}
            value={
              <strong className="font-semibold text-foreground">{email}</strong>
            }
          />

          <PropertyRow
            icon={Calendar}
            iconClassName="size-4"
            label={`${DASHBOARD_MESSAGES.accountCreatedLabel} `}
            value={
              <strong className="font-semibold text-foreground">
                <ResponsiveDateTime date={createdAt} includeTime={false} />
              </strong>
            }
          />
        </div>
      </div>
    </Card>
  );
}
