import { supabase } from "./supabase";

const API_URL = `${import.meta.env.VITE_BACKEND_API_URL}/authenticated`;

interface ApiOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
}

/**
 * Utility function for making API requests to the backend
 */
export async function api<T>(
	endpoint: string,
	options: ApiOptions = {},
): Promise<T> {
	const { method = "GET", body, headers = {} } = options;

	const url = `${API_URL}${endpoint}`;

	// Get the current session from Supabase
	const session = await supabase.auth.getSession();
	const accessToken = session.data.session?.access_token;

	const requestOptions: RequestInit = {
		method,
		headers: {
			"Content-Type": "application/json",
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			...headers,
		},
		credentials: "include",
	};

	if (body) {
		requestOptions.body = JSON.stringify(body);
	}

	const response = await fetch(url, requestOptions);

	if (!response.ok) {
		throw new Error(`API error: ${response.status}`);
	}

	// Handle both JSON responses and text responses
	const contentType = response.headers.get("content-type");
	if (contentType?.includes("application/json")) {
		return response.json();
	}

	return response.text() as unknown as T;
}

// Pre-configured API functions for common operations
export const apiClient = {
	get: <T>(endpoint: string, options?: Omit<ApiOptions, "method" | "body">) =>
		api<T>(endpoint, { ...options, method: "GET" }),

	post: <T>(
		endpoint: string,
		body: Record<string, unknown>,
		options?: Omit<ApiOptions, "method">,
	) => api<T>(endpoint, { ...options, method: "POST", body }),

	put: <T>(
		endpoint: string,
		body: Record<string, unknown>,
		options?: Omit<ApiOptions, "method">,
	) => api<T>(endpoint, { ...options, method: "PUT", body }),

	delete: <T>(endpoint: string, options?: Omit<ApiOptions, "method">) =>
		api<T>(endpoint, { ...options, method: "DELETE" }),

	// New function to handle FormData uploads
	uploadFormData: async <T>(
		endpoint: string,
		formData: FormData,
	): Promise<T> => {
		const url = `${API_URL}${endpoint}`;

		// Get the current session from Supabase
		const session = await supabase.auth.getSession();
		const accessToken = session.data.session?.access_token;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
			body: formData,
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			return response.json();
		}

		return response.text() as unknown as T;
	},
};
