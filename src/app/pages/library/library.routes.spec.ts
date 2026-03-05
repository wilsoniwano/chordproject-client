// @vitest-environment jsdom
import '@angular/compiler';
import { ParamMap } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { canDeactivateSongsDetails } from './library.routes';

type RouteNode = {
    paramMap: ParamMap;
    children: RouteNode[];
};

const createRouteNode = (uid?: string, children: RouteNode[] = []): RouteNode =>
    ({
        paramMap: {
            get: (key: string) => (key === 'uid' ? uid ?? null : null),
        } as ParamMap,
        children,
    }) as RouteNode;

describe('library canDeactivateSongsDetails', () => {
    it('keeps drawer open when next state still has uid in any outlet', () => {
        const closeDrawer = vi.fn();
        const component = { closeDrawer } as any;

        const nextState = {
            root: createRouteNode(undefined, [
                createRouteNode(undefined),
                createRouteNode(undefined, [createRouteNode('song-2')]),
            ]),
        } as any;

        const result = canDeactivateSongsDetails(component, {} as any, {} as any, nextState);

        expect(result).toBe(true);
        expect(closeDrawer).not.toHaveBeenCalled();
    });

    it('closes drawer when next state has no uid', async () => {
        const closeDrawer = vi.fn().mockResolvedValue(true);
        const component = { closeDrawer } as any;

        const nextState = {
            root: createRouteNode(undefined, [createRouteNode(undefined)]),
        } as any;

        const result = canDeactivateSongsDetails(component, {} as any, {} as any, nextState);

        await expect(result).resolves.toBe(true);
        expect(closeDrawer).toHaveBeenCalledOnce();
    });
});
