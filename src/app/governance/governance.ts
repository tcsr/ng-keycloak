import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../store/app.store';

// PrimeNG 21 Imports for Governance Console
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-governance',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    InputTextModule, 
    CheckboxModule, 
    CardModule, 
    TagModule, 
    RippleModule, 
    TooltipModule,
    DialogModule,
    FloatLabelModule
  ],
  templateUrl: './governance.html'
})
export class GovernanceComponent {
  readonly store = inject(AppStore);

  // LOCAL STATE
  showAddRoleDialog = signal(false);
  newRoleName = signal('');

  // LIST OF MODULES TO PROVISION
  modules = signal([
    { id: 'Dashboard', icon: 'pi pi-home', description: 'Executive summary and real-time KPI overview.' },
    { id: 'Identities', icon: 'pi pi-users', description: 'Access to user provisioning and vault registry.' },
    { id: 'Analytics', icon: 'pi pi-chart-bar', description: 'Security intelligence and anomaly reporting.' },
    { id: 'Governance', icon: 'pi pi-shield', description: 'Access to this module-level lockdown center.' }
  ]);

  provisionRole(moduleName: string, roleName: string) {
    this.store.updateModulePermission(moduleName, roleName);
  }

  isAuthorized(moduleName: string, roleName: string): boolean {
    const perms = this.store.modulePermissions();
    return perms[moduleName]?.includes(roleName) || false;
  }

  openAddRole() {
    this.newRoleName.set('');
    this.showAddRoleDialog.set(true);
  }

  confirmAddRole() {
    if (this.newRoleName().trim()) {
      this.store.createRole(this.newRoleName().trim());
      this.showAddRoleDialog.set(false);
    }
  }

  revokeRole(roleName: string) {
    // Revoking from realm
    if (confirm(`REVOKE ROLE '${roleName}'? This will remove it from all users and module permissions.`)) {
      this.store.deleteRole(roleName);
    }
  }
}
