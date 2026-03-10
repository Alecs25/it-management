import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800">
              IT Credential Management
            </h1>
            <button
              (click)="onLogout()"
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        @if (user$ | async as user) {
          <div class="bg-white rounded-lg shadow p-8">
            <h2 class="text-3xl font-bold mb-4">Welcome, {{ user.email }}!</h2>
            <p class="text-gray-600 mb-4">Role: <span class="font-semibold capitalize">{{ user.role }}</span></p>
            
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 class="text-lg font-bold mb-2">Clients</h3>
                <p class="text-gray-600">Manage your client accounts</p>
              </div>
              
              <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 class="text-lg font-bold mb-2">Credentials</h3>
                <p class="text-gray-600">View and manage credentials securely</p>
              </div>
              
              <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 class="text-lg font-bold mb-2">Devices</h3>
                <p class="text-gray-600">View devices and sites</p>
              </div>
            </div>

            <div class="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p class="text-sm text-gray-700">
                🔒 <strong>Security Notice:</strong> This application is ISO 27001 compliant. 
                All credentials are encrypted and audited. Do not share your login credentials.
              </p>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  user$ = this.authService.user$;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
