import { useState, useOptimistic } from "react";
import { useRouter } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, ChevronRight, Code, Settings, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EditablePrompt } from "./EditablePrompt";
import type { OrchestratorWithWorkers, ToolWithName } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrchestratorConfigurationProps {
	orchestrator: OrchestratorWithWorkers;
}

export function OrchestratorConfiguration({
	orchestrator,
}: OrchestratorConfigurationProps) {
	const router = useRouter();
	const [isUpdating, setIsUpdating] = useState(false);

	// Optimistic state for the orchestrator
	const [optimisticOrchestrator, addOptimisticOrchestratorUpdate] =
		useOptimistic(orchestrator, (currentOrchestrator, newPrompt: string) => ({
			...currentOrchestrator,
			system_prompt: newPrompt,
		}));

	// Track the selected worker with optimistic updates
	const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(
		orchestrator.workers.length > 0 ? orchestrator.workers[0].id : null,
	);

	// Get the selected worker from the optimistic orchestrator
	const selectedWorker = selectedWorkerId
		? optimisticOrchestrator.workers.find(
				(worker) => worker.id === selectedWorkerId,
			)
		: null;

	// Optimistic state for the workers
	const [optimisticWorkers, addOptimisticWorkerUpdate] = useOptimistic(
		optimisticOrchestrator.workers,
		(currentWorkers, update: { id: string; prompt: string }) => {
			return currentWorkers.map((worker) =>
				worker.id === update.id
					? { ...worker, system_prompt: update.prompt }
					: worker,
			);
		},
	);

	const refreshData = () => {
		// Invalidate the route data
		router.invalidate();
	};

	const handleOrchestratorPromptUpdate = async (newPrompt: string) => {
		setIsUpdating(true);

		// Optimistically update the UI
		addOptimisticOrchestratorUpdate(newPrompt);

		try {
			const { error } = await supabase
				.from("orchestrator_agents")
				.update({ system_prompt: newPrompt })
				.eq("id", orchestrator.id);

			if (error) {
				console.error("Error updating orchestrator prompt:", error);
			} else {
				refreshData();
			}
		} catch (err) {
			console.error("Error in updating orchestrator prompt:", err);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleWorkerPromptUpdate = async (
		workerId: string,
		newPrompt: string,
	) => {
		setIsUpdating(true);

		// Optimistically update the UI
		addOptimisticWorkerUpdate({ id: workerId, prompt: newPrompt });

		try {
			const { error } = await supabase
				.from("worker_agents")
				.update({ system_prompt: newPrompt })
				.eq("id", workerId);

			if (error) {
				console.error("Error updating worker prompt:", error);
			} else {
				refreshData();
			}
		} catch (err) {
			console.error("Error updating worker prompt:", err);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<div className="space-y-6 max-w-[1200px] w-[90%] mx-auto">
			<div className="mb-4">
				<h1 className="text-2xl font-semibold">
					Configuration: {optimisticOrchestrator.name}
				</h1>
				<p className="text-muted-foreground mt-2">
					{optimisticOrchestrator.description ||
						"Configure this orchestrator and its worker agents"}
				</p>
			</div>

			<Card className="overflow-hidden relative bg-card z-10">
				<CardHeader>
					<CardTitle className="text-xl flex items-center gap-2">
						<Settings className="h-5 w-5 text-primary" />
						Orchestrator Details
					</CardTitle>
					<CardDescription>
						Information about this orchestrator's configuration
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="text-lg font-semibold">System Prompt</h3>
						<EditablePrompt
							content={optimisticOrchestrator.system_prompt}
							onSave={handleOrchestratorPromptUpdate}
							height="350px"
							disabled={isUpdating}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden relative bg-card z-10 gap-0 p-0">
				<CardHeader className="border-b border-border p-6">
					<CardTitle className="text-xl flex items-center gap-2">
						<Users className="h-5 w-5 text-primary" />
						Worker Agents
					</CardTitle>
					<CardDescription>
						Configure specialized worker agents that handle specific types of
						queries
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 h-[570px]">
					{optimisticWorkers.length === 0 ? (
						<p className="text-center text-muted-foreground">
							No worker agents configured
						</p>
					) : (
						<div className="flex p-0 h-full">
							{/* Left Panel - Worker List */}
							<div className="w-1/3 border-r border-border overflow-y-auto h-full">
								{optimisticWorkers.map((worker) => (
									<button
										type="button"
										key={worker.id}
										className={`flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border last:border-b-0 w-full text-left ${selectedWorkerId === worker.id ? "bg-accent" : ""}`}
										onClick={() => setSelectedWorkerId(worker.id)}
										aria-pressed={selectedWorkerId === worker.id}
									>
										<div className="flex items-center gap-3">
											<Bot className="h-4 w-4 text-primary shrink-0" />
											<div>
												<div className="font-medium">{worker.name}</div>
												<div className="text-xs text-muted-foreground truncate max-w-[200px]">
													{worker.description}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge
												variant={worker.is_active ? "outline" : "secondary"}
												className="shrink-0"
											>
												{worker.is_active ? "Active" : "Inactive"}
											</Badge>
											<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
										</div>
									</button>
								))}
							</div>

							{/* Right Panel - Worker Details */}
							<div className="w-2/3 p-6 overflow-y-auto">
								{selectedWorker ? (
									<>
										<div className="mb-6">
											<h2 className="text-xl font-semibold flex items-center gap-2">
												<Bot className="h-4 w-4 text-primary" />
												{selectedWorker.name}
												{selectedWorker.is_active && (
													<Badge variant="outline" className="ml-1">
														Active
													</Badge>
												)}
											</h2>
											<p className="text-muted-foreground mt-1">
												{selectedWorker.description ||
													"This worker agent uses specialized tools to handle specific queries"}
											</p>
										</div>

										<Tabs defaultValue="system_prompt">
											<TabsList className="mb-6">
												<TabsTrigger value="system_prompt">
													System Prompt
												</TabsTrigger>
												<TabsTrigger value="available_tools">
													Available Tools
												</TabsTrigger>
												<TabsTrigger value="settings">Settings</TabsTrigger>
											</TabsList>

											<TabsContent value="system_prompt" className="mt-0">
												<EditablePrompt
													content={selectedWorker.system_prompt}
													onSave={(newPrompt) =>
														handleWorkerPromptUpdate(
															selectedWorker.id,
															newPrompt,
														)
													}
													height="300px"
													disabled={isUpdating}
												/>
											</TabsContent>

											<TabsContent value="available_tools" className="mt-0">
												<div className="bg-muted/50 p-6 rounded-lg">
													<h3 className="text-sm font-medium mb-4">Tools</h3>
													{selectedWorker.tools &&
													selectedWorker.tools.length > 0 ? (
														<div className="space-y-2">
															{selectedWorker.tools.map(
																(tool: ToolWithName, index) => (
																	<div
																		key={`tool-${index}-${String(tool.name ?? index)}`}
																		className="flex items-center gap-2 p-3 bg-background rounded-md"
																	>
																		<Code className="h-4 w-4 text-primary" />
																		<span className="text-sm">
																			{tool.name
																				? String(tool.name)
																				: `Tool ${index + 1}`}
																		</span>
																	</div>
																),
															)}
														</div>
													) : (
														<p className="text-muted-foreground text-sm">
															No tools available
														</p>
													)}
												</div>
											</TabsContent>

											<TabsContent value="settings" className="mt-0">
												<div className="bg-muted/50 p-6 rounded-lg">
													<p className="text-muted-foreground text-sm">
														Additional settings for this worker agent
													</p>
												</div>
											</TabsContent>
										</Tabs>
									</>
								) : (
									<div className="flex items-center justify-center h-full">
										<p className="text-muted-foreground">
											Select a worker agent to view details
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
