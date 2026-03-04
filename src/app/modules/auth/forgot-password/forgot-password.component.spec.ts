// @vitest-environment jsdom
import '@angular/compiler';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

describe('AuthForgotPasswordComponent', () => {
    let AuthForgotPasswordComponentClass: any;
    let component: any;
    let formBuilder: any;
    let authService: any;

    beforeAll(async () => {
        const module = await import('./forgot-password.component');
        AuthForgotPasswordComponentClass = module.AuthForgotPasswordComponent;
    });

    beforeEach(() => {
        formBuilder = {
            group: vi.fn((value: any) => ({
                controls: {
                    email: value.email,
                },
                get: (key: string) => ({
                    value: key === 'email' ? 'user@test.com' : '',
                    hasError: () => false,
                }),
                invalid: false,
                disabled: false,
                disable: vi.fn(function () {
                    this.disabled = true;
                }),
                enable: vi.fn(function () {
                    this.disabled = false;
                }),
            })),
        };

        authService = {
            forgotPassword: vi.fn().mockReturnValue(of(void 0)),
        };

        component = new AuthForgotPasswordComponentClass(formBuilder, authService);
        component.ngOnInit();
    });

    it('shows success alert when reset link is sent', () => {
        component.sendResetLink();

        expect(authService.forgotPassword).toHaveBeenCalledWith('user@test.com');
        expect(component.showAlert).toBe(true);
        expect(component.alert.type).toBe('success');
    });

    it('shows error alert when reset fails', () => {
        authService.forgotPassword.mockReturnValue(throwError(() => new Error('fail')));

        component.sendResetLink();

        expect(component.showAlert).toBe(true);
        expect(component.alert.type).toBe('error');
        expect(component.alert.message).toContain('fail');
    });
});
