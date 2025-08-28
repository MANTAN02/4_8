import { type User } from "@shared/schema";

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  setUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('baartal_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('baartal_user');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('baartal_token', token);
    } else {
      localStorage.removeItem('baartal_token');
    }
  }

  getUser(): User | null {
    if (this.currentUser) return this.currentUser;
    
    const stored = localStorage.getItem('baartal_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        localStorage.removeItem('baartal_user');
      }
    }
    return null;
  }

  getToken(): string | null {
    if (this.token) return this.token;
    const stored = localStorage.getItem('baartal_token');
    if (stored) {
      this.token = stored;
      return this.token;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getUser() !== null;
  }

  isCustomer(): boolean {
    const user = this.getUser();
    return user?.userType === 'customer';
  }

  isBusiness(): boolean {
    const user = this.getUser();
    return user?.userType === 'business';
  }

  logout() {
    this.setUser(null);
    this.setToken(null);
  }
}

export const authService = new AuthService();
