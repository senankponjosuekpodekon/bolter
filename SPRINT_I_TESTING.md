# Sprint I - Phase 1: Testing & Verification Guide

**Date:** 6 décembre 2025  
**Objectif:** Valider tous les composants Phase 1

---

## 🧪 Tests de Compilation

### 1. Vérifier que le code compile sans erreurs

```bash
# Backend
cd /home/josue/.env/bolter/apps/server
npm run build

# Expected output:
# > nest build
# (No errors)
```

✅ **Status:** PASS (testé 6 déc)

---

## 🧪 Tests Unitaires

### 1. Exécuter les tests ExchangeService

```bash
cd /home/josue/.env/bolter/apps/server

# Run specific test file
npm run test -- exchange.service.spec.ts --no-coverage

# Or run in watch mode
npm run test:watch -- exchange.service.spec.ts

# Expected tests (12):
# - getRate same currency returns 1
# - getRate supported pair returns correct rate
# - getRate case insensitivity
# - getRate unsupported returns null
# - getRate uses cache
# - getMultipleRates returns all rates
# - getMultipleRates excludes same currency
# - convert calculates correctly
# - convert rounds to 2 decimals
# - convert throws on unsupported pair
# - getSupportedCurrencies returns sorted list
# - clearCache works without error
```

### 2. Exécuter les tests Formatters

```bash
cd /home/josue/.env/bolter/apps/server

# Run formatter tests
npm run test -- localization/localization.spec.ts --no-coverage

# Expected tests (10):
# - CurrencyFormatter EUR with symbol after
# - CurrencyFormatter USD with symbol before
# - CurrencyFormatter locale-specific numbering
# - DateFormatter short format
# - DateFormatter long format
# - DateFormatter time
# - NumberFormatter US locale
# - NumberFormatter FR locale
# - NumberFormatter percent
```

### 3. Couverture de tests

```bash
cd /home/josue/.env/bolter/apps/server

# Run all tests with coverage
npm run test:coverage

# Check coverage reports
open coverage/lcov-report/index.html

# Expected: >70% coverage
```

---

## 🌐 Tests API Manuels

### Démarrer le serveur

```bash
cd /home/josue/.env/bolter/apps/server
npm run start:dev

# Wait for output:
# [Nest] 12345  - 12/06/2025, 00:00:00     LOG [NestFactory] Starting Nest application...
# [Nest] 12345  - 12/06/2025, 00:00:00     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12345  - 12/06/2025, 00:00:00     LOG [RoutesResolver] AppController {/}:
```

### Test 1: Get Supported Currencies

```bash
curl http://localhost:3000/exchange/supported-currencies

# Expected response:
# ["AED", "CAD", "EUR", "GBP", "GHS", "NGN", "USD", "XOF", "ZAR"]
```

✅ **Check:** Array contains exactly 9 currencies, sorted alphabetically

### Test 2: Get Rates for EUR

```bash
curl http://localhost:3000/exchange/rates?base=EUR

# Expected response:
# {
#   "USD": 1.08,
#   "GBP": 0.86,
#   "CAD": 1.40,
#   "AED": 3.98,
#   "NGN": 1250,
#   "GHS": 11.2,
#   "ZAR": 20.5,
#   "XOF": 655
# }
```

✅ **Check:** 8 rates returned, all positive numbers, EUR not in result

### Test 3: Get Specific Rate

```bash
curl http://localhost:3000/exchange/rate/EUR/USD

# Expected response:
# {
#   "from": "EUR",
#   "to": "USD",
#   "rate": 1.08
# }
```

✅ **Check:** Rate equals 1.08, currencies uppercase

### Test 4: Convert with Query (Legacy)

```bash
curl "http://localhost:3000/exchange/convert?amount=100&from=EUR&to=USD"

# Expected response:
# {
#   "amount": 108,
#   "originalAmount": 100,
#   "rate": 1.08,
#   "from": "EUR",
#   "to": "USD",
#   "timestamp": "2025-12-06T..."
# }
```

✅ **Check:**

- converted amount = 108 (100 × 1.08)
- rate = 1.08
- timestamp is valid ISO date

### Test 5: Convert with POST (DTO Validated)

```bash
curl -X POST http://localhost:3000/exchange/convert \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.5,
    "from": "USD",
    "to": "EUR"
  }'

# Expected response:
# {
#   "originalAmount": 50.5,
#   "convertedAmount": 46.97,
#   "from": "USD",
#   "to": "EUR",
#   "rate": 0.93,
#   "timestamp": "2025-12-06T..."
# }
```

✅ **Check:**

- converted amount = 46.97 (50.5 × 0.93, rounded)
- rate = 0.93 (inverse of EUR→USD)
- calculation correct

### Test 6: Error Handling - Invalid Currency

```bash
curl http://localhost:3000/exchange/rate/XXX/YYY

# Expected response (400 Bad Request):
# {
#   "statusCode": 400,
#   "message": "No rate available for XXX -> YYY",
#   "error": "Bad Request"
# }
```

✅ **Check:** Returns 400 error

### Test 7: Error Handling - Invalid Amount

```bash
curl -X POST http://localhost:3000/exchange/convert \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -50,
    "from": "EUR",
    "to": "USD"
  }'

# Expected response (400 Bad Request):
# {
#   "statusCode": 400,
#   "message": "validation error",
#   "error": "Bad Request"
# }
```

✅ **Check:** DTO validation rejects negative amount

### Test 8: Case Insensitivity

```bash
curl "http://localhost:3000/exchange/convert?amount=100&from=eur&to=usd"

# Expected response (success):
# {
#   "amount": 108,
#   "from": "EUR",
#   "to": "USD",
#   ...
# }
```

✅ **Check:** Works with lowercase, outputs uppercase

### Test 9: Cache Test

```bash
# First call
curl http://localhost:3000/exchange/rate/EUR/GBP

# Second call (should be instant from cache)
curl http://localhost:3000/exchange/rate/EUR/GBP

# Expected: Both return same result quickly
# Second call should be from cache (check logs for "Cache hit")
```

✅ **Check:** No errors, both return 0.86

### Test 10: Unsupported Pair

```bash
curl "http://localhost:3000/exchange/convert?amount=100&from=EUR&to=FAKE"

# Expected response (400):
# {
#   "statusCode": 400,
#   "message": "No exchange rate available for EUR -> FAKE",
#   "error": "Bad Request"
# }
```

✅ **Check:** Returns 400 error with meaningful message

---

## 🔍 Localization Service Tests

### 1. Vérifier les messages sont chargés

```bash
# Check logs when server starts
# Should see:
# [Nest] ... LOG [LocalizationService] Loaded EN localization messages
# [Nest] ... LOG [LocalizationService] Loaded FR localization messages
```

✅ **Check:** Both locales loaded successfully

### 2. Test getMessage service

```bash
# Create a simple test file:
cat > test-localization.js << 'EOF'
const { LocalizationService } = require('./dist/localization/localization.service');

const service = new LocalizationService();

// Test EN messages
console.log('EN:', service.getMessage('errors.validation.email', 'en'));
// Expected: "Invalid email address"

// Test FR messages
console.log('FR:', service.getMessage('errors.validation.email', 'fr'));
// Expected: "Adresse email invalide"

// Test interpolation
console.log('EN with param:', service.getMessage('errors.validation.currency', 'en', { currency: 'XXX' }));
// Expected: "Currency XXX is not supported"

// Test missing key
console.log('Missing:', service.getMessage('non.existent.key', 'en'));
// Expected: "non.existent.key" (fallback to key)
EOF

node test-localization.js
```

✅ **Check:** All messages return correct translations

---

## 🧮 Formatter Tests

### 1. Test CurrencyFormatter

```typescript
// Test in Node.js with Intl support
const {
  CurrencyFormatter,
} = require("./dist/localization/formatters/currency.formatter");

const formatter = new CurrencyFormatter();

// Test EUR (symbol after)
const eur = formatter.formatCurrency(100, "EUR", "fr-FR");
console.log("EUR FR:", eur); // "100,00 €" or similar

// Test USD (symbol before)
const usd = formatter.formatCurrency(100, "USD", "en-US");
console.log("USD EN:", usd); // "$ 100.00"

// Test large number
const large = formatter.formatCurrency(1234.56, "EUR", "fr-FR");
console.log("Large FR:", large); // "1 234,56 €" (FR uses space separator)
```

✅ **Check:** Symbols and formatting correct per locale

### 2. Test DateFormatter

```typescript
const {
  DateFormatter,
} = require("./dist/localization/formatters/date.formatter");

const formatter = new DateFormatter();
const date = new Date("2025-12-06");

// Test short format
const short = formatter.formatDate(date, "en-US", "short");
console.log("Short EN:", short); // "12/06/25"

// Test long format
const long = formatter.formatDate(date, "fr-FR", "long");
console.log("Long FR:", long); // "6 décembre 2025"

// Test time
const time = formatter.formatTime(date, "en-US");
console.log("Time:", time); // "00:00:00" or similar
```

✅ **Check:** Date formats match locale conventions

### 3. Test NumberFormatter

```typescript
const {
  NumberFormatter,
} = require("./dist/localization/formatters/number.formatter");

const formatter = new NumberFormatter();

// Test EN format (comma thousands, dot decimal)
const en = formatter.formatNumber(1234.56, "en-US");
console.log("Number EN:", en); // "1,234.56"

// Test FR format (space thousands, comma decimal)
const fr = formatter.formatNumber(1234.56, "fr-FR");
console.log("Number FR:", fr); // "1 234,56"

// Test percent
const percent = formatter.formatPercent(85.5, "en-US", 1);
console.log("Percent:", percent); // "85.5%"
```

✅ **Check:** Separators and formatting correct per locale

---

## 📊 Integration Tests

### Complete Flow Test

```bash
# 1. Start server
npm run start:dev

# 2. Get rates
curl http://localhost:3000/exchange/rates?base=EUR

# 3. Convert amount
curl -X POST http://localhost:3000/exchange/convert \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "from": "EUR", "to": "USD"}'

# 4. Check TypeScript compilation
npm run build

# 5. Run tests
npm run test -- --testPathPattern="exchange|localization" --no-coverage
```

✅ **Check:** All steps succeed without errors

---

## 📋 Validation Checklist

### Compilation

- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors (type safety)
- [ ] All imports resolve correctly

### ExchangeService

- [ ] Supports all 9 currencies
- [ ] Rates are correct (EUR→USD = 1.08)
- [ ] Cache works (2nd call is instant)
- [ ] Taux croisés fonctionnent (USD→EUR inverse)
- [ ] Rounding à 2 décimales OK

### API Endpoints

- [ ] GET /exchange/supported-currencies ✓
- [ ] GET /exchange/rates?base=EUR ✓
- [ ] GET /exchange/rate/:from/:to ✓
- [ ] POST /exchange/convert ✓
- [ ] GET /exchange/convert (legacy) ✓

### LocalizationService

- [ ] EN messages loaded ✓
- [ ] FR messages loaded ✓
- [ ] getMessage retrieves correct translation ✓
- [ ] Interpolation works {{variable}} ✓
- [ ] Fallback to EN if locale missing ✓

### Formatters

- [ ] CurrencyFormatter shows correct symbols ✓
- [ ] DateFormatter respects locale format ✓
- [ ] NumberFormatter uses correct separators ✓
- [ ] All handle Intl API correctly ✓

### Tests

- [ ] ExchangeService tests pass (12) ✓
- [ ] Formatter tests pass (10) ✓
- [ ] No test failures ✓
- [ ] Coverage >70% ✓

### Error Handling

- [ ] Invalid currency returns 400 ✓
- [ ] Invalid amount returns 400 ✓
- [ ] Missing locale falls back to EN ✓
- [ ] Error messages are clear ✓

---

## 🎯 Success Criteria

**Phase 1 is COMPLETE when:**

✅ Compilation passes without errors  
✅ All 5 API endpoints respond correctly  
✅ ExchangeService handles 9 currencies  
✅ LocalizationService loads EN + FR messages  
✅ All 3 formatters work correctly  
✅ Unit tests pass (22+ tests)  
✅ Cache functionality works  
✅ Error handling is robust  
✅ TypeScript types are safe

---

## 🚀 Next: Phase 2

Once Phase 1 is validated:

1. Create frontend i18n infrastructure
2. Add 250+ translation keys
3. Implement frontend formatters
4. Create custom hooks
5. Integrate with components

Proceed to: **SPRINT_I_PHASE2_GUIDE.md**
