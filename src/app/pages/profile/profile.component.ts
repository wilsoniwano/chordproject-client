import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { UserService } from 'app/core/user/user.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    templateUrl: './profile.component.html',
    imports: [AsyncPipe, MatButtonModule, MatIconModule, RouterLink, TranslocoModule],
})
export class ProfileComponent {
    readonly user$ = this._userService.user$;

    constructor(private _userService: UserService) {}
}
