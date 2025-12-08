import { Module } from '@nestjs/common';
import { LocalizationService } from './localization.service';
import { CurrencyFormatter } from './formatters/currency.formatter';
import { DateFormatter } from './formatters/date.formatter';
import { NumberFormatter } from './formatters/number.formatter';

@Module({
    providers: [LocalizationService, CurrencyFormatter, DateFormatter, NumberFormatter],
    exports: [LocalizationService, CurrencyFormatter, DateFormatter, NumberFormatter],
})
export class LocalizationModule { }
