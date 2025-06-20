import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// TODO: Define a proper type for invitation, potentially generated from backend schema
interface Invitation {
	id: string;
	workspace: {
		name: string;
		// logoUrl?: string; // Optional: if workspaces have logos
	};
	inviter: {
		fullName: string;
		avatarUrl?: string; // Optional
	};
	role: string; // e.g., 'admin', 'member'
	status: "pending" | "accepted" | "revoked" | "rejected" | "expired" | null; // Match backend enum
	createdAt: Date; // Changed to Date
	expiresAt: Date; // Changed to Date
}

interface InvitationCardProps {
	invitation: Invitation;
	onAccept: (invitationId: string) => void;
	onReject: (invitationId: string) => void;
	isAccepting?: boolean; // Added this from previous step, ensure it's here
	isRejecting?: boolean; // Added this from previous step, ensure it's here
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}

function timeAgo(dateString: string): string {
	const date = new Date(dateString);
	const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

	let interval = seconds / 31536000;
	if (interval > 1) return `${Math.floor(interval)} years ago`;
	interval = seconds / 2592000;
	if (interval > 1) return `${Math.floor(interval)} months ago`;
	interval = seconds / 86400;
	if (interval > 1) return `${Math.floor(interval)} days ago`;
	interval = seconds / 3600;
	if (interval > 1) return `${Math.floor(interval)} hours ago`;
	interval = seconds / 60;
	if (interval > 1) return `${Math.floor(interval)} minutes ago`;
	return `${Math.floor(seconds)} seconds ago`;
}

export function InvitationCard({
	invitation,
	onAccept,
	onReject,
}: InvitationCardProps) {
	const isPending = invitation.status === "pending";
	const isExpired = new Date(invitation.expiresAt) < new Date();

	return (
		<Card className="mb-4">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">
						Invitation to {invitation.workspace.name}
					</CardTitle>
					{isPending && !isExpired && <Badge variant="default">Pending</Badge>}
					{invitation.status === "accepted" && (
						<Badge variant="success">Accepted</Badge>
					)}
					{invitation.status === "rejected" && (
						<Badge variant="destructive">Rejected</Badge>
					)}
					{invitation.status === "revoked" && (
						<Badge variant="outline">Revoked</Badge>
					)}
					{isPending && isExpired && <Badge variant="warning">Expired</Badge>}
				</div>
				<CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
					<Mail className="mr-1.5 size-4" /> Invited by{" "}
					{invitation.inviter.fullName}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center space-x-3">
					<Avatar className="size-10">
						<AvatarImage
							src={invitation.inviter.avatarUrl}
							alt={invitation.inviter.fullName}
						/>
						<AvatarFallback>
							{getInitials(invitation.inviter.fullName)}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="text-sm font-medium">
							You've been invited to join the "{invitation.workspace.name}"
							workspace as a {invitation.role}.
						</p>
						<p className="text-xs text-muted-foreground flex items-center mt-1">
							<Clock className="mr-1 size-3" /> Sent{" "}
							{timeAgo(invitation.createdAt.toISOString())}
							{isPending &&
								!isExpired &&
								`, expires in ${Math.ceil((new Date(invitation.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
						</p>
					</div>
				</div>
			</CardContent>
			{isPending && !isExpired && (
				<CardFooter className="flex justify-end space-x-2">
					<Button variant="outline" onClick={() => onReject(invitation.id)}>
						<XCircle className="mr-2" />
						Reject
					</Button>
					<Button onClick={() => onAccept(invitation.id)}>
						<CheckCircle className="mr-2" />
						Accept
					</Button>
				</CardFooter>
			)}
			{(invitation.status !== "pending" || isExpired) && (
				<CardFooter>
					<p className="text-sm text-muted-foreground flex items-center">
						{invitation.status === "accepted" && (
							<>
								<CheckCircle className="mr-1.5 text-green-600" /> You accepted
								this invitation.
							</>
						)}
						{invitation.status === "rejected" && (
							<>
								<XCircle className="mr-1.5 text-red-600" /> You rejected this
								invitation.
							</>
						)}
						{invitation.status === "revoked" && (
							<>
								<AlertCircle className="mr-1.5 text-yellow-600" /> This
								invitation was revoked by the sender.
							</>
						)}
						{invitation.status === "pending" && isExpired && (
							<>
								<AlertCircle className="mr-1.5 text-yellow-600" /> This
								invitation has expired.
							</>
						)}
						{invitation.status === null &&
							"This invitation has an unknown status."}
					</p>
				</CardFooter>
			)}
		</Card>
	);
}
