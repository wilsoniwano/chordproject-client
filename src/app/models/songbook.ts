import { BaseDocument } from './base-document';

export class Songbook extends BaseDocument {
    name: string;
    leaderName: string;
    eventDate: string;
    order: string;
    parent: string;
    badgeText: string;
    isReorderable: boolean;
}
