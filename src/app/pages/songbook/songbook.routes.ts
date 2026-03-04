import { Routes } from '@angular/router';
import { SongbookListComponent } from './songbook-list.component';
import { SongbookComponent } from './songbook.component';
import { SongbookViewerComponent } from './songbook-viewer.component';

export default [
    {
        path: '',
        component: SongbookListComponent,
    },
    {
        path: 'create',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: ':uid/view',
        component: SongbookViewerComponent,
        data: {
            hideLayoutChrome: true,
        },
    },
    {
        path: ':uid',
        component: SongbookComponent,
    },
] as Routes;
