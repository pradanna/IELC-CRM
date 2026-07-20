<?php

namespace App\Domains\Finance\Domain\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class FinanceSetting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'description'];

    /**
     * Get a setting value by key with a default.
     * Uses cache for performance.
     */
    public static function get($key, $default = null)
    {
        return Cache::rememberForever("finance_setting_{$key}", function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value.
     * Clears cache automatically.
     */
    public static function set($key, $value, $description = null)
    {
        $setting = self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'description' => $description]
        );

        Cache::forget("finance_setting_{$key}");

        return $setting;
    }
}
