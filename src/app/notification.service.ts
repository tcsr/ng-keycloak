import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastId = 0;
  
  readonly toasts = signal<Toast[]>([]);
  readonly isLoading = signal(false);

  showToast(message: string, type: ToastType = 'info') {
    const id = ++this.toastId;
    const toast: Toast = { id, message, type };
    this.toasts.update(current => [...current, toast]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  success(message: string) { this.showToast(message, 'success'); }
  error(message: string) { this.showToast(message, 'error'); }
  warning(message: string) { this.showToast(message, 'warning'); }
  info(message: string) { this.showToast(message, 'info'); }

  removeToast(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  showLoader() { this.isLoading.set(true); }
  hideLoader() { this.isLoading.set(false); }
}
