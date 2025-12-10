import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { ConversionRequestDto } from './dto/conversion-request.dto';
import { ConversionResponseDto } from './dto/conversion-response.dto';

@Controller('exchange')
export class ExchangeController {
    constructor(private readonly exchangeService: ExchangeService) { }

    /**
     * GET /exchange/rates?base=EUR
     * Get all supported rates for a base currency
     */
    @Get('rates')
    async getRates(
        @Query('base') baseCurrency: string = 'EUR',
    ): Promise<Record<string, number>> {
        const supported = this.exchangeService.getSupportedCurrencies();
        if (!supported.includes(baseCurrency.toUpperCase())) {
            throw new BadRequestException(`Currency ${baseCurrency} is not supported`);
        }
        return this.exchangeService.getMultipleRates(baseCurrency);
    }

    /**
     * POST /exchange/convert
     * Convert amount from one currency to another
     */
    @Post('convert')
    async convert(
        @Body() request: ConversionRequestDto,
    ): Promise<ConversionResponseDto> {
        try {
            const result = await this.exchangeService.convert(
                request.amount,
                request.from,
                request.to,
            );
            return result;
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'Conversion failed');
        }
    }

    /**
     * GET /exchange/supported-currencies
     * Get list of all supported currencies
     */
    @Get('supported-currencies')
    async getSupportedCurrencies(): Promise<string[]> {
        return this.exchangeService.getSupportedCurrencies();
    }

    /**
     * GET /exchange/rate/:from/:to
     * Get specific rate between two currencies
     */
    @Get('rate/:from/:to')
    async getRate(
        @Param('from') from: string,
        @Param('to') to: string,
    ): Promise<{ from: string; to: string; rate: number }> {
        const rate = await this.exchangeService.getRate(from, to);
        if (!rate) {
            throw new BadRequestException(`No rate available for ${from} -> ${to}`);
        }
        return { from: from.toUpperCase(), to: to.toUpperCase(), rate };
    }

    /**
     * GET /exchange/convert (legacy - using query params)
     * For backward compatibility
     */
    @Get('convert')
    async convertQuery(
        @Query('amount') amountStr: string,
        @Query('from') from: string = 'EUR',
        @Query('to') to: string = 'EUR',
    ): Promise<{ amount: number; originalAmount: number; rate: number; from: string; to: string; timestamp: string }> {
        const amount = Number(amountStr || '0');
        if (isNaN(amount) || amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }

        try {
            const result = await this.exchangeService.convert(amount, from, to);
            return {
                amount: result.convertedAmount,
                originalAmount: result.originalAmount,
                rate: result.rate,
                from: result.from,
                to: result.to,
                timestamp: result.timestamp instanceof Date ? result.timestamp.toISOString() : String(result.timestamp),
            };
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'Conversion failed');
        }
    }
}
