import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAccount, ProjectData, PaymentPlan } from '../types';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SocialAuthProvider {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
}

export class UserAccountProjectManagement {
  private currentUser: UserAccount | null = null;
  private authToken: string | null = null;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'https://api.aivideogenerator.com') {
    this.apiBaseUrl = apiBaseUrl;
    this.loadStoredAuth();
  }

  /**
   * User Authentication Methods
   */

  /**
   * Register new user with email and password
   */
  async register(credentials: AuthCredentials, name: string): Promise<UserAccount> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Create user account object
      const userAccount: UserAccount = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        subscription: 'free',
        projects: [],
        createdAt: new Date(data.user.createdAt),
      };

      // Store authentication data
      this.currentUser = userAccount;
      this.authToken = data.token;
      await this.storeAuthData(userAccount, data.token);

      return userAccount;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Failed to create account. Please try again.');
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: AuthCredentials): Promise<UserAccount> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      const userAccount: UserAccount = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        subscription: data.user.subscription || 'free',
        projects: data.user.projects || [],
        createdAt: new Date(data.user.createdAt),
      };

      this.currentUser = userAccount;
      this.authToken = data.token;
      await this.storeAuthData(userAccount, data.token);

      return userAccount;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  }

  /**
   * Social media authentication
   */
  async loginWithSocial(socialAuth: SocialAuthProvider): Promise<UserAccount> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialAuth),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Social login failed');
      }

      const data = await response.json();
      
      const userAccount: UserAccount = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        subscription: data.user.subscription || 'free',
        projects: data.user.projects || [],
        createdAt: new Date(data.user.createdAt),
      };

      this.currentUser = userAccount;
      this.authToken = data.token;
      await this.storeAuthData(userAccount, data.token);

      return userAccount;
    } catch (error) {
      console.error('Social login error:', error);
      throw new Error(`Failed to login with ${socialAuth.provider}`);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await fetch(`${this.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.authToken = null;
      await this.clearStoredAuth();
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Project Management Methods
   */

  /**
   * Create new project
   */
  async createProject(projectData: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectData> {
    if (!this.currentUser || !this.authToken) {
      throw new Error('User must be logged in to create projects');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }

      const data = await response.json();
      
      const project: ProjectData = {
        ...data.project,
        createdAt: new Date(data.project.createdAt),
        updatedAt: new Date(data.project.updatedAt),
      };

      // Add to local user projects
      this.currentUser.projects.push(project);
      await this.updateStoredUser(this.currentUser);

      return project;
    } catch (error) {
      console.error('Project creation error:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Get all user projects
   */
  async getUserProjects(): Promise<ProjectData[]> {
    if (!this.currentUser || !this.authToken) {
      throw new Error('User must be logged in to view projects');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/projects`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch projects');
      }

      const data = await response.json();
      
      const projects: ProjectData[] = data.projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      }));

      // Update local user data
      this.currentUser.projects = projects;
      await this.updateStoredUser(this.currentUser);

      return projects;
    } catch (error) {
      console.error('Fetch projects error:', error);
      throw new Error('Failed to load projects');
    }
  }

  /**
   * Get specific project by ID
   */
  async getProject(projectId: string): Promise<ProjectData> {
    if (!this.authToken) {
      throw new Error('User must be logged in to view projects');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Project not found');
      }

      const data = await response.json();
      
      return {
        ...data.project,
        createdAt: new Date(data.project.createdAt),
        updatedAt: new Date(data.project.updatedAt),
      };
    } catch (error) {
      console.error('Fetch project error:', error);
      throw new Error('Failed to load project');
    }
  }

  /**
   * Update existing project
   */
  async updateProject(projectId: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    if (!this.authToken) {
      throw new Error('User must be logged in to update projects');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project');
      }

      const data = await response.json();
      
      const updatedProject: ProjectData = {
        ...data.project,
        createdAt: new Date(data.project.createdAt),
        updatedAt: new Date(data.project.updatedAt),
      };

      // Update local user projects
      if (this.currentUser) {
        const projectIndex = this.currentUser.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
          this.currentUser.projects[projectIndex] = updatedProject;
          await this.updateStoredUser(this.currentUser);
        }
      }

      return updatedProject;
    } catch (error) {
      console.error('Update project error:', error);
      throw new Error('Failed to update project');
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('User must be logged in to delete projects');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete project');
      }

      // Remove from local user projects
      if (this.currentUser) {
        this.currentUser.projects = this.currentUser.projects.filter(p => p.id !== projectId);
        await this.updateStoredUser(this.currentUser);
      }
    } catch (error) {
      console.error('Delete project error:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Duplicate project
   */
  async duplicateProject(projectId: string, newName: string): Promise<ProjectData> {
    const originalProject = await this.getProject(projectId);
    
    const duplicatedProject = {
      ...originalProject,
      name: newName,
      status: 'draft' as const,
      outputVideoUrl: undefined,
    };

    // Remove id, createdAt, updatedAt as they will be generated
    const { id, createdAt, updatedAt, ...projectDataToDuplicate } = duplicatedProject;
    
    return this.createProject(projectDataToDuplicate);
  }

  /**
   * Subscription Management
   */

  /**
   * Get available payment plans
   */
  async getPaymentPlans(): Promise<PaymentPlan[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/plans`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment plans');
      }

      const data = await response.json();
      return data.plans;
    } catch (error) {
      console.error('Fetch plans error:', error);
      // Return mock plans
      return this.getMockPaymentPlans();
    }
  }

  /**
   * Upgrade user subscription
   */
  async upgradeSubscription(planId: string, paymentMethodId: string): Promise<UserAccount> {
    if (!this.currentUser || !this.authToken) {
      throw new Error('User must be logged in to upgrade subscription');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          planId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Subscription upgrade failed');
      }

      const data = await response.json();
      
      // Update user subscription
      this.currentUser.subscription = data.subscription;
      await this.updateStoredUser(this.currentUser);

      return this.currentUser;
    } catch (error) {
      console.error('Subscription upgrade error:', error);
      throw new Error('Failed to upgrade subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    if (!this.currentUser || !this.authToken) {
      throw new Error('User must be logged in to cancel subscription');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Subscription cancellation failed');
      }

      // Update user subscription
      this.currentUser.subscription = 'free';
      await this.updateStoredUser(this.currentUser);
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Storage Management
   */

  /**
   * Store authentication data locally
   */
  private async storeAuthData(user: UserAccount, token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
      await AsyncStorage.setItem('@auth_token', token);
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  }

  /**
   * Load stored authentication data
   */
  private async loadStoredAuth(): Promise<void> {
    try {
      const [userJson, token] = await Promise.all([
        AsyncStorage.getItem('@auth_user'),
        AsyncStorage.getItem('@auth_token'),
      ]);

      if (userJson && token) {
        const user = JSON.parse(userJson);
        user.createdAt = new Date(user.createdAt);
        user.projects = user.projects.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));

        this.currentUser = user;
        this.authToken = token;
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    }
  }

  /**
   * Update stored user data
   */
  private async updateStoredUser(user: UserAccount): Promise<void> {
    try {
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to update stored user:', error);
    }
  }

  /**
   * Clear stored authentication data
   */
  private async clearStoredAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['@auth_user', '@auth_token']);
    } catch (error) {
      console.error('Failed to clear stored auth:', error);
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Get current user
   */
  getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  /**
   * Check if user has pro subscription
   */
  hasPro(): boolean {
    return this.currentUser?.subscription === 'pro';
  }

  /**
   * Get user's subscription limits
   */
  getSubscriptionLimits(): {
    maxProjects: number;
    maxVideoLength: number;
    watermarkRequired: boolean;
    prioritySupport: boolean;
  } {
    if (this.hasPro()) {
      return {
        maxProjects: Infinity,
        maxVideoLength: Infinity,
        watermarkRequired: false,
        prioritySupport: true,
      };
    } else {
      return {
        maxProjects: 3,
        maxVideoLength: 300, // 5 minutes
        watermarkRequired: true,
        prioritySupport: false,
      };
    }
  }

  /**
   * Mock payment plans for demo
   */
  private getMockPaymentPlans(): PaymentPlan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          '3 projects maximum',
          '5 minute video limit',
          'Watermarked videos',
          'Basic templates',
          'Standard support',
        ],
        maxProjects: 3,
        maxVideoLength: 300,
        watermark: true,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 19.99,
        features: [
          'Unlimited projects',
          'No video length limit',
          'No watermark',
          'Premium templates',
          'Priority support',
          'HD export',
          'Social media integration',
        ],
        maxProjects: Infinity,
        maxVideoLength: Infinity,
        watermark: false,
      },
    ];
  }

  /**
   * Validate user permissions for action
   */
  canPerformAction(action: 'create_project' | 'export_hd' | 'remove_watermark'): boolean {
    if (!this.currentUser) return false;

    const limits = this.getSubscriptionLimits();

    switch (action) {
      case 'create_project':
        return this.currentUser.projects.length < limits.maxProjects;
      case 'export_hd':
        return this.hasPro();
      case 'remove_watermark':
        return !limits.watermarkRequired;
      default:
        return false;
    }
  }
}
