import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { LargeInput } from "./shared.tsx";
import {
	type ButtonState,
	MultiStateButton,
} from "@/components/ui/multi-state-button";

// Define the form schema
const nameFormSchema = z.object({
	displayName: z.string().min(1, "Display name is required"),
});

type NameFormValues = z.infer<typeof nameFormSchema>;

interface NameFormProps {
	profile: {
		display_name: string | null;
	} | null;
	onSubmit: (
		displayName: string,
		setButtonState: (state: ButtonState) => void,
	) => Promise<void>;
}

export const NameForm = ({ profile, onSubmit }: NameFormProps) => {
	const [buttonState, setButtonState] = useState<ButtonState>("idle");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Initialize the form with react-hook-form
	const form = useForm<NameFormValues>({
		resolver: zodResolver(nameFormSchema),
		defaultValues: {
			displayName: profile?.display_name || "",
		},
	});

	const handleSubmit = async (values: NameFormValues) => {
		if (isSubmitting) return;

		setButtonState("processing");
		setIsSubmitting(true);

		try {
			// Get the display name value
			const displayName = values.displayName.trim();

			await onSubmit(displayName, setButtonState);
		} catch (error) {
			console.error("Failed to update profile:", error);
			setButtonState("error");
			setIsSubmitting(false);

			// Reset to idle after showing error
			setTimeout(() => {
				setButtonState("idle");
			}, 2000);
		}
	};

	return (
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle>Set your display name</CardTitle>
				<CardDescription>
					This is how others will see you in the workspace
				</CardDescription>
			</CardHeader>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="flex flex-col gap-6"
				>
					<CardContent className="flex items-center gap-4">
						<FormField
							control={form.control}
							name="displayName"
							render={({ field }) => (
								<FormItem className="flex-grow">
									<FormControl>
										<LargeInput placeholder="Enter your name..." {...field} />
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
							disabled={!form.formState.isValid || isSubmitting}
							className="w-46 shrink-0"
						/>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
};
