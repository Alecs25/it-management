import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';

@Component({
  selector: 'app-mfa-enrollment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 class="text-2xl font-bold mb-4 text-center text-gray-800">
          Two-Factor Authentication
        </h1>
        <p class="text-gray-600 text-center mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        <form [formGroup]="mfaForm" (ngSubmit)="onSubmit()">
          <!-- MFA Code Field -->
          <div class="mb-6">
            <label for="code" class="block text-gray-700 font-semibold mb-2">
              Authenticator Code
            </label>
            <input
              type="text"
              id="code"
              formControlName="code"
              maxlength="6"
              inputmode="numeric"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000000"
            />
            @if (mfaForm.get('code')?.hasError('required') && 
                 mfaForm.get('code')?.touched) {
              <p class="text-red-500 text-sm mt-1">Code is required</p>
            }
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {{ errorMessage() }}
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isLoading() || mfaForm.invalid"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"
          >
            {{ isLoading() ? 'Verifying...' : 'Verify' }}
          </button>
        </form>

        <!-- Help Text -->
        <p class="text-center text-gray-600 text-sm mt-6">
          Don't have authenticator app? <a href="#" class="text-blue-500 hover:underline">Setup 2FA</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./mfa-enrollment.component.scss'],
})
export class MFAEnrollmentComponent implements OnInit {
  mfaForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  private token: string | null = null;
  private email: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.mfaForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit(): void {
    // Get token and email from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state;

    if (state?.token && state?.email) {
      this.token = state.token;
      this.email = state.email;
    } else {
      // Redirect to login if no state
      this.router.navigate(['/auth/login']);
    }
  }

  onSubmit(): void {
    if (!this.mfaForm.valid || !this.token) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { code } = this.mfaForm.value;

    this.authService.verifyMFA(this.token, code).subscribe({
      next: (response) => {
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'MFA verification failed');
      },
    });
  }
}
