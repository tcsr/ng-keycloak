import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { createAuthGuard } from 'keycloak-angular';
import Keycloak from 'keycloak-js';

/**
 * Generic Scalable Role Guard.
 * It reads the required roles from the route's 'data.roles' array.
 * If any of the roles match, access is granted.
 */
export const hasRoleGuard = createAuthGuard(async (route, state, authData) => {
  const { authenticated, grantedRoles } = authData;
  const router = inject(Router);
  const keycloak = inject(Keycloak);

  // 1. Force Login if not authenticated
  if (!authenticated) {
    await keycloak.login();
    return false;
  }

  // 2. Get required roles from route data (e.g., data: { roles: ['admin', 'manager'] })
  const requiredRoles = route.data['roles'] as string[];
  
  // 3. If no roles are specified, allow access (just requires authentication)
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // 4. Check if user has AT LEAST ONE of the required roles
  const userRoles = grantedRoles.realmRoles;
  const hasAccess = requiredRoles.some(role => userRoles.includes(role));

  if (hasAccess) {
    return true;
  }

  // 5. Redirect to access-denied if unauthorized
  return router.createUrlTree(['/access-denied']);
});
