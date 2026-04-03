import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../store/app.store';

// PrimeNG 21 Imports for Security Console
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FloatLabelModule } from 'primeng/floatlabel';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule, 
    PasswordModule, 
    ToggleSwitchModule, 
    TableModule, 
    TagModule, 
    FloatLabelModule, 
    RippleModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule
  ],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class UsersComponent implements OnInit {
  readonly store = inject(AppStore);

  ngOnInit() {
    if (this.store.users().length === 0) {
      this.store.loadInitialData();
    }
  }

  // Form Signals
  username = signal('');
  email = signal('');
  firstName = signal('');
  lastName = signal('');
  password = signal('');
  enabled = signal(true);
  emailVerified = signal(true); // AUTHORITY HUB DEFAULT: Pre-verify identities
  selectedRoles = signal<Set<string>>(new Set());
  isEditMode = signal(false);
  editingUserId = signal<string | null>(null);

  // SEARCH & ERROR SIGNALS
  searchQuery = signal('');
  formError = signal<string | null>(null);

  // COMPUTED FILTERED USERS
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allUsers = this.store.users();
    if (!query) return allUsers;
    return allUsers.filter(u => 
      u.username.toLowerCase().includes(query) || 
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.firstName && u.firstName.toLowerCase().includes(query)) ||
      (u.lastName && u.lastName.toLowerCase().includes(query))
    );
  });

  generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(chars.length * Math.random()));
    }
    this.password.set(pass);
  }

  toggleRole(roleName: string) {
    const current = new Set(this.selectedRoles());
    if (current.has(roleName)) current.delete(roleName);
    else current.add(roleName);
    this.selectedRoles.set(current);
  }

  // RAPID ACTIONS logic
  toggleUserLock(user: any) {
    this.store.updateUser(user.id, { enabled: !user.enabled }, []);
  }

  resetUserPassword(user: any) {
    // In a real app, this would trigger a Keycloak email reset or a prompt
    console.log(`Password reset triggered for ${user.username}`);
  }

  editUser(user: any) {
    this.formError.set(null); // Clear errors when switching modes
    this.isEditMode.set(true);
    this.editingUserId.set(user.id);
    this.username.set(user.username);
    this.email.set(user.email || '');
    this.firstName.set(user.firstName || '');
    this.lastName.set(user.lastName || '');
    this.enabled.set(user.enabled);
    this.emailVerified.set(user.emailVerified || false);
    this.password.set(''); // Never edit old password directly for security
    
    // Set roles
    this.selectedRoles.set(new Set(user.realmRoles || []));
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.editingUserId.set(null);
    this.username.set('');
    this.email.set('');
    this.firstName.set('');
    this.lastName.set('');
    this.password.set('');
    this.selectedRoles.set(new Set());
    this.formError.set(null); // Clear errors
  }

  async onSubmit() {
    const userData = {
      username: this.username(),
      email: this.email(),
      firstName: this.firstName(),
      lastName: this.lastName(),
      enabled: this.enabled(),
      emailVerified: this.emailVerified(), // CONTROLLED AUTHORITY GATE
      credentials: this.password() ? [{ type: 'password', value: this.password(), temporary: false }] : undefined
    };

    const rolesToAssign = Array.from(this.selectedRoles()).map(rn => 
      this.store.allRealmRoles().find(r => r.name === rn)
    ).filter(r => !!r) as any[];

    try {
      this.formError.set(null); // Clear previous breach logs
      if (this.isEditMode() && this.editingUserId()) {
        await this.store.updateUser(this.editingUserId()!, userData, rolesToAssign);
      } else {
        await this.store.createUser(userData, rolesToAssign);
      }
      
      // EXECUTIVE CLEARANCE: Only reset the gateway if the handshake succeeded
      this.cancelEdit();
    } catch (e: any) {
      // HANDSHAKE BREACH FEEDBACK: materialize exact error on screen
      this.formError.set(e?.error?.errorMessage || 'Handshake Breach: Identity Provisioning Rejected.');
      console.error('Provisioning BREACH detected', e);
    }
  }
}
