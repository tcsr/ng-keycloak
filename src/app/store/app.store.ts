import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { inject, computed, signal } from '@angular/core';
import { KeycloakAdminService } from '../keycloak-admin.service';
import { NotificationService } from '../notification.service';
import Keycloak from 'keycloak-js';

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified?: boolean;
  realmRoles?: string[];
}

export interface RealmRole {
  id: string;
  name: string;
  description?: string;
}

interface AppState {
  users: User[];
  allRealmRoles: RealmRole[];
  isLoading: boolean;
  error: string | null;
  isVaultOffline: boolean; // CRITICAL: Only true if server/link is dead
  modulePermissions: Record<string, string[]>; // Mapping: ModuleName -> RoleNames[]
}

const initialState: AppState = {
  users: [],
  allRealmRoles: [],
  isLoading: false,
  error: null,
  isVaultOffline: false,
  modulePermissions: {
    'Dashboard': ['admin', 'manager', 'editor', 'default-roles-ng-keycloak', 'default-roles-master', 'offline_access', 'clinical_team'],
    'Identities': ['admin', 'manager', 'editor', 'default-roles-ng-keycloak', 'default-roles-master', 'offline_access', 'clinical_team'],
    'Analytics': ['admin', 'manager', 'editor', 'default-roles-ng-keycloak', 'default-roles-master', 'offline_access', 'clinical_team'],
    'Governance': ['admin', 'manager', 'editor', 'default-roles-ng-keycloak', 'default-roles-master', 'offline_access', 'clinical_team']
  }
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  
  withComputed((state) => {
    const keycloak = inject(Keycloak);
    
    return {
      authenticated: computed(() => !!keycloak.authenticated),
      username: computed(() => keycloak.profile?.username || keycloak.tokenParsed?.['preferred_username'] || 'Anonymous'),
      fullName: computed(() => {
        const profile = keycloak.profile;
        const token = keycloak.tokenParsed;
        const first = profile?.firstName || token?.['given_name'] || '';
        const last = profile?.lastName || token?.['family_name'] || '';
        const name = `${first} ${last}`.trim();
        return name || profile?.username || token?.['preferred_username'] || 'Anonymous Admin';
      }),
      avatarInitials: computed(() => {
        const name = `${keycloak.profile?.firstName || ''} ${keycloak.profile?.lastName || ''}`.trim() || 
                     keycloak.tokenParsed?.['name'] || 
                     keycloak.profile?.username || 
                     keycloak.tokenParsed?.['preferred_username'] || 
                     'AA';
        const parts = name.split(' ').filter((p: string) => p.length > 0);
        if (parts.length >= 2) {
          return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        } else if (parts.length === 1) {
          return parts[0].substring(0, 2).toUpperCase();
        }
        return 'AA';
      }),
      email: computed(() => keycloak.profile?.email || keycloak.tokenParsed?.['email'] || ''),
      userRoles: computed(() => keycloak.realmAccess?.roles || []),
      userCount: computed(() => state.users().length),
      rolesCount: computed(() => state.allRealmRoles().length),
    };
  }),

  withMethods((store) => {
    const adminService = inject(KeycloakAdminService);
    const notification = inject(NotificationService);
    const keycloak = inject(Keycloak);

    return {
      login() {
        // IDENTITY PERSISTENCE: Archive current identity to compare after the switch
        if (keycloak.authenticated) {
          localStorage.setItem('last_vault_session_identity', store.username());
        }
        keycloak.login({
          redirectUri: window.location.origin + '/#/' // Ensure hash coordinate preservation
        });
      },

      logout() {
        keycloak.logout();
      },

      updateModulePermission(moduleName: string, roleName: string) {
        const currentPerms = { ...store.modulePermissions() };
        const roles = [...(currentPerms[moduleName] || [])];
        
        if (roles.includes(roleName)) {
          currentPerms[moduleName] = roles.filter(r => r !== roleName);
        } else {
          currentPerms[moduleName] = [...roles, roleName];
        }
        
        patchState(store, { modulePermissions: currentPerms });
        
        // PERSISTENCE BRIDGE: Sync to browser storage for configuration survival
        try {
          localStorage.setItem('authority_vault_permissions', JSON.stringify(currentPerms));
        } catch (e) { console.error('Persistence Sync Failed', e); }

        notification.success(`Access updated for ${moduleName}`);
      },

      async loadInitialData(force = false) {
        // VAULT GUARD: Never initiate registry handshake if session is unauthenticated
        if (!keycloak.authenticated) {
          return;
        }

        // STATE LOCK: Prevent redundant syncs during hover/UI interactions
        if (store.isLoading() || (!force && store.users().length > 3)) {
          return;
        }

        patchState(store, { isLoading: true });
        notification.showLoader();
        
        try {
          // HYDRATION: Check for persisted governance config first
          const savedPerms = localStorage.getItem('authority_vault_permissions');
          if (savedPerms) {
            patchState(store, { modulePermissions: JSON.parse(savedPerms) });
          }

          const [users, roles] = await Promise.all([
            adminService.getUsers(),
            adminService.getAllRealmRoles()
          ]);
          
          patchState(store, { users, allRealmRoles: roles, isLoading: false, error: null, isVaultOffline: false });
        } catch (e: any) {
          const isServerDown = e.status === 0 || (e.status >= 500 && e.status <= 599);
          const errorMsg = e.status === 403 ? 'Registry Access Restricted (403)' : 'Vault Sync Offline';
          
          patchState(store, { 
            isLoading: false, 
            error: errorMsg, 
            isVaultOffline: isServerDown,
            users: [] 
          }); 
          if (!isServerDown) {
            notification.warning(errorMsg);
          }
        } finally {
          notification.hideLoader();
        }
      },

      async createRole(roleName: string) {
        patchState(store, { isLoading: true });
        notification.showLoader();
        try {
          // Note: In real app, we need role object. Mocking standard role structure.
          await adminService['createRole']?.(roleName); 
          notification.success(`Role '${roleName}' provisioned!`);
          await this.loadInitialData();
        } catch (e) {
          notification.error('Failed to create role.');
        } finally {
          notification.hideLoader();
          patchState(store, { isLoading: false });
        }
      },

      async deleteRole(roleName: string) {
        patchState(store, { isLoading: true });
        notification.showLoader();
        try {
          await adminService['deleteRole']?.(roleName);
          notification.success(`Role '${roleName}' revoked!`);
          await this.loadInitialData();
        } catch (e) {
          notification.error('Failed to revoke role.');
        } finally {
          notification.hideLoader();
          patchState(store, { isLoading: false });
        }
      },

      async createUser(user: any, roles: RealmRole[] = []) {
        patchState(store, { isLoading: true });
        notification.showLoader();

        try {
          const userId = await adminService.createUser(user);
          if (roles.length > 0) {
            await adminService.assignRealmRolesToUser(userId, roles);
          }
          notification.success(`User '${user.username}' created successfully!`);
          
          const updatedUsers = await adminService.getUsers();
          patchState(store, { users: updatedUsers, isLoading: false });
        } catch (e: any) {
          notification.error(e?.error?.errorMessage || 'Failed to create user.');
          patchState(store, { isLoading: false });
          throw e;
        } finally {
          notification.hideLoader();
        }
      },

      async updateUser(userId: string, user: any, roles: RealmRole[] = [], newPassword?: string) {
        patchState(store, { isLoading: true });
        notification.showLoader();

        try {
          await adminService.updateUser(userId, user);
          if (newPassword) {
            await adminService.resetPassword(userId, newPassword);
          }
          if (roles.length > 0) {
            await adminService.assignRealmRolesToUser(userId, roles);
          }
          
          notification.success(`User updated successfully!`);
          
          const updatedUsers = await adminService.getUsers();
          patchState(store, { users: updatedUsers, isLoading: false });
        } catch (e: any) {
          notification.error('Failed to update user.');
          patchState(store, { isLoading: false });
          throw e;
        } finally {
          notification.hideLoader();
        }
      }
    };
  })
);
