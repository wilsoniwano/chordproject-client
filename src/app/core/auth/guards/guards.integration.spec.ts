// @vitest-environment jsdom
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthService } from 'app/core/firebase/auth/auth.service';
import { AuthGuard } from './auth.guard';
import { NoAuthGuard } from './noAuth.guard';

@Component({
    selector: 'test-page',
    standalone: true,
    template: '<div>page</div>',
})
class TestPageComponent {}

describe('guards integration', () => {
    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('redirects unauthenticated users away from protected route', async () => {
        const authenticated$ = new BehaviorSubject(false);
        const authReady$ = new BehaviorSubject(true);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'sign-in', component: TestPageComponent },
                    { path: 'protected', component: TestPageComponent, canActivate: [AuthGuard] },
                ]),
                { provide: AuthService, useValue: { authenticated$, authReady$ } },
            ],
        });

        const harness = await RouterTestingHarness.create('/protected');
        expect(TestBed.inject(Router).url).toContain('/sign-in');
        expect(harness.routeNativeElement?.textContent).toContain('page');
    });

    it('redirects authenticated users away from guest route', async () => {
        const authenticated$ = new BehaviorSubject(true);
        const authReady$ = new BehaviorSubject(true);

        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: 'songbook', component: TestPageComponent },
                    { path: 'sign-in', component: TestPageComponent, canActivate: [NoAuthGuard] },
                ]),
                { provide: AuthService, useValue: { authenticated$, authReady$ } },
            ],
        });

        await RouterTestingHarness.create('/sign-in');
        expect(TestBed.inject(Router).url).toContain('/songbook');
    });
});
