import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { X, Send, UserPlus } from "lucide-react";
import { useApiMutation } from "@/hooks/use-api";
import { useProfile } from "@/lib/profile-context";
import { TextEffect } from "@/components/ui/text-effect";

interface InviteTeammatesScreenProps {
	onNext: () => void;
}

export const InviteTeammatesScreen = ({
	onNext,
}: InviteTeammatesScreenProps) => {
	const [email, setEmail] = useState("");
	const [pendingInvitations, setPendingInvitations] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { profile } = useProfile();

	const inviteUserMutation = useApiMutation<
		unknown,
		{ workspaceId: string; email: string; role: string }
	>(
		profile?.workspace_id
			? `/workspaces/${profile.workspace_id}/invitations`
			: "",
	);

	const handleAddInvitation = () => {
		if (
			email.trim() &&
			!pendingInvitations.includes(email.trim()) &&
			/\S+@\S+\.\S+/.test(email.trim())
		) {
			setPendingInvitations([...pendingInvitations, email.trim()]);
			setEmail("");
		}
	};

	const handleRemoveInvitation = (emailToRemove: string) => {
		setPendingInvitations(
			pendingInvitations.filter((e) => e !== emailToRemove),
		);
	};

	const handleSendInvitations = async () => {
		if (!profile?.workspace_id || pendingInvitations.length === 0) return;
		setIsSubmitting(true);
		try {
			await Promise.all(
				pendingInvitations.map((inviteEmail) => {
					if (!profile.workspace_id) {
						// This should ideally be caught by the guard above, but good for safety
						console.error("Workspace ID is missing when sending invitations.");
						throw new Error("Workspace ID is missing");
					}
					return inviteUserMutation.mutateAsync({
						workspaceId: profile.workspace_id,
						email: inviteEmail,
						role: "member",
					});
				}),
			);
			setPendingInvitations([]);
			onNext();
		} catch (error) {
			console.error("Failed to send invitations:", error);
			// Consider adding user-facing error feedback here
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] w-full bg-background px-4 animate-fadeIn">
			<div className="text-center mb-12 space-y-3 w-full">
				<TextEffect className="text-4xl md:text-5xl font-bold">
					Invite Your Team
				</TextEffect>
				<p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto">
					Mona works best with teams. Invite your colleagues to collaborate.
				</p>
			</div>
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserPlus size={22} /> Invite with email
					</CardTitle>
					<CardDescription>
						Send email invitations to your teammates to join your workspace.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex gap-3 items-center">
						<Input
							type="email"
							placeholder="colleague@company.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleAddInvitation()}
							className="flex-grow h-11 text-base"
							disabled={isSubmitting}
						/>
						<Button
							onClick={handleAddInvitation}
							variant="outline"
							className="shrink-0 h-11"
							disabled={isSubmitting}
						>
							Add
						</Button>
					</div>
					{pendingInvitations.length > 0 && (
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">
								Pending invitations:
							</h3>
							<ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
								{pendingInvitations.map((inviteEmail) => (
									<li
										key={inviteEmail}
										className="flex justify-between items-center p-2.5 border rounded-md bg-secondary/30 text-sm"
									>
										<span>{inviteEmail}</span>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleRemoveInvitation(inviteEmail)}
											disabled={isSubmitting}
											className="hover:bg-destructive/20 h-7 w-7"
										>
											<X className="h-4 w-4" />
										</Button>
									</li>
								))}
							</ul>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
					<Button variant="ghost" onClick={onNext} disabled={isSubmitting}>
						Skip for now
					</Button>
					<Button
						onClick={handleSendInvitations}
						disabled={
							pendingInvitations.length === 0 ||
							isSubmitting ||
							!profile?.workspace_id
						}
						className="w-full sm:w-auto"
					>
						<Send size={16} className="mr-2" />
						{isSubmitting
							? "Sending..."
							: `Send ${pendingInvitations.length} Invitation${pendingInvitations.length > 1 ? "s" : ""}`}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};
