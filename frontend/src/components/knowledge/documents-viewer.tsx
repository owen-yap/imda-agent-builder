import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiDeleteMutation } from "@/hooks/use-api";
import { Trash } from "lucide-react";
import { IconFileTypePdf } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { BorderTrail } from "../ui/border-trail";

interface Document {
	id: string;
	title: string;
	description: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	storagePath: string;
	isProcessed: boolean;
	createdAt: string;
}

interface DocumentsResponse {
	documents: Document[];
}

export function DocumentsViewer() {
	const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Query for fetching documents
	const {
		data: documentsResponse,
		isLoading,
		refetch,
	} = useApiQuery<DocumentsResponse>("/documents", ["documents"]);

	// Delete mutation with dynamic endpoint based on documentToDelete
	const deleteMutation = useApiDeleteMutation<void>(
		`/documents/${documentToDelete}`,
		{
			onSuccess: () => {
				refetch();
			},
			onError: (error) => {
				console.error("Error deleting document:", error);
			},
			onSettled: () => {
				setDocumentToDelete(null);
				setDeleteDialogOpen(false);
			},
		},
	);

	// Handle document deletion
	const handleDeleteConfirm = (id: string) => {
		setDocumentToDelete(id);
		// We need to delay the mutation to ensure the documentToDelete state is updated
		// and the deletion endpoint is correct
		setTimeout(() => {
			deleteMutation.mutate();
		}, 0);
	};

	const handleDeleteClick = (id: string) => {
		setDocumentToDelete(id);
		setDeleteDialogOpen(true);
	};

	// Handle dialog state changes
	const handleDialogChange = (open: boolean) => {
		setDeleteDialogOpen(open);
		// If closing the dialog, reset the document to delete
		if (!open) {
			setDocumentToDelete(null);
		}
	};

	const formatFileSize = (sizeInBytes: number) => {
		const kb = Math.round(sizeInBytes / 1024);
		return `${kb} KB`;
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Your Documents</CardTitle>
					<CardDescription>
						View and manage your uploaded documents.
					</CardDescription>
				</CardHeader>
				<CardContent className="min-h-[300px]">
					{isLoading ? (
						<div className="space-y-4">
							{["title", "description", "metadata"].map((type) => (
								<div
									key={`skeleton-${type}`}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										<Skeleton className="h-12 w-12" />
										<div className="space-y-2">
											<Skeleton className="h-4 w-[200px]" />
											<Skeleton className="h-4 w-[100px]" />
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Skeleton className="h-8 w-[80px]" />
										<Skeleton className="h-8 w-8" />
									</div>
								</div>
							))}
						</div>
					) : documentsResponse?.documents &&
						documentsResponse.documents.length > 0 ? (
						<div className="space-y-4">
							{documentsResponse?.documents?.map((doc) => (
								<div
									key={doc.id}
									className="relative flex items-center justify-between p-4 border rounded-lg"
								>
									{!doc.isProcessed && (
										<BorderTrail
											className="bg-linear-to-l from-blue-200 via-blue-500 to-blue-200 dark:from-blue-400 dark:via-blue-500 dark:to-blue-700"
											size={130}
										/>
									)}
									<div className="flex items-center gap-3">
										<div className="rounded-xl p-2 bg-red-100">
											<IconFileTypePdf size={28} className="text-red-500" />
										</div>
										<div>
											<h3 className="font-medium">{doc.fileName}</h3>
											<p className="text-sm text-muted-foreground">
												{formatFileSize(doc.fileSize)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Badge variant={doc.isProcessed ? "default" : "secondary"}>
											{doc.isProcessed ? "Trained" : "Training"}
										</Badge>
										<Button
											variant="ghost"
											size="icon"
											className="text-red-500"
											onClick={() => handleDeleteClick(doc.id)}
											disabled={documentToDelete === doc.id}
										>
											<Trash size={18} />
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center text-muted-foreground pt-20">
							No documents uploaded yet.
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={deleteDialogOpen} onOpenChange={handleDialogChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Are you sure you want to delete this document?
						</DialogTitle>
						<DialogDescription>
							This action cannot be undone. The document will be permanently
							deleted.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={deleteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() =>
								documentToDelete && handleDeleteConfirm(documentToDelete)
							}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
