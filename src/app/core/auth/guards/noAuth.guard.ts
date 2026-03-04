import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { getNoAuthGuardTarget } from 'application/auth/guard.usecase';
import { AuthService } from 'app/core/firebase/auth/auth.service';
import { filter, map, Observable, switchMap, take } from 'rxjs';

export const NoAuthGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authReady$.pipe(
        filter(Boolean),
        take(1),
        switchMap(() => authService.authenticated$.pipe(take(1))),
        map((authenticated) => {
            const target = getNoAuthGuardTarget(authenticated);
            if (target !== true) {
                return router.parseUrl(target);
            }
            return true;
        })
    );
};
