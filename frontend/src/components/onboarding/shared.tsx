import { cn } from "@/lib/utils";

// Custom large input component
export function LargeInput({
	className,
	...props
}: React.ComponentProps<"input">) {
	return (
		<input
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-14 w-full min-w-0 rounded-md border bg-transparent px-4 py-2 text-2xl shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				className,
			)}
			{...props}
		/>
	);
}
