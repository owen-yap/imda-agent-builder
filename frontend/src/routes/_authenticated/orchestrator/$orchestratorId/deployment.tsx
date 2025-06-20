import { createFileRoute } from "@tanstack/react-router";
import { OrchestratorDeployment } from "@/components/orchestrator/OrchestratorDeployment";

export const Route = createFileRoute(
	"/_authenticated/orchestrator/$orchestratorId/deployment",
)({
	component: OrchestratorDeployment,
});
