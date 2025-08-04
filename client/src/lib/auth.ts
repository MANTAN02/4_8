

const USER_STORAGE_KEY = "baartal_user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: "customer" | "business";
}

export const authService = {
  getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser(user: AuthUser): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  logout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const { user } = await response.json();
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
    };

    this.setCurrentUser(authUser);
    return authUser;
  },
};