import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditablePromptProps {
	content: string;
	onSave: (newContent: string) => void;
	className?: string;
	height?: string;
	disabled?: boolean;
}

export function EditablePrompt({
	content,
	onSave,
	className,
	height = "300px",
	disabled = false,
}: EditablePromptProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState(content);
	const [showDialog, setShowDialog] = useState(false);
	const [editedValue, setEditedValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setValue(content);
	}, [content]);

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [isEditing]);

	const handleClick = () => {
		if (!disabled) {
			setIsEditing(true);
		}
	};

	const handleBlur = () => {
		if (value !== content) {
			setEditedValue(value);
			setShowDialog(true);
		} else {
			setIsEditing(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setValue(e.target.value);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Escape") {
			setValue(content);
			setIsEditing(false);
		} else if (e.key === "Enter" && e.ctrlKey) {
			handleBlur();
		}
	};

	const handleSave = () => {
		onSave(editedValue);
		setShowDialog(false);
		setIsEditing(false);
	};

	const handleRevert = () => {
		setValue(content);
		setShowDialog(false);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setShowDialog(false);
		setIsEditing(true);
		// Focus back on textarea after a short delay
		setTimeout(() => {
			textareaRef.current?.focus();
		}, 10);
	};

	return (
		<>
			<div
				className={cn(
					"mt-2 p-4 bg-muted rounded-md text-sm border-2 transition-colors",
					isEditing
						? "border-primary/30"
						: "border-transparent hover:border-primary/30 cursor-text",
					disabled && "opacity-70 cursor-not-allowed hover:border-transparent",
					className,
				)}
				onClick={!isEditing && !disabled ? handleClick : undefined}
				onKeyDown={!isEditing && !disabled ? handleClick : undefined}
				tabIndex={!isEditing && !disabled ? 0 : undefined}
			>
				{isEditing ? (
					<Textarea
						ref={textareaRef}
						value={value}
						onChange={handleChange}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						className="w-full border-none focus-visible:ring-0 p-0 resize-none overflow-y-auto"
						style={{ height }}
						placeholder="Enter system prompt..."
						disabled={disabled}
					/>
				) : (
					<div className="overflow-y-auto" style={{ height }}>
						<MarkdownRenderer content={content} />
					</div>
				)}
			</div>

			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Save Changes</DialogTitle>
						<DialogDescription>
							You've made changes to this prompt. What would you like to do?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex gap-2">
						<Button variant="outline" onClick={handleRevert}>
							Revert
						</Button>
						<Button variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={disabled}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
