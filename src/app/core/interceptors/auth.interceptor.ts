import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = localStorage.getItem('auth_tokens');

  if (tokens) {
    const { accessToken } = JSON.parse(tokens);
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });
  }

  return next(req);
};
