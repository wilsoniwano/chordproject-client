import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { getAuthGuardRedirectUrl } from 'application/auth/guard.usecase';
import { AuthService } from 'app/core/firebase/auth/auth.service';
import { filter, of, switchMap, take } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const authService = inject(AuthService);

    // Check the authentication status
    return authService.authReady$.pipe(
        filter(Boolean),
        take(1),
        switchMap(() => authService.authenticated$.pipe(take(1))),
        switchMap((authenticated) => {
            const target = getAuthGuardRedirectUrl(state.url, authenticated);
            if (target !== true) {
                return of(router.parseUrl(target));
            }

            // Allow the access
            return of(true);
        })
    );
};
