import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Upload, File, X } from "lucide-react";
import { Button } from "../ui/button";
import { useCallback } from "react";

interface FileUploadDropzoneProps {
	onFileSelect: (files: File[]) => void;
	value?: File[];
	className?: string;
}

export function FileUploadDropzone({
	onFileSelect,
	value = [],
	className,
}: FileUploadDropzoneProps) {
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			onFileSelect(acceptedFiles);
		},
		[onFileSelect],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/pdf": [".pdf"],
			"text/plain": [".txt"],
		},
		maxSize: 50 * 1024 * 1024, // 50MB
		multiple: true,
		onDragEnter: () => {},
		onDragOver: () => {},
		onDragLeave: () => {},
	});

	const removeFile = (fileToRemove: File) => {
		onFileSelect(value.filter((file) => file !== fileToRemove));
	};

	return (
		<div className={className}>
			<div
				{...getRootProps()}
				className={cn(
					"border-2 border-dashed rounded-lg p-8 transition-colors",
					isDragActive
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-primary/50",
					className,
				)}
			>
				<input
					{...getInputProps()}
					data-testid="file-input"
					type="file"
					accept="application/pdf,.pdf,text/plain,.txt"
				/>
				<div className="text-center">
					<Upload
						className={cn(
							"mx-auto h-12 w-12",
							isDragActive ? "text-primary" : "text-muted-foreground/50",
						)}
					/>
					<h3 className="mt-4 text-lg font-medium">
						{isDragActive ? "Drop files here" : "Drag & drop files here"}
					</h3>
					<p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
						Upload PDF or TXT files (max 50MB each)
					</p>
					<Button type="button" variant="secondary" className="mt-4">
						Browse files
					</Button>
				</div>
			</div>

			{value.length > 0 && (
				<div className="mt-4 space-y-2">
					{value.map((file) => (
						<div
							key={`${file.name}-${file.size}`}
							className="flex items-center justify-between p-2 bg-muted rounded-md"
						>
							<div className="flex items-center space-x-2">
								<File className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">{file.name}</span>
								<span className="text-xs text-muted-foreground">
									({(file.size / 1024 / 1024).toFixed(2)} MB)
								</span>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() => removeFile(file)}
							>
								<X className="h-4 w-4" />
								<span className="sr-only">Remove file</span>
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
