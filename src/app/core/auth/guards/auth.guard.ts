import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { getAuthGuardRedirectUrl } from 'application/auth/guard.usecase';
import { AuthService } from 'app/core/firebase/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(AuthService).authenticated$.pipe(
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
