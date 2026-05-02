import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../store/app.store';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-session-intelligence',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DatePickerModule, 
    InputTextModule, 
    TableModule, 
    TagModule, 
    TooltipModule
  ],
  templateUrl: './session-intelligence.html',
  styleUrls: ['./session-intelligence.css']
})
export class SessionIntelligenceComponent implements OnInit {
  readonly store = inject(AppStore);
  private heartbeatInterval: any;
  private refreshTrigger = signal<number>(Date.now());

  // AUTHENTICATION FLOW SIGNALS
  dateFrom = signal<Date>(this.getDefaultDateFrom());
  dateTo = signal<Date>(this.getDefaultDateTo());
  maxAllowedDate = new Date();
  filterText = signal<string>('');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');

  constructor() {
    // DECLARATIVE SYNC: Automatically fetch data when temporal signals change
    effect(() => {
      const fromDate = this.dateFrom();
      const toDate = this.dateTo();
      
      if (fromDate && toDate) {
        const fromStr = `${fromDate.getFullYear()}-${fromDate.getMonth()}-${fromDate.getDate()}`;
        const toStr = `${toDate.getFullYear()}-${toDate.getMonth()}-${toDate.getDate()}`;
        
        // Memoization Guard: Only fetch if the actual day has shifted
        const currentRange = `${fromStr}_${toStr}`;
        if (this.lastFetchedRange !== currentRange) {
          this.lastFetchedRange = currentRange;
          console.log(`[Vault] Temporal shift detected: ${fromStr} -> ${toStr}`);
          this.fetchLoginEvents();
        }
      }
    }, { allowSignalWrites: true });
  }
  private lastFetchedRange = '';

  // REACTIVE DATA PIPELINES (RESTORED SESSION GROUPING)
  processedSessions = computed(() => {
    this.refreshTrigger(); // Dependency to trigger re-computation
    const events = this.store.loginEvents();
    if (!events || events.length === 0) return [];

    const sessionsMap = new Map<string, any>();

    events.forEach((event: any) => {
      const sessionId = event.sessionId;
      if (!sessionId) return;

      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          sessionId,
          username: event.details?.username || 'System/Service',
          ipAddress: event.ipAddress,
          loginTime: null,
          logoutTime: null,
          duration: 'Active now',
          client: event.clientId || 'N/A',
          status: 'ACTIVE'
        });
      }

      const session = sessionsMap.get(sessionId);
      
      // Update username if found in any event of this session
      if (event.details?.username) {
        session.username = event.details.username;
      }

      if (event.type === 'LOGIN') {
        session.loginTime = event.time;
      } else if (event.type === 'LOGOUT') {
        session.logoutTime = event.time;
        session.status = 'ENDED';
      }
    });

    const users = this.store.users();
    const userMap = new Map(users.map(u => [u.username.toLowerCase(), u]));

    return Array.from(sessionsMap.values()).map(session => {
      // Identity Enrichment: Lookup full name from the users list
      const identity = userMap.get(session.username.toLowerCase());
      if (identity) {
        const full = `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
        session.fullName = full || session.username;
      } else {
        session.fullName = session.username;
      }

      if (session.loginTime && session.logoutTime) {
        const diffMs = session.logoutTime - session.loginTime;
        session.duration = this.formatDuration(diffMs);
      } else if (session.loginTime) {
        const diffMs = Date.now() - session.loginTime;
        session.duration = this.formatDuration(diffMs);
      }
      return session;
    }).sort((a, b) => (b.loginTime || 0) - (a.loginTime || 0));
  });

  filteredSessions = computed(() => {
    let sessions = this.processedSessions();
    const query = this.filterText().toLowerCase();
    const status = this.statusFilter();

    if (status !== 'ALL') {
      sessions = sessions.filter(s => s.status === status);
    }

    if (!query) return sessions;
    return sessions.filter(s => 
      s.username.toLowerCase().includes(query) ||
      s.ipAddress.toLowerCase().includes(query) ||
      s.client.toLowerCase().includes(query)
    );
  });

  sessionStats = computed(() => {
    const sessions = this.processedSessions();
    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'ACTIVE').length,
      uniqueUsers: new Set(sessions.map(s => s.username)).size
    };
  });

  ngOnInit() {
    // Heartbeat: Refresh durations every 30 seconds for active sessions
    this.heartbeatInterval = setInterval(() => {
      this.refreshTrigger.set(Date.now());
    }, 30000);
  }
  toggleStatusFilter(status: 'ALL' | 'ACTIVE' | 'ENDED') {
    if (this.statusFilter() === status) {
      this.statusFilter.set('ALL');
    } else {
      this.statusFilter.set(status);
    }
  }

  ngOnDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  private getDefaultDateFrom(): Date {
    const now = new Date();
    const past = new Date(now);
    past.setDate(now.getDate() - 30);
    return past;
  }

  private getDefaultDateTo(): Date {
    return new Date();
  }

  fetchLoginEvents() {
    const fromDate = this.dateFrom();
    const toDate = this.dateTo();

    if (!fromDate || !toDate) return;

    // LOCAL-AWARE FORMATTING: Ensure we send yyyy-MM-dd based on the UI selection, not UTC
    const formatLocal = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const from = formatLocal(fromDate);
    const to = formatLocal(toDate);

    this.store.fetchLoginEvents(from, to, 0, 200);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).substring(2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return 'Invalid Date';
    }
  }

  formatDuration(ms: number): string {
    if (ms < 0) return '0s';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  exportLoginEventsExcel() {
    const data = this.processedSessions().map((session: any) => ({
      'Full Name': session.fullName,
      'Username': session.username,
      'IP Address': session.ipAddress,
      'Login Time': this.formatDate(session.loginTime),
      'Logout Time': this.formatDate(session.logoutTime),
      'Duration': session.duration,
      'Status': session.status,
      'Client': session.client
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UserSessions');
    XLSX.writeFile(workbook, 'User_Sessions_Report.xlsx');
  }

  exportLoginEventsPdf() {
    const doc = new jsPDF('l', 'mm', 'a4');
    const head = [['Full Name', 'Username', 'IP Address', 'Login Time', 'Logout Time', 'Duration', 'Status']];
    const body = this.processedSessions().map((session: any) => [
      session.fullName,
      session.username,
      session.ipAddress,
      this.formatDate(session.loginTime),
      this.formatDate(session.logoutTime),
      session.duration,
      session.status
    ]);
    (doc as any).autoTable({
      head: head,
      body: body,
      theme: 'grid',
      tableWidth: 'auto', // Spans full width of the page
      styles: { 
        fontSize: 8, 
        font: 'helvetica',
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Full Name (Expands)
        1: { cellWidth: 'auto' }, // Username (Expands)
        2: { cellWidth: 30 },     // IP Address
        3: { cellWidth: 40 },     // Login Time
        4: { cellWidth: 40 },     // Logout Time
        5: { cellWidth: 25 },     // Duration
        6: { cellWidth: 25 }      // Status
      },
      headStyles: { 
        fillColor: [37, 99, 235], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 9
      },
      margin: { top: 25, left: 15, right: 15 },
      didDrawPage: (data: any) => {
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text('Session Intelligence Audit Report', data.settings.margin.left, 15);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${new Date().toLocaleString()} | Realm: keycloak | System: Authority Vault`, data.settings.margin.left, 21);
      }
    });
    doc.save('Login_Events_Report.pdf');
  }
}
