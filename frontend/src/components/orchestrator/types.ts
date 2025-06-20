// Types for orchestrator and worker agents
export interface WorkerAgent {
	id: string;
	name: string;
	description: string | null;
	system_prompt: string;
	tools: Record<string, unknown>[] | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface OrchestratorWithWorkers {
	id: string;
	name: string;
	description: string | null;
	system_prompt: string;
	rules: Record<string, unknown>[] | null;
	workspace_id: string;
	created_at: string;
	updated_at: string;
	workers: WorkerAgent[];
}

// For tool object display
export interface ToolWithName extends Record<string, unknown> {
	name?: string;
}

export type TabType = "chat" | "details" | "workers";
