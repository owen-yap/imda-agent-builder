import { useAuth } from "../lib/auth-context";
import { useApiQuery } from "./use-api";

export type Workspace = {
	id: string;
	name: string;
	created_at?: string;
};

interface WorkspacesResponse {
	workspaces: Workspace[];
}

export function useWorkspaces() {
	const { user } = useAuth();

	const {
		data,
		isLoading: loading,
		error,
	} = useApiQuery<WorkspacesResponse>(user ? `/workspaces/${user.id}` : "", [
		"workspaces",
		user?.id,
	]);

	// Don't run the query if there's no user
	if (!user) {
		return { workspaces: [], loading: false, error: null };
	}

	// Extract workspaces from response, or default to empty array
	const workspaces = data?.workspaces || [];

	return { workspaces, loading, error };
}
