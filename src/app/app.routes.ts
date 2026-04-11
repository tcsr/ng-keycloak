import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { UsersComponent } from './users/users';
import { ReportsComponent } from './reports/reports';
import { GovernanceComponent } from './governance/governance';
import { AccessDeniedComponent } from './access-denied/access-denied';
import { hasRoleGuard } from './auth.guard'; 
import { ACL_ROLES, MODULE_PERMISSIONS } from './acl.config';
export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  
  // ADMIN ONLY ROLE
  { 
    path: 'users', 
    component: UsersComponent, 
    canActivate: [hasRoleGuard], 
    data: { roles: MODULE_PERMISSIONS['Identities'] } 
  },

  // MANAGER OR ADMIN ROLE
  { 
    path: 'reports', 
    component: ReportsComponent, 
    canActivate: [hasRoleGuard], 
    data: { roles: MODULE_PERMISSIONS['Analytics'] } 
  },
  
  // MODULE LOCKDOWN Governance (ADMIN ONLY)
  { 
    path: 'governance', 
    component: GovernanceComponent, 
    canActivate: [hasRoleGuard], 
    data: { roles: MODULE_PERMISSIONS['Governance'] } 
  },

  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
