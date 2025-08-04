import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  name: string;
  userType: "customer" | "business";
  phone?: string;
  createdAt: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: "customer" | "business";
  phone?: string;
}

export function useAuth() {
  const token = localStorage.getItem("auth_token");
  
  return useQuery<User>({
    queryKey: ["/api/users/me"],
    enabled: !!token,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      // Store token
      localStorage.setItem("auth_token", response.token);
      
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      // Store token
      localStorage.setItem("auth_token", response.token);
      
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Clear token
      localStorage.removeItem("auth_token");
      return { success: true };
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      // Redirect to home
      window.location.href = "/";
    },
  });
}