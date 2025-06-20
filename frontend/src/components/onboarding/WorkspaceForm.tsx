import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { LargeInput } from "./shared";
import {
	type ButtonState,
	MultiStateButton,
} from "@/components/ui/multi-state-button";

// Define the form schema
const workspaceFormSchema = z.object({
	workspaceName: z.string().min(1, "Workspace name is required"),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

interface WorkspaceFormProps {
	onSubmit: (
		workspaceName: string,
		setButtonState: (state: ButtonState) => void,
	) => Promise<void>;
}

export const WorkspaceForm = ({ onSubmit }: WorkspaceFormProps) => {
	const [buttonState, setButtonState] = useState<ButtonState>("idle");

	// Initialize the form with react-hook-form
	const form = useForm<WorkspaceFormValues>({
		resolver: zodResolver(workspaceFormSchema),
		defaultValues: {
			workspaceName: "",
		},
	});

	const handleSubmit = async (values: WorkspaceFormValues) => {
		if (buttonState !== "idle" && buttonState !== "error") return; // Allow retry on error

		setButtonState("processing");

		try {
			await onSubmit(values.workspaceName.trim(), setButtonState);
		} catch (error) {
			console.error("Failed to create workspace:", error);
			setButtonState("error");

			setTimeout(() => {
				// Keep error state until user interacts again or successful submit
				// setButtonState("idle"); // Or reset to idle after a delay
			}, 2000);
		}
	};

	return (
		<Card className="w-full max-w-lg">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="flex flex-col gap-4"
				>
					<CardContent className="flex items-center gap-4 pt-6">
						<FormField
							control={form.control}
							name="workspaceName"
							render={({ field }) => (
								<FormItem className="flex-grow">
									<FormControl>
										<LargeInput
											placeholder="Enter workspace name..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="justify-end">
						<MultiStateButton
							state={buttonState}
							onClick={form.handleSubmit(handleSubmit)}
							disabled={
								!form.formState.isValid ||
								buttonState === "processing" ||
								buttonState === "success"
							}
							className="w-46 shrink-0"
						/>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
};
