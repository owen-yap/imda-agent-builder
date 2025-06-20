import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Loader2 } from "lucide-react"; // Using lucide-react icons

interface WelcomeScreenProps {
	onNext: () => void;
	isInvitedFlow: boolean;
	workspaceName?: string;
	isLoading?: boolean;
}

export const WelcomeScreen = ({
	onNext,
	isInvitedFlow,
	workspaceName,
	isLoading,
}: WelcomeScreenProps) => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full bg-background px-4 text-center animate-fadeIn">
			<div className="mb-10 space-y-5">
				<div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-scaleIn delay-200">
					{isInvitedFlow ? <Mail size={40} /> : <Sparkles size={40} />}
				</div>
				<h1 className="text-4xl md:text-5xl font-bold tracking-tight animate-slideInUp delay-300">
					{isInvitedFlow ? (
						<>
							You've been invited to join
							<br />
							<span className="text-primary">
								{workspaceName || "a workspace"}
							</span>
						</>
					) : (
						"Welcome to Mona"
					)}
				</h1>
				<p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto animate-slideInUp delay-400">
					{isInvitedFlow
						? "Let's get your account set up so you can start collaborating."
						: "The platform for building, deploying, and managing AI agents. Let's get you started!"}
				</p>
			</div>
			<Button
				size="lg"
				onClick={onNext}
				className="animate-slideInUp delay-500"
				disabled={isLoading}
			>
				{isLoading && isInvitedFlow ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : null}
				{isInvitedFlow
					? isLoading
						? "Accepting..."
						: "Accept Invitation & Continue"
					: "Get Started"}
			</Button>
		</div>
	);
};
