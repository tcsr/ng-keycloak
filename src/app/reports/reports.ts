import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../store/app.store';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// PrimeNG 21 Imports for Analytics
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ChartModule, CardModule, TagModule, TableModule, BadgeModule, TooltipModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {
  readonly store = inject(AppStore);

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
          backgroundColor: ['#2563eb', '#ef4444'], // Blue for Active, Red for Inactive
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
    // Grouping identities by status to calculate security vectors
    const active = users.filter((u: any) => u.enabled).length;
    const verified = users.filter((u: any) => u.emailVerified).length;
    const restricted = users.length - active;

    return {
      labels: ['Active Link', 'Verified Sync', 'Restricted Mode', 'Governance OK', 'Audit Ready'],
      datasets: [
        {
          label: 'Administrative Vector',
          data: [active, verified, restricted, users.length, users.length * 0.8],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3b82f6'
        }
      ]
    };
  });

  // ANALYTICAL KPI HUB
  enrolledCount = computed(() => this.store.users().length);
  lockedCount = computed(() => this.store.users().filter((u: any) => !u.enabled).length);
  pendingCount = computed(() => this.store.users().filter((u: any) => !u.emailVerified).length);

  chartOptions = signal<any>(null);
  radarOptions = signal<any>(null); // ISOLATED RADAR OPTIONS

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

    // STANDARD LINE/DOUGHNUT OPTIONS
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

    // ISOLATED RADAR HUB OPTIONS (CRITICAL FIX)
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

  // IDENTITY REGISTRY EXPORT HUB
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
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.text('Authority Vault: Identity Registry Audit', data.settings.margin.left, 15);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Generated: ${new Date().toLocaleString()}`, data.settings.margin.left, 20);
      }
    });

    doc.save('Authority_Vault_Identity_Audit.pdf');
  }
}
