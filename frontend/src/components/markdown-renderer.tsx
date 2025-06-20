import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
	content: string;
	className?: string;
}

// Custom style to ensure markdown content inherits font styles from the app
const markdownStyle = {
	fontFamily: "inherit",
	fontSize: "inherit",
	lineHeight: "inherit",
};

/**
 * A component that renders markdown content using react-markdown
 */
export function MarkdownRenderer({
	content,
	className,
}: MarkdownRendererProps) {
	return (
		<div
			className={cn("text-sm leading-relaxed", className)}
			style={markdownStyle}
		>
			<ReactMarkdown
				components={{
					p: ({ node, className, children, ...props }) => (
						<p
							className={cn("my-2", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</p>
					),
					a: ({ node, className, children, ...props }) => (
						<a
							className={cn(
								"text-primary underline underline-offset-2",
								className,
							)}
							style={markdownStyle}
							target="_blank"
							rel="noopener noreferrer"
							{...props}
						>
							{children}
						</a>
					),
					code: ({ node, className, children, ...props }) => (
						<code
							className={cn(
								"bg-muted rounded px-1 py-0.5 font-mono text-sm",
								className,
							)}
							{...props}
						>
							{children}
						</code>
					),
					pre: ({ node, className, children, ...props }) => (
						<pre
							className={cn(
								"bg-muted p-4 rounded-lg overflow-x-auto my-2",
								className,
							)}
							{...props}
						>
							{children}
						</pre>
					),
					ul: ({ node, className, children, ...props }) => (
						<ul
							className={cn("list-disc pl-6 my-2", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</ul>
					),
					ol: ({ node, className, children, ...props }) => (
						<ol
							className={cn("list-decimal pl-6 my-2", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</ol>
					),
					li: ({ node, className, children, ...props }) => (
						<li
							className={cn("my-2", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</li>
					),
					h1: ({ node, className, children, ...props }) => (
						<h1
							className={cn("text-2xl font-bold my-4", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</h1>
					),
					h2: ({ node, className, children, ...props }) => (
						<h2
							className={cn("text-xl font-bold my-3", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</h2>
					),
					h3: ({ node, className, children, ...props }) => (
						<h3
							className={cn("text-lg font-bold my-2", className)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</h3>
					),
					blockquote: ({ node, className, children, ...props }) => (
						<blockquote
							className={cn(
								"border-l-4 border-muted-foreground/30 pl-4 italic my-2",
								className,
							)}
							style={markdownStyle}
							{...props}
						>
							{children}
						</blockquote>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
