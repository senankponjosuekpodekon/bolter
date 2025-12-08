import { ExchangeService } from './exchange.service';
import { ConversionRequestDto } from './dto/conversion-request.dto';
import { ConversionResponseDto } from './dto/conversion-response.dto';
export declare class ExchangeController {
    private readonly exchangeService;
    constructor(exchangeService: ExchangeService);
    getRates(baseCurrency?: string): Promise<Record<string, number>>;
    convert(request: ConversionRequestDto): Promise<ConversionResponseDto>;
    getSupportedCurrencies(): Promise<string[]>;
    getRate(from: string, to: string): Promise<{
        from: string;
        to: string;
        rate: number;
    }>;
    convertQuery(amountStr: string, from?: string, to?: string): Promise<any>;
}
