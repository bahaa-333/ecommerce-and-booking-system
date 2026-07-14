<?php

namespace App\Enums;

enum TenantStaffRole: string
{
    case Admin = 'admin';
    case Staff = 'staff';
}
