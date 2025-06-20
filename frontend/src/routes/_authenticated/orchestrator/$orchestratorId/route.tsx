import {
	createFileRoute,
	Outlet,
	useRouteContext,
} from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import type { OrchestratorWithWorkers } from "@/components/orchestrator/types";
import { DottedBackground } from "@/components/ui/dotted-background";

export const Route = createFileRoute(
	"/_authenticated/orchestrator/$orchestratorId",
)({
	component: OrchestratorLayout,
	beforeLoad: async ({ params }) => {
		const { data: orchestratorData, error: orchestratorError } = await supabase
			.from("orchestrator_agents")
			.select("*")
			.eq("id", params.orchestratorId)
			.single();

		if (orchestratorError) throw orchestratorError;

		// Fetch workers
		const { data: workers, error: workersError } = await supabase
			.from("worker_agents")
			.select("*")
			.eq("orchestrator_id", params.orchestratorId);

		if (workersError) throw workersError;

		const orchestratorWithWorkers = {
			...orchestratorData,
			workers: workers || [],
		} as OrchestratorWithWorkers;
		return {
			orchestratorWithWorkers,
		};
	},
});

function OrchestratorLayout() {
	// Get the orchestrator from the route context
	const { orchestratorWithWorkers } = useRouteContext({
		from: "/_authenticated/orchestrator/$orchestratorId",
	});

	if (!orchestratorWithWorkers) {
		return <div>Orchestrator not found</div>;
	}

	return (
		<div className="min-h-screen w-full">
			<DottedBackground />
			<div className="relative flex-1 py-14 h-full w-full overflow-y-auto">
				<Outlet />
			</div>
		</div>
	);
}
