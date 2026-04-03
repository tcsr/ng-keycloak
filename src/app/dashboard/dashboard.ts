import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppStore } from '../store/app.store';

// PrimeNG 21 Imports for Executive Dashboard
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, BadgeModule, RippleModule, TooltipModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  readonly store = inject(AppStore);
}
