import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
export declare class CardsController {
    private readonly cardsService;
    constructor(cardsService: CardsService);
    getAllCards(req: any): Promise<import("./cards.service").Card[]>;
    getCardsByAccount(accountId: string): Promise<import("./cards.service").Card[]>;
    getCard(id: string): Promise<import("./cards.service").Card>;
    createCard(req: any, createCardDto: CreateCardDto): Promise<import("./cards.service").Card>;
    createCardAsAdmin(req: any, userId: string, accountId: string, createCardDto: CreateCardDto): Promise<import("./cards.service").Card>;
    updateCard(req: any, id: string, updateCardDto: UpdateCardDto): Promise<import("./cards.service").Card>;
    deleteCard(req: any, id: string): Promise<void>;
}
