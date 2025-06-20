import { getDb } from "../../db/drizzle.ts";
import { workerAgents } from "../../db/schema/worker_agents.ts";
import { eq } from "drizzle-orm";
import type { WorkerAgent } from "../../db/schema/worker_agents.ts";

/**
 * Fetch a worker agent by its ID
 */
export async function getWorkerById(
	workerId: string,
): Promise<WorkerAgent | null> {
	try {
		const db = getDb();

		const [worker] = await db
			.select()
			.from(workerAgents)
			.where(eq(workerAgents.id, workerId));

		if (!worker) {
			return null;
		}

		return worker;
	} catch (error) {
		console.error("Error fetching worker agent:", error);
		throw error;
	}
}
