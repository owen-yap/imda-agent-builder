import { useQuery, useMutation } from "@tanstack/react-query";
import type {
	QueryKey,
	UseMutationOptions,
	UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// Custom hook for GET requests
export function useApiQuery<TData>(
	endpoint: string,
	queryKey: QueryKey,
	options?: Omit<
		UseQueryOptions<TData, Error, TData, QueryKey>,
		"queryKey" | "queryFn"
	>,
) {
	return useQuery<TData, Error>({
		queryKey,
		queryFn: () => apiClient.get<TData>(endpoint),
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		staleTime: 0,
		...options,
	});
}

// Custom hook for POST requests
export function useApiMutation<
	TData,
	TVariables extends Record<string, unknown>,
>(
	endpoint: string | ((variables: TVariables) => string),
	options?: UseMutationOptions<TData, Error, TVariables>,
) {
	return useMutation<TData, Error, TVariables>({
		mutationFn: (variables) => {
			const path =
				typeof endpoint === "function" ? endpoint(variables) : endpoint;
			return apiClient.post<TData>(path, variables);
		},
		...options,
	});
}

// Custom hook for PUT requests
export function useApiPutMutation<
	TData,
	TVariables extends Record<string, unknown>,
>(
	endpoint: string | ((variables: TVariables) => string),
	options?: UseMutationOptions<TData, Error, TVariables>,
) {
	return useMutation<TData, Error, TVariables>({
		mutationFn: (variables) => {
			const path =
				typeof endpoint === "function" ? endpoint(variables) : endpoint;
			return apiClient.put<TData>(path, variables);
		},
		...options,
	});
}

// Custom hook for DELETE requests
export function useApiDeleteMutation<TData>(
	endpoint: string,
	options?: UseMutationOptions<TData, Error, void>,
) {
	return useMutation<TData, Error, void>({
		mutationFn: () => apiClient.delete<TData>(endpoint),
		...options,
	});
}

// Custom hook for FormData uploads
export function useApiFormDataMutation<TData>(
	endpoint: string,
	options?: UseMutationOptions<TData, Error, FormData>,
) {
	return useMutation<TData, Error, FormData>({
		mutationFn: (formData) =>
			apiClient.uploadFormData<TData>(endpoint, formData),
		...options,
	});
}
