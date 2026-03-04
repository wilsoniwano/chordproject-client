export function getAuthGuardRedirectUrl(url: string, authenticated: boolean): true | string {
    if (authenticated) {
        return true;
    }

    const redirectURL = url === '/sign-out' ? '' : `redirectURL=${url}`;
    return `sign-in?${redirectURL}`;
}

export function getNoAuthGuardTarget(authenticated: boolean): true | string {
    return authenticated ? '/home' : true;
}

