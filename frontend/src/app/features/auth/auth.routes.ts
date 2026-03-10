import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MFAEnrollmentComponent } from './mfa-enrollment/mfa-enrollment.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'mfa-enroll', component: MFAEnrollmentComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
