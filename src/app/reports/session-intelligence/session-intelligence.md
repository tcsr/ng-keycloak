# Session Intelligence: Implementation Blueprint

This guide details the architecture and logic required to implement the **Session Intelligence** module—a high-performance authentication flow auditor—into an Angular application.

## 1. Prerequisites & Dependencies

To support the advanced reporting and UI features, the following libraries are required:

### UI & Styling
- **PrimeNG:** `p-datepicker`, `p-table`, `p-tag`, `p-tooltip`, `p-inputtext`.
- **Tailwind CSS:** For layout, spacing, and glass-morphism effects.
- **PrimeIcons:** For action and status indicators.

### Data Engines
- **XLSX (SheetJS):** For generating binary Excel workbooks.
- **jsPDF & jspdf-autotable:** For generating structured, full-width landscape audit reports.

---

## 2. Keycloak Configuration

The module relies on Keycloak's event-tracking system. Ensure the following are active in the target Realm:

1. **Events Toggling:** Go to `Realm Settings` -> `Events` and set **Save Events** to `ON`.
2. **Event Types:** Ensure `LOGIN`, `LOGOUT`, `CODE_TO_TOKEN`, and `REFRESH_TOKEN` are tracked.
3. **IAM Roles:** The calling application user must possess the `view-events` and `view-users` roles from the `realm-management` client.

---

## 3. API Integration (Keycloak Admin REST)

To fetch the raw audit data, the module communicates with the Keycloak Admin API. Below is the technical specification of the integration:

### Endpoint Structure
```bash
GET {authServerUrl}/admin/realms/{realm}/events
```

### Critical Query Parameters
- **`type`**: Must be repeated for multiple events (e.g., `?type=LOGIN&type=LOGOUT`).
- **`dateFrom`**: Start date in `YYYY-MM-DD` format.
- **`dateTo`**: End date in `YYYY-MM-DD` format.
- **`first`**: Pagination offset.
- **`max`**: Result limit (e.g., 100-200 recommended).

### Implementation Snippet (KeycloakAdminService)
```typescript
async getLoginEvents(dateFrom: string, dateTo: string, first = 0, maxResults = 100) {
  const url = `${baseUrl}/admin/realms/${realm}/events?type=LOGIN&type=LOGOUT&dateFrom=${dateFrom}&dateTo=${dateTo}&first=${first}&max=${maxResults}`;
  const headers = { 'Authorization': `Bearer ${token}` };
  return await firstValueFrom(this.http.get<any[]>(url, { headers }));
}
```

---

## 4. The Logical Engine (The "Grouping" Strategy)

Keycloak provides flat logs (one entry per event). The "Intelligence" lies in grouping these by `sessionId`.

### A. The State Pipeline
- **Signals:** Use Angular Signals (`signal`, `computed`, `effect`) for a reactive, zoneless-ready UI.
- **Temporal Sync:** Format dates using local time parts (`getFullYear`, etc.) to prevent Timezone Drift when sending to the Keycloak API.

### B. Session Aggregation Logic
1. Iterate through raw events.
2. Group by `sessionId` using a `Map`.
3. Capture the `LOGIN` event time as the start.
4. Capture the `LOGOUT` event time as the end.
5. **Identity Resolution:** Perform a local memory lookup against the `users` list to map `username` -> `fullName`.
6. **Duration Calculation:** 
   - If `logoutTime` exists: `Logout - Login`.
   - If `logoutTime` is missing: Set status to `ACTIVE` and use a 30-second heartbeat timer to update "Active Now" duration.

---

## 4. UI Components Architecture

### KPI Filtering
Implement KPI cards that set a `statusFilter` signal. Use a `computed` signal to filter the table data based on this selection + the search text input.

### Search Context
Use a `relative` container for the search input. Implement a "Clear" icon that resets the `filterText` signal only when content is present.

### Glass-Morphism Loading
Use a `fixed` or `absolute` overlay with `backdrop-blur` and `bg-white/20`. Bind its visibility to the `loading` state of your data store.

---

## 5. Professional PDF Export Config

To achieve a clean audit report, use `jspdf-autotable` with these specific settings:

```typescript
(doc as any).autoTable({
  theme: 'grid',
  tableWidth: 'auto',
  styles: { 
    fontSize: 8, 
    overflow: 'linebreak', // Crucial for long names
    cellPadding: 4 
  },
  columnStyles: {
    0: { cellWidth: 'auto' }, // Full Name expands
    1: { cellWidth: 'auto' }, // Username expands
    // Fixed widths for technical data
    2: { cellWidth: 30 }, // IP
    5: { cellWidth: 25 }, // Duration
  },
  margin: { top: 25, left: 15, right: 15 }
});
```

---

## 6. Maintenance & Performance
- **Heartbeat Cleanup:** Always implement `ngOnDestroy` to clear the `setInterval` used for real-time duration updates.
- **Memoization:** Use `computed` signals for filtering to ensure that typing in the search bar does not trigger a full re-process of the session grouping logic.
