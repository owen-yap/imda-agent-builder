import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBase } from "@/components/knowledge/KnowledgeBase";

export const Route = createFileRoute(
	"/_authenticated/_dashboardLayout/knowledge",
)({
	component: Knowledge,
});

function Knowledge() {
	return (
		<div className="space-y-6 max-w-[1200px] w-[90%] mx-auto py-12">
			<KnowledgeBase />
		</div>
	);
}
