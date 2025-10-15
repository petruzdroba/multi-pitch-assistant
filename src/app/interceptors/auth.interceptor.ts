import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import { Preferences } from '@capacitor/preferences';


export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  return from(Preferences.get({ key: 'accessToken' })).pipe(
    switchMap(({ value: token }) => {
      if (token) {
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(cloned);
      }
      return next(req);
    })
  );
};
