import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center p-6">
      <div class="max-w-md w-full bg-white border border-slate-200 rounded-[20px] shadow-2xl shadow-slate-200/50 overflow-hidden relative">
        <!-- Security Header Overlay -->
        <div class="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
           <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <i class="pi pi-shield text-red-600 text-3xl"></i>
           </div>
           <h1 class="text-2xl font-black uppercase tracking-tighter text-red-900 leading-none">Access Restricted</h1>
           <p class="text-[10px] font-bold text-red-600/60 uppercase tracking-widest mt-2">Security Level: Execution Only</p>
        </div>

        <div class="p-8 text-center">
          <div class="space-y-4">
            <p class="text-slate-600 text-sm leading-relaxed">
              Vault Protocol **ACL-403** has been triggered. Your current identity credentials do not hold the required clearace to access this restricted administrative module.
            </p>
            
            <div class="bg-slate-50 rounded-[12px] p-4 border border-slate-100 text-left">
               <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Authorization Details</p>
               <p class="text-[11px] text-slate-500 font-mono italic">Handshake failed: Insufficient role hierarchy detected.</p>
            </div>
          </div>

          <div class="mt-8">
            <button pButton 
                    label="Return to Command Center" 
                    icon="pi pi-home" 
                    routerLink="/dashboard"
                    class="p-button-outlined p-button-danger w-full !rounded-[10px] !font-black !text-[12px] !uppercase !tracking-widest">
            </button>
          </div>
        </div>

        <!-- Geometric Accents -->
        <div class="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-slate-500/5 rounded-full -ml-16 -mb-16"></div>
      </div>
    </div>
  `
})
export class AccessDeniedComponent {}
