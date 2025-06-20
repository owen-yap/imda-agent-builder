import { useState } from "react";
import {
	useWorkspaceMembers,
	useWorkspaceInvitations,
} from "@/hooks/use-workspace-members";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
	Clock,
	MoreVertical,
	RefreshCw,
	Send,
	Trash2,
	UserPlus,
	X,
	CheckCircle,
	XCircle,
} from "lucide-react";

// Schema for invite form validation
const inviteFormSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	role: z.enum(["admin", "member"], {
		required_error: "Please select a role",
	}),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function UserManagement() {
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("members");
	const {
		members,
		loading: membersLoading,
		currentUserId,
	} = useWorkspaceMembers();
	const {
		invitations,
		loading: invitationsLoading,
		inviteUser,
		inviteUserLoading,
		revokeInvitation,
		revokeInvitationLoading,
		resendInvitation,
		resendInvitationLoading,
	} = useWorkspaceInvitations();

	const form = useForm<InviteFormValues>({
		resolver: zodResolver(inviteFormSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	});

	const onSubmit = async (values: InviteFormValues) => {
		try {
			await inviteUser(values.email, values.role);
			form.reset();
			setInviteDialogOpen(false);
		} catch (error) {
			console.error("Failed to invite user:", error);
		}
	};

	const handleRevokeInvitation = async (invitationId: string) => {
		try {
			await revokeInvitation(invitationId);
		} catch (error) {
			console.error("Failed to revoke invitation:", error);
		}
	};

	const handleResendInvitation = async (invitationId: string) => {
		try {
			await resendInvitation(invitationId);
		} catch (error) {
			console.error("Failed to resend invitation:", error);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	// Helper function to get initials from name
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((part) => part.charAt(0))
			.join("")
			.toUpperCase();
	};

	return (
		<Card className="p-6">
			<div className="flex justify-between mb-4">
				<h2 className="text-2xl font-bold">User Management</h2>
				<Button
					onClick={() => setInviteDialogOpen(true)}
					className="flex gap-2"
				>
					<UserPlus size={16} />
					<span>Invite User</span>
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-4">
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="invitations">Invitations</TabsTrigger>
				</TabsList>

				<TabsContent value="members">
					{membersLoading ? (
						<MembersLoadingSkeleton />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b">
										<th className="py-2 px-4 text-left">User</th>
										<th className="py-2 px-4 text-left">Email</th>
										<th className="py-2 px-4 text-left">Role</th>
									</tr>
								</thead>
								<tbody>
									{members.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="py-4 text-center text-muted-foreground"
											>
												No members found
											</td>
										</tr>
									) : (
										members.map((member) => (
											<tr
												key={member.id}
												className="border-b hover:bg-muted/50"
											>
												<td className="py-2 px-4">
													<div className="flex items-center gap-3">
														<Avatar className="h-10 w-10 rounded-lg">
															{member.avatar_url ? (
																<AvatarImage
																	src={member.avatar_url}
																	alt={member.display_name}
																/>
															) : (
																<AvatarFallback className="rounded-lg">
																	{getInitials(member.display_name)}
																</AvatarFallback>
															)}
														</Avatar>
														<p>
															{member.display_name}{" "}
															{member.id === currentUserId && (
																<Badge variant="outline" className="text-xs">
																	You
																</Badge>
															)}
														</p>
													</div>
												</td>
												<td className="py-2 px-4">{member.email}</td>
												<td className="py-2 px-4">
													<Badge
														variant={
															member.role === "admin" ? "default" : "outline"
														}
													>
														{member.role}
													</Badge>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				<TabsContent value="invitations">
					{invitationsLoading ? (
						<InvitationsLoadingSkeleton />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b">
										<th className="py-2 px-4 text-left">Email</th>
										<th className="py-2 px-4 text-left">Role</th>
										<th className="py-2 px-4 text-left">Status</th>
										<th className="py-2 px-4 text-left">Sent</th>
										<th className="py-2 px-4 text-left">Expires</th>
										<th className="py-2 px-4 text-left">Actions</th>
									</tr>
								</thead>
								<tbody>
									{invitations.length === 0 ? (
										<tr>
											<td
												colSpan={6}
												className="py-4 text-center text-muted-foreground"
											>
												No invitations found
											</td>
										</tr>
									) : (
										invitations.map((invitation) => (
											<tr
												key={invitation.id}
												className="border-b hover:bg-muted/50"
											>
												<td className="py-2 px-4">{invitation.email}</td>
												<td className="py-2 px-4">
													<Badge
														variant={
															invitation.role === "admin"
																? "default"
																: "outline"
														}
													>
														{invitation.role}
													</Badge>
												</td>
												<td className="py-2 px-4">
													<Badge
														variant={
															invitation.status === "pending"
																? "warning"
																: invitation.status === "accepted"
																	? "success"
																	: "destructive"
														}
													>
														{invitation.status === "pending" && (
															<Clock size={12} className="mr-1" />
														)}
														{invitation.status === "accepted" && (
															<CheckCircle size={12} className="mr-1" />
														)}
														{(invitation.status === "revoked" ||
															invitation.status === "expired") && (
															<XCircle size={12} className="mr-1" />
														)}
														{invitation.status.charAt(0).toUpperCase() +
															invitation.status.slice(1)}
													</Badge>
												</td>
												<td className="py-2 px-4">
													{formatDate(invitation.createdAt)}
												</td>
												<td className="py-2 px-4">
													{formatDate(invitation.expiresAt)}
												</td>
												<td className="py-2 px-4">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreVertical size={16} />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent>
															<DropdownMenuItem
																onClick={() =>
																	handleResendInvitation(invitation.id)
																}
																disabled={
																	resendInvitationLoading ||
																	invitation.status === "accepted"
																}
															>
																<RefreshCw size={16} className="mr-2" />
																Resend Invitation
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	handleRevokeInvitation(invitation.id)
																}
																disabled={
																	revokeInvitationLoading ||
																	invitation.status === "accepted"
																}
																className="text-destructive"
															>
																<Trash2 size={16} className="mr-2" />
																Revoke Invitation
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>
			</Tabs>

			<Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite User</DialogTitle>
						<DialogDescription>
							Enter the email address and select a role for the user you want to
							invite.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="user@example.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Role</FormLabel>
										<div className="flex gap-4">
											<Button
												type="button"
												variant={
													field.value === "member" ? "default" : "outline"
												}
												onClick={() => field.onChange("member")}
												className="flex-1"
											>
												Member
											</Button>
											<Button
												type="button"
												variant={
													field.value === "admin" ? "default" : "outline"
												}
												onClick={() => field.onChange("admin")}
												className="flex-1"
											>
												Admin
											</Button>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setInviteDialogOpen(false)}
								>
									<X size={16} className="mr-2" />
									Cancel
								</Button>
								<Button type="submit" disabled={inviteUserLoading}>
									<Send size={16} className="mr-2" />
									Send Invitation
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

// Mock data for skeleton to avoid linter warnings about array keys
const MEMBER_SKELETONS = [
	{ id: "skeleton-member-1" },
	{ id: "skeleton-member-2" },
	{ id: "skeleton-member-3" },
];

const INVITATION_SKELETONS = [
	{ id: "skeleton-invitation-1" },
	{ id: "skeleton-invitation-2" },
	{ id: "skeleton-invitation-3" },
];

function MembersLoadingSkeleton() {
	return (
		<div className="space-y-4">
			{MEMBER_SKELETONS.map((skeleton) => (
				<div key={skeleton.id} className="flex items-center gap-4">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-[200px]" />
						<Skeleton className="h-4 w-[150px]" />
					</div>
				</div>
			))}
		</div>
	);
}

function InvitationsLoadingSkeleton() {
	return (
		<div className="space-y-4">
			{INVITATION_SKELETONS.map((skeleton) => (
				<div key={skeleton.id} className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-4 w-[200px]" />
						<Skeleton className="h-4 w-[150px]" />
					</div>
					<Skeleton className="h-8 w-[100px]" />
				</div>
			))}
		</div>
	);
}
