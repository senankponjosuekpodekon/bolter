import { CardsService, Card } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
export declare class CardsController {
    private readonly cardsService;
    constructor(cardsService: CardsService);
    getAllCards(req: any): Promise<Card[]>;
    getCardsByAccount(req: any, accountId: string): Promise<Card[]>;
    getCard(req: any, id: string): Promise<Card>;
    createCard(req: any, createCardDto: CreateCardDto): Promise<Card>;
    createCardAsAdmin(req: any, userId: string, accountId: string, createCardDto: CreateCardDto): Promise<Card>;
    updateCard(req: any, id: string, updateCardDto: UpdateCardDto): Promise<Card>;
    deleteCard(req: any, id: string): Promise<void>;
}
