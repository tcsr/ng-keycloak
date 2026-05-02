import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Keycloak from 'keycloak-js';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeycloakAdminService {
  private readonly http = inject(HttpClient);
  private readonly keycloak = inject(Keycloak);

  /**
   * Fetches the list of all available realm roles from the Keycloak Admin REST API.
   * Note: The user or client must have 'view-realm' or 'query-groups' 
   * permissions in the Keycloak Admin Console.
   */
  async getAllRealmRoles(): Promise<any[]> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    
    // For standard Keycloak 26+, the admin API path is usually /admin/realms/{realm}/roles
    // Adjust path if your Keycloak version has a different standard path (e.g. /auth/admin/...)
    const url = `${baseUrl}/admin/realms/${realm}/roles`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`
      };

      const allRoles = await firstValueFrom(this.http.get<any[]>(url, { headers }));
      
      // Filter out internal/system roles to show only user-created ones
      const systemRoles = [
        'offline_access', 
        'uma_authorization', 
        'admin', 
        'create-client', 
        'view-realm', 
        'view-users', 
        'manage-realm', 
        'manage-users',
        'query-groups',
        'query-users',
        'query-realms',
        'view-events',
        'view-identity-providers',
        'manage-identity-providers',
        'manage-events',
        'manage-clients',
        'view-clients',
        'manage-authorization',
        'view-authorization',
        'create-realm'
      ];

      return allRoles.filter(role => 
        !systemRoles.includes(role.name) && 
        !role.name.startsWith('default-roles-')
      );
    } catch (error) {
      console.error('Error fetching realm roles:', error);
      throw error;
    }
  }

  /**
   * Creates a new user in the Keycloak realm.
   * @param user - Object with username, email, enabled, etc.
   * @returns The created user's ID.
   */
  async createUser(user: any): Promise<string> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/users`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`,
        'Content-Type': 'application/json'
      };

      // Keycloak creation returns 201 Created with Location header containing the User ID
      const response = await firstValueFrom(this.http.post(url, user, { headers, observe: 'response' }));
      const location = response.headers.get('Location');
      if (location) {
        return location.split('/').pop() || '';
      }
      throw new Error('User created but ID not found in location header');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Assigns realm roles to a specific user.
   * @param userId - Keycloak User ID.
   * @param roles - Array of role objects (must include at least id and name).
   */
  async assignRealmRolesToUser(userId: string, roles: any[]): Promise<void> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/realm`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`,
        'Content-Type': 'application/json'
      };

      await firstValueFrom(this.http.post(url, roles, { headers }));
    } catch (error) {
      console.error('Error assigning roles:', error);
      throw error;
    }
  }

  /**
   * Fetches the list of all users from the realm.
   */
  async getUsers(): Promise<any[]> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/users`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`
      };
      return await firstValueFrom(this.http.get<any[]>(url, { headers }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Updates an existing user in Keycloak.
   */
  async updateUser(userId: string, user: any): Promise<void> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/users/${userId}`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`,
        'Content-Type': 'application/json'
      };

      await firstValueFrom(this.http.put(url, user, { headers }));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Resets a user's password.
   */
  async resetPassword(userId: string, password: string): Promise<void> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/reset-password`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`,
        'Content-Type': 'application/json'
      };

      const credentials = {
        type: 'password',
        value: password,
        temporary: false
      };

      await firstValueFrom(this.http.put(url, credentials, { headers }));
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Creates a new realm role.
   */
  async createRole(roleName: string): Promise<void> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/roles`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`,
        'Content-Type': 'application/json'
      };
      await firstValueFrom(this.http.post(url, { name: roleName }, { headers }));
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Deletes a realm role.
   */
  async deleteRole(roleName: string): Promise<void> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/roles/${roleName}`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`
      };
      await firstValueFrom(this.http.delete(url, { headers }));
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Fetches login events from the Keycloak Admin REST API.
   * @param dateFrom - ISO string for start date
   * @param dateTo - ISO string for end date
   * @param first - Offset for pagination
   * @param maxResults - Maximum number of results to return
   */
  async getLoginEvents(dateFrom: string, dateTo: string, first = 0, maxResults = 100): Promise<any[]> {
    const realm = this.keycloak.realm || 'master';
    const baseUrl = this.keycloak.authServerUrl || 'http://localhost:8080';
    const url = `${baseUrl}/admin/realms/${realm}/events?type=LOGIN&type=LOGOUT&dateFrom=${dateFrom}&dateTo=${dateTo}&first=${first}&max=${maxResults}`;

    try {
      const headers = {
        'Authorization': `Bearer ${this.keycloak.token}`
      };
      return await firstValueFrom(this.http.get<any[]>(url, { headers }));
    } catch (error) {
      console.error('Error fetching login events:', error);
      throw error;
    }
  }
}
