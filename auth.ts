import { type User } from "@shared/schema";

class AuthService {
  private currentUser: User | null = null;

  setUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('baartal_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('baartal_user');
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
  }
}

export const authService = new AuthService();
