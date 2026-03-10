import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginResponse {
  token: string;
  requiresMFA: boolean;
  message: string;
}

export interface MFAVerifyResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  message: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'readonly';
  mfa: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenSignal = signal<string | null>(localStorage.getItem('auth_token'));
  private userSignal = signal<JWTPayload | null>(this.parseToken(localStorage.getItem('auth_token')));

  public token$ = this.tokenSignal.asReadonly();
  public user$ = this.userSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Register new user
   */
  public register(email: string, password: string, firstName?: string, lastName?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      email,
      password,
      firstName,
      lastName,
    });
  }

  /**
   * Login user (step 1: password only)
   */
  public login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email,
      password,
    });
  }

  /**
   * Verify MFA code (step 2: TOTP verification)
   */
  public verifyMFA(token: string, code: string): Observable<MFAVerifyResponse> {
    return this.http.post<MFAVerifyResponse>(`${this.apiUrl}/mfa/verify`, {
      token,
      code,
    }).pipe(
      tap((response) => {
        this.setToken(response.token);
      })
    );
  }

  /**
   * Enroll in MFA (get QR code)
   */
  public enrollMFA(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mfa/enroll`, { email });
  }

  /**
   * Confirm MFA enrollment (verify TOTP code)
   */
  public confirmMFAEnroll(secret: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mfa/enroll-confirm`, {
      secret,
      code,
    });
  }

  /**
   * Refresh JWT token before expiration
   */
  public refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {
      refreshToken,
    }).pipe(
      tap((response) => {
        this.setToken(response.token);
      })
    );
  }

  /**
   * Logout user
   */
  public logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearToken();
      })
    );
  }

  /**
   * Set token and update signals
   */
  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.tokenSignal.set(token);

    const payload = this.parseToken(token);
    this.userSignal.set(payload);
  }

  /**
   * Clear token and user
   */
  private clearToken(): void {
    localStorage.removeItem('auth_token');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  /**
   * Get current token
   */
  public getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Get current user
   */
  public getUser(): JWTPayload | null {
    return this.userSignal();
  }

  /**
   * Check if authenticated (with MFA)
   */
  public isAuthenticated(): boolean {
    const user = this.userSignal();
    return !!user && user.mfa === true;
  }

  /**
   * Parse JWT payload (simple base64 decode, no verification on client-side)
   */
  private parseToken(token: string | null): JWTPayload | null {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload as JWTPayload;
    } catch {
      return null;
    }
  }
}
