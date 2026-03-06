import { Injectable } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DeleteConfirmationService {
    constructor(private _confirmationService: FuseConfirmationService) {}

    confirmDelete(itemName?: string): Observable<boolean> {
        const normalizedName = (itemName || '').trim();
        const message = normalizedName
            ? `Tem certeza que deseja excluir "${normalizedName}"? Essa ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.';

        return this._confirmationService
            .open({
                title: 'Confirmar exclusão',
                message,
                actions: {
                    confirm: {
                        label: 'Excluir',
                    },
                    cancel: {
                        label: 'Cancelar',
                    },
                },
            })
            .afterClosed()
            .pipe(map((result) => result === 'confirmed'));
    }
}
