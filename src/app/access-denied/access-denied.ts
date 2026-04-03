import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="access-denied-container">
      <div class="card">
        <div class="icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Sorry, you do not have the required <strong>admin</strong> role to view this page. Please contact your system administrator if you believe this is an error.</p>
        <button routerLink="/dashboard" class="back-btn">Back to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
      padding: 2rem;
    }
    .card {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      text-align: center;
      max-width: 500px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      color: #e53e3e;
      margin-bottom: 1rem;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .back-btn {
      background: #3182ce;
      color: white;
      border: none;
      padding: 0.8rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: #2b6cb0;
    }
  `]
})
export class AccessDeniedComponent {}
