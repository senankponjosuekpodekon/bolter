export function generateFrenchIban(): string {
    const countryCode = 'FR';
    const checkDigits = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
    const bankCode = '30004';
    const branchCode = '00001';
    const accountNumber = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(11, '0');
    const key = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, '0');
    return `${countryCode}${checkDigits}${bankCode}${branchCode}${accountNumber}${key}`;
}
