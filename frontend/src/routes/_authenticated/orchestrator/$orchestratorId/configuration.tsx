import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { OrchestratorConfiguration } from "@/components/orchestrator/OrchestratorConfiguration";

export const Route = createFileRoute(
	"/_authenticated/orchestrator/$orchestratorId/configuration",
)({
	component: OrchestratorDetailsRoute,
});

function OrchestratorDetailsRoute() {
	const { orchestratorWithWorkers } = useRouteContext({
		from: "/_authenticated/orchestrator/$orchestratorId",
	});

	if (!orchestratorWithWorkers) {
		return (
			<div className="flex justify-center items-center h-[70vh]">
				<p className="text-muted-foreground">Orchestrator not found.</p>
			</div>
		);
	}

	return <OrchestratorConfiguration orchestrator={orchestratorWithWorkers} />;
}
