<?php

namespace App\Enums;

enum ServiceAvailabilityType: string
{
    case Standing = 'standing';
    case DateRange = 'date_range';
}
