<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case PayAtShop = 'pay_at_shop';
    case CashOnDelivery = 'cash_on_delivery';
    case ManualPayment = 'manual_payment';
}
