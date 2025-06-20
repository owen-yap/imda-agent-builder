import { createFileRoute } from "@tanstack/react-router";
import { OrchestratorPlayground } from "@/components/orchestrator/OrchestratorPlayground";

export const Route = createFileRoute("/_authenticated/orchestrator/$orchestratorId/playground")({
	component: OrchestratorChatPage,
});

function OrchestratorChatPage() {
	const { orchestratorId } = Route.useParams();
	return <OrchestratorPlayground orchestratorId={orchestratorId} />;
}
