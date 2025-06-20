import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/profile-context";
import { Card, CardContent } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";

type CreateWorkspaceApiRequest = Record<string, unknown> & {
	name: string;
	userId: string;
};

interface CreateWorkspaceApiResponse {
	workspace: { id: string; name: string };
}

interface CreateWorkspaceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onWorkspaceCreated?: (workspace: { id: string; name: string }) => void;
}

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
	onWorkspaceCreated,
}: CreateWorkspaceDialogProps) {
	const [workspaceName, setWorkspaceName] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { profile } = useProfile(); // Get profile to access userId
	const queryClient = useQueryClient();

	const createWorkspaceMutation = useApiMutation<
		CreateWorkspaceApiResponse,
		CreateWorkspaceApiRequest
	>("/workspaces", {
		onSuccess: (data) => {
			if (data.workspace?.id) {
				if (onWorkspaceCreated) {
					onWorkspaceCreated(data.workspace);
				}
				queryClient.invalidateQueries({
					queryKey: ["workspaces", profile?.id],
				}); // Invalidate workspaces query
				setTimeout(() => {
					onOpenChange(false);
					setWorkspaceName("");
				}, 1000);
			} else {
				setErrorMessage(
					"Failed to create workspace. The name might be taken or an unknown error occurred.",
				);
			}
		},
		onError: (error) => {
			if (error instanceof Error) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage("An unexpected error occurred.");
			}
			console.error("Error creating workspace:", error);
		},
		onSettled: () => {
			setIsProcessing(false);
		},
	});

	const handleSubmit = async () => {
		if (!workspaceName.trim()) {
			setErrorMessage("Workspace name cannot be empty.");
			return;
		}
		setIsProcessing(true);
		setErrorMessage(null);

		// try {
		if (!profile?.id) {
			// throw new Error("User ID not found. Please ensure you are logged in.");
			setErrorMessage("User ID not found. Please ensure you are logged in.");
			setIsProcessing(false);
			return;
		}
		createWorkspaceMutation.mutate({
			name: workspaceName.trim(),
			userId: profile.id,
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				onOpenChange(isOpen);
				if (!isOpen) {
					setWorkspaceName("");
					setIsProcessing(false);
					setErrorMessage(null);
				}
			}}
		>
			<DialogContent size="full">
				<DialogHeader className="text-center sm:text-center mb-6 sm:mb-8">
					<DialogTitle className="text-2xl sm:text-3xl font-bold">
						Create a new workspace
					</DialogTitle>
					<DialogDescription className="text-sm sm:text-base mt-2">
						Workspaces are shared environments where teams can work on projects,
						cycles and issues.
					</DialogDescription>
				</DialogHeader>

				<Card className="w-full shadow-none border-0 sm:border sm:shadow-sm">
					<CardContent className="p-4 sm:p-6">
						<div className="space-y-3">
							<div>
								<label
									htmlFor="workspace-name"
									className="block text-sm font-medium text-foreground mb-1"
								>
									Workspace Name
								</label>
								<Input
									id="workspace-name"
									value={workspaceName}
									onChange={(e) => setWorkspaceName(e.target.value)}
									placeholder="E.g. Acme Corporation"
									className="w-full"
									disabled={isProcessing}
								/>
							</div>
							{errorMessage && (
								<p className="text-sm text-red-500 pt-1">{errorMessage}</p>
							)}
						</div>
					</CardContent>
				</Card>

				<DialogFooter className="mt-6 sm:mt-8 flex w-full justify-center sm:justify-center">
					<Button
						onClick={handleSubmit}
						disabled={isProcessing || !workspaceName.trim()}
						className="w-full max-w-xs"
					>
						{isProcessing ? "Creating..." : "Create Workspace"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
