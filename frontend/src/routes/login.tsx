import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
	component: LoginForm,
});

export function LoginForm() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);

	const { signInWithMagicLink } = useAuth();

	const handleMagicLink = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const { error } = await signInWithMagicLink(email);
			if (error) {
				setError(error.message);
				return;
			}
			setIsMagicLinkSent(true);
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<div className="w-full max-w-4xl">
				<Card className="overflow-hidden p-0 h-[600px] sm:h-[650px] md:h-[700px]">
					<CardContent className="grid p-0 md:grid-cols-2 h-full">
						<form className="p-6 md:p-8 lg:p-12 flex flex-col justify-center" onSubmit={handleMagicLink}>
							{isMagicLinkSent ? (
								<div className="flex flex-col">
									<div className="flex flex-col items-center text-center gap-2">
										<h1 className="text-2xl font-bold">Check your email</h1>
										<p className="text-balance text-muted-foreground">
											We've sent a magic link to {email}. Click the link to sign in.
										</p>
									</div>

									{/* Placeholder for Input Section */}
									<div className="grid gap-2" aria-hidden="true">
										<Label
											htmlFor="placeholder-email-label"
											className="opacity-0 select-none pointer-events-none"
										>
											&nbsp;
										</Label>
										<Input
											id="placeholder-email-input"
											className="opacity-0 select-none pointer-events-none"
											tabIndex={-1}
											readOnly
											aria-hidden="true"
										/>
									</div>

									<Button
										variant="outline"
										className="w-full"
										onClick={() => setIsMagicLinkSent(false)}
									>
										Back to login
									</Button>

									{/* Placeholder for Footer Text Section */}
									<div className="text-center text-sm" aria-hidden="true">
										&nbsp;
									</div>
								</div>
							) : (
								<div className="flex flex-col gap-6">
									<div className="flex flex-col items-center text-center">
										<img
											src="/mona-logo.png"
											alt="Mona logo"
											className="mb-4 w-16 h-16 rounded-[12px]"
										/>
										<h1 className="text-2xl font-bold">Welcome back</h1>
										<p className="text-balance text-muted-foreground">
											Sign in or sign up to your account
										</p>
									</div>

									{error && (
										<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
											{error}
										</div>
									)}

									<div className="grid gap-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="youremail@example.com"
											required
										/>
									</div>

									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? "Sending..." : "Continue with Email"}
									</Button>
									
									<div className="text-center text-sm">
										Don&apos;t have an account?{" "}
										<span className="text-muted-foreground">
											We'll create one for you
										</span>
									</div>
								</div>
							)}
						</form>
						<div className="relative hidden bg-muted md:block">
							<img
								src="/signin.png"
								alt="Sign in illustration"
								className="absolute inset-0 h-full w-full object-cover"
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
