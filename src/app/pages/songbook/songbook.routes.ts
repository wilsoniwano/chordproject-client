import { Routes } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { SongbookCreateComponent } from './songbook-create.component';
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
        component: SongbookCreateComponent,
        canActivate: [AuthGuard],
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
