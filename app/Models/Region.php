<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    protected $fillable = [
        'name',
        'code',
        'order',
    ];

    public function countries(): HasMany
    {
        return $this->hasMany(Country::class);
    }
}