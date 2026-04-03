import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { UsersComponent } from './users/users';
import { ReportsComponent } from './reports/reports';
import { GovernanceComponent } from './governance/governance';
import { AccessDeniedComponent } from './access-denied/access-denied';
import { hasRoleGuard } from './auth.guard'; 

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  
  // ADMIN ONLY ROLE
  { 
    path: 'users', 
    component: UsersComponent, 
    canActivate: [hasRoleGuard], 
    data: { roles: ['admin'] } 
  },

  // MANAGER OR ADMIN ROLE
  { 
    path: 'reports', 
    component: ReportsComponent, 
    canActivate: [hasRoleGuard], 
    data: { roles: ['manager', 'admin'] } 
  },
  
  // MODULE LOCKDOWN Governance (ADMIN ONLY)
  { 
    path: 'governance', 
    component: GovernanceComponent, 
    canActivate: [hasRoleGuard], 
    data: { roles: ['admin'] } 
  },

  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
