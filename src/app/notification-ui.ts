import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './notification.service';
import { AppStore } from './store/app.store';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container p-4">
      @for (toast of notification.toasts(); track toast.id) {
        <div class="toast group relative overflow-hidden transition-all duration-300 hover:scale-102 flex items-center gap-4 bg-white border border-blue-100 p-6 rounded-[7px] shadow-2xl shadow-blue-100/50" 
             [class]="toast.type" (click)="notification.removeToast(toast.id)">
          <div class="status-edge absolute left-0 top-0 bottom-0 w-1.5 transition-colors" [class.bg-emerald-500]="toast.type === 'success'" [class.bg-red-500]="toast.type === 'error'" [class.bg-blue-500]="toast.type === 'info'" [class.bg-amber-500]="toast.type === 'warning'"></div>
          <span class="text-xl">{{ getIcon(toast.type) }}</span>
          <div class="flex flex-col">
             <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-1">{{ toast.type }} notification</span>
             <span class="text-[11px] font-black uppercase text-slate-900 tracking-tight leading-tight">{{ toast.message }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      z-index: 10000;
    }
  `]
})
export class ToasterComponent {
  readonly notification = inject(NotificationService);

  getIcon(type: string) {
    switch (type) {
      case 'success': return '🛡️';
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      default: return '🛡️';
    }
  }
}

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (store.isLoading()) {
      <div class="loader-overlay animate-in fade-in duration-300">
        <div class="flex flex-col items-center gap-8">
           <div class="spinner-vault relative w-20 h-20">
              <div class="absolute inset-0 border-4 border-slate-100 rounded-[7px]"></div>
              <div class="absolute inset-0 border-4 border-blue-600 rounded-[7px] border-t-transparent animate-spin"></div>
           </div>
           <div class="flex flex-col items-center">
              <span class="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 animate-pulse">Syncing Vault</span>
              <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Authority Identity Registry</span>
           </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    }
  `]
})
export class LoaderComponent {
  readonly store = inject(AppStore);
}
