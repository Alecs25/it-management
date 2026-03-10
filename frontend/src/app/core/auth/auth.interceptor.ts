import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { v4 as uuidv4 } from 'uuid';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Get current token
  const token = authService.getToken();

  // Clone request and add headers
  const clonedReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': uuidv4(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  return next(clonedReq);
};
