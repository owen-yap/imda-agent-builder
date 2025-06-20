import { useAuth } from "../lib/auth-context";
import { useApiMutation, useApiDeleteMutation } from "./use-api";
import { useProfile } from "@/lib/profile-context";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type WorkspaceMember = {
	id: string;
	display_name: string;
	email: string;
	avatar_url?: string;
	role: "admin" | "member";
};

export type WorkspaceInvitation = {
	id: string;
	email: string;
	role: "admin" | "member";
	status: "pending" | "accepted" | "expired" | "revoked";
	createdAt: string;
	expiresAt: string;
	inviter: {
		display_name: string;
		email: string;
	};
};

export function useWorkspaceMembers() {
	const { user } = useAuth();
	const { profile } = useProfile();
	const workspaceId = profile?.workspace_id;

	const {
		data,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["workspaceMembers", workspaceId || "none"],
		queryFn: async () => {
			if (!workspaceId) return { members: [] };

			// Use Supabase to fetch members directly
			const { data, error } = await supabase
				.from("user_roles")
				.select(`
					user_id,
					role,
					user_profiles!inner(
						id,
						display_name,
						email,
						avatar_url
					)
				`)
				.eq("workspace_id", workspaceId);

			if (error) throw error;

			// Transform the data to match our expected format
			const members: WorkspaceMember[] = data.map((item) => {
				// Ensure we're handling the nested join correctly
				const profile = Array.isArray(item.user_profiles)
					? item.user_profiles[0]
					: item.user_profiles;

				return {
					id: item.user_id,
					display_name: profile.display_name || "",
					email: profile.email || "",
					avatar_url: profile.avatar_url,
					role: item.role as "admin" | "member",
				};
			});

			return { members };
		},
		enabled: !!workspaceId,
	});

	return {
		members: data?.members || [],
		loading,
		error,
		currentUserId: user?.id,
	};
}

type InviteUserData = Record<string, unknown> & {
	email: string;
	role: "admin" | "member";
};

interface InviteResponse {
	message: string;
	invitation: WorkspaceInvitation;
}

export function useInviteUser() {
	const { profile } = useProfile();
	const queryClient = useQueryClient();
	const workspaceId = profile?.workspace_id;

	const mutation = useApiMutation<InviteResponse, InviteUserData>(
		workspaceId ? `/invitations/workspaces/${workspaceId}` : "",
		{
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["workspaceInvitations", workspaceId || "none"],
				});
			},
		},
	);

	const inviteUser = (email: string, role: "admin" | "member") => {
		if (!workspaceId) return Promise.reject("No workspace selected");
		return mutation.mutateAsync({ email, role });
	};

	return {
		inviteUser,
		loading: mutation.isPending,
		error: mutation.error,
	};
}

// Type for storing multiple Delete mutation hooks
type DeleteMutations = Record<
	string,
	ReturnType<typeof useApiDeleteMutation<{ message: string }>>
>;

export function useRevokeInvitation() {
	const { profile } = useProfile();
	const queryClient = useQueryClient();
	const workspaceId = profile?.workspace_id;

	// Store dynamically created mutations by ID
	const mutations: DeleteMutations = {};

	// Function to get or create a mutation for a specific invitation ID
	const getMutation = (invitationId: string) => {
		if (!mutations[invitationId]) {
			mutations[invitationId] = useApiDeleteMutation<{ message: string }>(
				`/invitations/${invitationId}`,
				{
					onSuccess: () => {
						queryClient.invalidateQueries({
							queryKey: ["workspaceInvitations", workspaceId || "none"],
						});
					},
				},
			);
		}
		return mutations[invitationId];
	};

	const revokeInvitation = (invitationId: string) => {
		const mutation = getMutation(invitationId);
		return mutation.mutateAsync();
	};

	return {
		revokeInvitation,
		// Since we now have multiple mutations, this is approximate
		loading: Object.values(mutations).some((mutation) => mutation.isPending),
		error: Object.values(mutations).find((mutation) => mutation.error)?.error,
	};
}

// Type for storing multiple POST mutation hooks with specific generic types
type ResendMutation = UseMutationResult<
	{ message: string },
	Error,
	Record<string, never>,
	unknown
>;

type PostMutations = Record<string, ResendMutation>;

export function useResendInvitation() {
	const { profile } = useProfile();
	const queryClient = useQueryClient();
	const workspaceId = profile?.workspace_id;

	// Store dynamically created mutations by ID
	const mutations: PostMutations = {};

	// Function to get or create a mutation for a specific invitation ID
	const getMutation = (invitationId: string) => {
		if (!mutations[invitationId]) {
			mutations[invitationId] = useApiMutation<
				{ message: string },
				Record<string, never>
			>(`/invitations/${invitationId}/resend`, {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: ["workspaceInvitations", workspaceId || "none"],
					});
				},
			});
		}
		return mutations[invitationId];
	};

	const resendInvitation = (invitationId: string) => {
		const mutation = getMutation(invitationId);
		return mutation.mutateAsync({});
	};

	return {
		resendInvitation,
		// Since we now have multiple mutations, this is approximate
		loading: Object.values(mutations).some((mutation) => mutation.isPending),
		error: Object.values(mutations).find((mutation) => mutation.error)?.error,
	};
}

export function useWorkspaceInvitations() {
	const { profile } = useProfile();
	const workspaceId = profile?.workspace_id;

	const { inviteUser, loading: inviteLoading } = useInviteUser();
	const { revokeInvitation, loading: revokeLoading } = useRevokeInvitation();
	const { resendInvitation, loading: resendLoading } = useResendInvitation();

	const {
		data,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["workspaceInvitations", workspaceId || "none"],
		queryFn: async () => {
			if (!workspaceId) return { invitations: [] };

			// Use Supabase to fetch invitations directly
			const { data, error } = await supabase
				.from("workspace_invitations")
				.select(`
					id,
					email,
					role,
					status,
					created_at,
					expires_at,
					invited_by,
					user_profiles!invited_by(
						display_name,
						email
					)
				`)
				.eq("workspace_id", workspaceId);

			if (error) throw error;

			// Transform the data to match our expected format
			const invitations: WorkspaceInvitation[] = data.map((item) => {
				// Ensure we're handling the nested join correctly
				const inviter = Array.isArray(item.user_profiles)
					? item.user_profiles[0]
					: item.user_profiles;

				return {
					id: item.id,
					email: item.email,
					role: item.role as "admin" | "member",
					status: item.status as "pending" | "accepted" | "expired" | "revoked",
					createdAt: item.created_at,
					expiresAt: item.expires_at,
					inviter: {
						display_name: inviter.display_name || "",
						email: inviter.email || "",
					},
				};
			});

			return { invitations };
		},
		enabled: !!workspaceId,
	});

	return {
		invitations: data?.invitations || [],
		loading,
		error,
		inviteUser,
		inviteUserLoading: inviteLoading,
		revokeInvitation,
		revokeInvitationLoading: revokeLoading,
		resendInvitation,
		resendInvitationLoading: resendLoading,
	};
}
