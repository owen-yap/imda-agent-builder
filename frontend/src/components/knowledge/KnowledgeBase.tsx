import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FileUploadDropzone } from "@/components/knowledge/file-upload-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useApiFormDataMutation } from "@/hooks/use-api";
import { useState, useEffect } from "react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { DocumentsViewer } from "@/components/knowledge/documents-viewer";

const uploadFormSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string(),
	files: z
		.array(z.custom<File>())
		.min(1, "A file is required")
		.max(1, "Only one file can be uploaded"),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

interface FileDescription {
	fileName: string;
	fileType: string;
	fileSize: number;
	description: string;
	extractedTextLength: number;
}

export function KnowledgeBase() {
	const queryClient = useQueryClient();
	const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

	const form = useForm<UploadFormValues>({
		resolver: zodResolver(uploadFormSchema),
		defaultValues: {
			title: "",
			description: "",
			files: [],
		},
	});

	// Auto-fill title with filename when a file is selected
	const files = form.watch("files");

	// Mutation for uploading documents using our custom hook
	const uploadMutation = useApiFormDataMutation<Document>("/documents", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			form.reset();
		},
	});

	// Mutation for generating descriptions
	const descriptionMutation = useApiFormDataMutation<FileDescription>(
		"/files/extract-description",
		{
			onSuccess: (data) => {
				form.setValue("description", data.description);
			},
			onError: (error) => {
				console.error("Error generating description:", error);
			},
			onSettled: () => {
				setIsGeneratingDescription(false);
			},
		},
	);

	// Auto-generate description when a file is first uploaded
	useEffect(() => {
		if (files.length > 0) {
			generateDescription();
		}
	}, [files.length]); // Only trigger when file count changes

	// Function to generate description from file
	const generateDescription = async () => {
		const files = form.getValues("files");
		if (!files.length) return;

		setIsGeneratingDescription(true);

		// Set title to filename initially
		form.setValue("title", files[0].name.split(".")[0]);

		// Create form data for the API call
		const formData = new FormData();
		formData.append("file", files[0]);

		// Use mutation to call the API
		descriptionMutation.mutate(formData);
	};

	const onSubmit = (values: UploadFormValues) => {
		const formData = new FormData();
		formData.append("title", values.title);
		formData.append("description", values.description);

		for (const file of values.files) {
			formData.append("file", file);
		}

		uploadMutation.mutate(formData);
	};

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
					<p className="text-muted-foreground mt-2">
						Manage your knowledge documents for the chatbot.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Upload Documents</CardTitle>
					<CardDescription>
						Add documents to your knowledge base by uploading files.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Only show title and description fields after file upload */}
							{files.length > 0 && (
								<>
									<FormField
										control={form.control}
										name="title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Title</FormLabel>
												<FormControl>
													<Input
														placeholder="Enter document title"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center justify-between">
													Description
												</FormLabel>
												<FormControl>
													<div className="relative">
														<div className="relative rounded-md">
															{isGeneratingDescription ? (
																<TextShimmer
																	className="min-h-24 border-input placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none cursor-not-allowed md:text-sm"
																	duration={1}
																>
																	Generating description...
																</TextShimmer>
															) : (
																<Textarea
																	placeholder="Generating description..."
																	{...field}
																	className={"min-h-24"}
																	disabled={isGeneratingDescription}
																/>
															)}
														</div>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}

							<FormField
								control={form.control}
								name="files"
								render={({ field }) => (
									<FormItem>
										<FormLabel>File</FormLabel>
										<FormControl>
											{field.value.length === 0 ? (
												<FileUploadDropzone
													onFileSelect={(files) =>
														field.onChange(files.slice(0, 1))
													}
													value={field.value}
												/>
											) : (
												<div className="flex items-center justify-between border rounded-lg p-4">
													<div>
														<p className="font-medium">{field.value[0].name}</p>
														<p className="text-sm text-muted-foreground">
															{(field.value[0].size / 1024).toFixed(2)} KB
														</p>
													</div>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => {
															field.onChange([]);
															form.setValue("title", "");
															form.setValue("description", "");
														}}
													>
														Remove
													</Button>
												</div>
											)}
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{files.length > 0 && (
								<Button
									type="submit"
									className="w-full"
									disabled={uploadMutation.isPending || isGeneratingDescription}
								>
									{uploadMutation.isPending
										? "Uploading..."
										: "Upload Document"}
								</Button>
							)}
						</form>
					</Form>
				</CardContent>
			</Card>

			<DocumentsViewer />
		</>
	);
}
