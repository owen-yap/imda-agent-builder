import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/user-settings/notifications";

export const Route = createFileRoute(
	"/_authenticated/_dashboardLayout/notifications",
)({ component: NotificationsPage });
