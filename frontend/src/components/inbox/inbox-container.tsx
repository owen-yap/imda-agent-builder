import { useState } from "react";
import { InboxSessionList } from "./inbox-session-list";
import { InboxActionList } from "./inbox-action-list";
import { Card } from "@/components/ui/card";
import { InboxDetailsPane } from "./inbox-details-pane";

export function InboxContainer() {
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);

	return (
		<Card className="h-full shadow-none border-0 pt-0">
			<div className="grid grid-cols-1 md:grid-cols-12 h-full">
				<div className="md:col-span-3 border-r h-full overflow-hidden">
					<InboxSessionList
						onSessionSelect={setSelectedSessionId}
						selectedSessionId={selectedSessionId}
					/>
				</div>
				<div className="md:col-span-6 border-r h-full overflow-hidden">
					<InboxActionList sessionId={selectedSessionId} />
				</div>
				<div className="md:col-span-3 h-full overflow-hidden">
					<InboxDetailsPane sessionId={selectedSessionId} />
				</div>
			</div>
		</Card>
	);
}
