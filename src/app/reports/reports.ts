import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../store/app.store';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SessionIntelligenceComponent } from './session-intelligence/session-intelligence';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ChartModule, 
    TableModule, 
    ButtonModule, 
    TagModule, 
    TooltipModule,
    BadgeModule,
    InputTextModule,
    SessionIntelligenceComponent
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  readonly store = inject(AppStore);

  // ANALYTICAL KPI HUB
  enrolledCount = computed(() => this.store.users().length);
  lockedCount = computed(() => this.store.users().filter((u: any) => !u.enabled).length);
  pendingCount = computed(() => this.store.users().filter((u: any) => !u.emailVerified).length);

  // DYNAMIC ANALYTICAL COORDINATES (COMPUTED SIGNALS)
  identityData = computed(() => {
    const users = this.store.users();
    const enabledCount = users.filter((u: any) => u.enabled).length;
    const disabledCount = users.length - enabledCount;

    return {
      labels: ['Operational Clearance (Active)', 'Restricted Isolation (Inactive)'],
      datasets: [
        {
          data: [enabledCount, disabledCount],
          backgroundColor: ['#2563eb', '#ef4444'],
          hoverBackgroundColor: ['#1d4ed8', '#dc2626'],
          borderWidth: 0
        }
      ]
    };
  });

  healthData = computed(() => {
    const users = this.store.users();
    const verifiedCount = users.filter((u: any) => u.emailVerified).length;
    const pendingCount = users.length - verifiedCount;

    return {
      labels: ['Verified Identities', 'Identity Pending'],
      datasets: [
        {
          label: 'Provisioning Integrity',
          data: [verifiedCount, pendingCount, users.length],
          fill: true,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          tension: 0.4
        }
      ]
    };
  });

  anomalyData = computed(() => {
    const users = this.store.users();
    const active = users.filter((u: any) => u.enabled).length;
    const verified = users.filter((u: any) => u.emailVerified).length;
    const restricted = users.length - active;

    return {
      labels: ['Active Link', 'Verified Sync', 'Restricted Mode', 'Governance OK', 'Audit Ready'],
      datasets: [
        {
          label: 'Identity Threat Vectors',
          data: [active, verified, restricted, users.length, users.length * 0.9],
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          borderColor: '#2563eb',
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#2563eb'
        }
      ]
    };
  });

  chartOptions = signal<any>(null);
  radarOptions = signal<any>(null);

  ngOnInit() {
    this.initChartOptions();
    if (this.store.users().length === 0) {
      this.store.loadInitialData();
    }
  }

  initChartOptions() {
    const textColor = '#0f172a';
    const textColorSecondary = '#64748b';
    const surfaceBorder = '#e2e8f0';

    this.chartOptions.set({
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, font: { weight: 'bold', size: 10 } } }
      },
      scales: {
        x: { ticks: { color: textColorSecondary, font: { size: 9 } }, grid: { color: surfaceBorder, display: false } },
        y: { ticks: { color: textColorSecondary, font: { size: 9 } }, grid: { color: surfaceBorder } }
      }
    });

    this.radarOptions.set({
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          grid: { color: surfaceBorder },
          angleLines: { color: surfaceBorder },
          pointLabels: { color: textColorSecondary, font: { weight: 'bold', size: 9 } },
          ticks: { display: false }
        }
      }
    });
  }

  // Date helper for Identity Registry
  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  exportExcel() {
    const data = this.store.users().map((u: any) => ({
      'Identity ID': u.id,
      'Username': u.username,
      'Full Name': `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
      'Email': u.email || 'N/A',
      'Status': u.enabled ? 'ACTIVE' : 'LOCKED',
      'Verified': u.emailVerified ? 'YES' : 'PENDING'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IdentityRegistry');
    XLSX.writeFile(workbook, 'Authority_Vault_Identity_Registry.xlsx');
  }

  exportPdf() {
    const doc = new jsPDF('l', 'mm', 'a4');
    const head = [['Identity ID', 'Full Name', 'Email', 'Status', 'Verified']];
    const body = this.store.users().map((u: any) => [
      u.id.substring(0, 8) + '...',
      `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
      u.email || 'N/A',
      u.enabled ? 'ACTIVE' : 'LOCKED',
      u.emailVerified ? 'VERIFIED' : 'PENDING'
    ]);

    (doc as any).autoTable({
      head: head,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      margin: { top: 25 },
      didDrawPage: (data: any) => {
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text('Authority Vault: Identity Registry Audit', data.settings.margin.left, 15);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${new Date().toLocaleString()}`, data.settings.margin.left, 20);
      }
    });

    doc.save('Authority_Vault_Identity_Audit.pdf');
  }
}
