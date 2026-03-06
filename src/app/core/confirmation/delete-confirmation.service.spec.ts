import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DeleteConfirmationService } from './delete-confirmation.service';

describe('DeleteConfirmationService', () => {
    it('opens confirmation with item name and maps confirmed result', async () => {
        const afterClosed = vi.fn().mockReturnValue(of('confirmed'));
        const open = vi.fn().mockReturnValue({ afterClosed });
        const service = new DeleteConfirmationService({ open } as any);

        const result = await new Promise<boolean>((resolve) => {
            service.confirmDelete('Música A').subscribe((value) => resolve(value));
        });

        expect(result).toBe(true);
        expect(open).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Confirmar exclusão',
                message: 'Tem certeza que deseja excluir "Música A"? Essa ação não pode ser desfeita.',
            })
        );
    });

    it('uses fallback message when no item name is provided', async () => {
        const afterClosed = vi.fn().mockReturnValue(of('canceled'));
        const open = vi.fn().mockReturnValue({ afterClosed });
        const service = new DeleteConfirmationService({ open } as any);

        const result = await new Promise<boolean>((resolve) => {
            service.confirmDelete().subscribe((value) => resolve(value));
        });

        expect(result).toBe(false);
        expect(open).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.',
            })
        );
    });
});
