import { Component, inject, signal, HostListener, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AppStore } from './store/app.store';
import { LoaderComponent, ToasterComponent } from './notification-ui';
import { ButtonModule } from 'primeng/button';
import { ScrollTopModule } from 'primeng/scrolltop';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LoaderComponent, ToasterComponent, ButtonModule, ScrollTopModule, TooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  readonly store = inject(AppStore);
  private router = inject(Router);

  @ViewChild('userContext') userContext!: ElementRef;
  @ViewChild('mobileContext') mobileContext!: ElementRef;

  ngOnInit() {
    if (this.authenticated()) {
      // IDENTITY PERSISTENCE HANDSHAKE: Correct redirection for account switches
      const lastIdentity = localStorage.getItem('last_vault_session_identity');
      const currentIdentity = this.store.username();

      if (lastIdentity && lastIdentity !== currentIdentity) {
        this.router.navigate(['/dashboard']);
      }
      // ALWAYS CLEAR ARCHIVE AFTER THE CHECK
      localStorage.removeItem('last_vault_session_identity');

      this.store.loadInitialData(); // Global Sync only if session active
    }

    // VAULT PULSE: Re-sync every 120 seconds (background heartbeat)
    // This maintains near real-time intelligence for the command center wall
    setInterval(() => {
       if (this.authenticated() && !this.store.isLoading()) {
          this.store.loadInitialData(true); 
       }
    }, 120000);
  }
  private eRef = inject(ElementRef);
  
  isMenuOpen = signal(false);
  showUserPanel = signal(false);

  // Authentication Context
  authenticated = this.store.authenticated;
  username = this.store.username;
  fullName = this.store.fullName;
  avatarInitials = this.store.avatarInitials;
  email = this.store.email;
  userRoles = this.store.userRoles;
  allRealmRoles = this.store.allRealmRoles;
  modulePermissions = this.store.modulePermissions;

  // PRECISION GLOBAL CLICK LISTENER
  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // IDENTITY PANEL RETRACTION
    if (this.showUserPanel() && !this.userContext?.nativeElement.contains(target)) {
      this.showUserPanel.set(false);
    }

    // MOBILE MENU RETRACTION
    if (this.isMenuOpen() && !this.mobileContext?.nativeElement.contains(target)) {
      this.isMenuOpen.set(false);
    }
  }

  checkModuleAccess(moduleName: string): boolean {
    const allowedRoles = this.modulePermissions()[moduleName] || [];
    const userRoleList = this.userRoles();
    return allowedRoles.some(role => userRoleList.includes(role));
  }

  toggleMenu(event: MouseEvent) {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  toggleUserPanel(event: MouseEvent) {
    this.showUserPanel.update(v => !v);
  }

  hasAccess(roles: string[]): boolean {
    const userRoles = this.userRoles();
    return roles.some(role => userRoles.includes(role));
  }

  login() {
    this.store.login();
  }

  logout() {
    this.store.logout();
  }
}
