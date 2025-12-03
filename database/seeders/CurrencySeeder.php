<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
            ['code' => 'USD', 'name' => 'Dollar américain', 'symbol' => '$'],
            ['code' => 'GBP', 'name' => 'Livre sterling', 'symbol' => '£'],
            ['code' => 'CHF', 'name' => 'Franc suisse', 'symbol' => 'CHF'],
            ['code' => 'CAD', 'name' => 'Dollar canadien', 'symbol' => 'CA$'],
            ['code' => 'AUD', 'name' => 'Dollar australien', 'symbol' => 'A$'],
            ['code' => 'JPY', 'name' => 'Yen japonais', 'symbol' => '¥'],
            ['code' => 'CNY', 'name' => 'Yuan chinois', 'symbol' => '¥'],
            ['code' => 'INR', 'name' => 'Roupie indienne', 'symbol' => '₹'],
            ['code' => 'RUB', 'name' => 'Rouble russe', 'symbol' => '₽'],
            ['code' => 'BRL', 'name' => 'Réal brésilien', 'symbol' => 'R$'],
            ['code' => 'MXN', 'name' => 'Peso mexicain', 'symbol' => 'MX$'],
            ['code' => 'AED', 'name' => 'Dirham des EAU', 'symbol' => 'د.إ'],
            ['code' => 'SAR', 'name' => 'Riyal saoudien', 'symbol' => '﷼'],
            ['code' => 'ZAR', 'name' => 'Rand sud-africain', 'symbol' => 'R'],
            ['code' => 'SEK', 'name' => 'Couronne suédoise', 'symbol' => 'kr'],
            ['code' => 'NOK', 'name' => 'Couronne norvégienne', 'symbol' => 'kr'],
            ['code' => 'DKK', 'name' => 'Couronne danoise', 'symbol' => 'kr'],
            ['code' => 'PLN', 'name' => 'Zloty polonais', 'symbol' => 'zł'],
            ['code' => 'THB', 'name' => 'Baht thaïlandais', 'symbol' => '฿'],
            ['code' => 'SGD', 'name' => 'Dollar singapourien', 'symbol' => 'S$'],
            ['code' => 'HKD', 'name' => 'Dollar de Hong Kong', 'symbol' => 'HK$'],
            ['code' => 'NZD', 'name' => 'Dollar néo-zélandais', 'symbol' => 'NZ$'],
            ['code' => 'KRW', 'name' => 'Won sud-coréen', 'symbol' => '₩'],
            ['code' => 'TRY', 'name' => 'Livre turque', 'symbol' => '₺'],
            ['code' => 'MAD', 'name' => 'Dirham marocain', 'symbol' => 'د.م.'],
            ['code' => 'EGP', 'name' => 'Livre égyptienne', 'symbol' => 'E£'],
            ['code' => 'NGN', 'name' => 'Naira nigérian', 'symbol' => '₦'],
            ['code' => 'KES', 'name' => 'Shilling kényan', 'symbol' => 'KSh'],
            ['code' => 'COP', 'name' => 'Peso colombien', 'symbol' => 'CO$'],
            ['code' => 'ARS', 'name' => 'Peso argentin', 'symbol' => 'AR$'],
            ['code' => 'CLP', 'name' => 'Peso chilien', 'symbol' => 'CL$'],
            ['code' => 'PEN', 'name' => 'Sol péruvien', 'symbol' => 'S/'],
            ['code' => 'VND', 'name' => 'Dong vietnamien', 'symbol' => '₫'],
            ['code' => 'IDR', 'name' => 'Roupie indonésienne', 'symbol' => 'Rp'],
            ['code' => 'MYR', 'name' => 'Ringgit malaisien', 'symbol' => 'RM'],
            ['code' => 'PHP', 'name' => 'Peso philippin', 'symbol' => '₱'],
            ['code' => 'CZK', 'name' => 'Couronne tchèque', 'symbol' => 'Kč'],
            ['code' => 'HUF', 'name' => 'Forint hongrois', 'symbol' => 'Ft'],
            ['code' => 'ILS', 'name' => 'Shekel israélien', 'symbol' => '₪'],
        ];

        foreach ($currencies as $currency) {
            Currency::updateOrCreate(
                ['code' => $currency['code']],
                $currency
            );
        }
    }
}