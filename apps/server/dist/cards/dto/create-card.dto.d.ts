export declare const CARD_TYPES: readonly ["VIRTUAL", "PHYSICAL"];
export declare const CARD_STATUSES: readonly ["ACTIVE", "BLOCKED", "EXPIRED"];
export type CardType = (typeof CARD_TYPES)[number];
export type CardStatus = (typeof CARD_STATUSES)[number];
export declare class CreateCardDto {
    accountId: string;
    type?: CardType;
}
