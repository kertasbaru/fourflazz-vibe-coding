<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'selling_price',
        'provider',
        'product_code',
        'api_source',
        'external_code',
        'api_metadata',
        'type',
        'stock',
        'is_active',
        'sort_order',
        'brands',
        'prefixes',
        'last_stock_check_at',
        'stock_status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean',
        'api_metadata' => 'array',
        'brands' => 'array',
        'prefixes' => 'array',
        'last_stock_check_at' => 'datetime',
    ];

    /**
     * Get the category of this product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    /**
     * Get transactions for this product.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Scope for active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered products.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Check if product is in stock.
     */
    public function isInStock(): bool
    {
        return $this->stock === -1 || $this->stock > 0;
    }

    /**
     * Get formatted price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->selling_price, 0, ',', '.');
    }

    /**
     * Calculate profit for this product.
     */
    public function getProfit(): float
    {
        return $this->selling_price - $this->price;
    }

    /**
     * Check if phone number matches product prefixes (KAJE products).
     */
    public function matchesPrefix(string $phone): bool
    {
        if (empty($this->prefixes)) {
            return true; // No prefix restriction
        }

        // Normalize phone number (remove leading +62 or 0)
        $normalized = preg_replace('/^(\+62|62|0)/', '', $phone);

        foreach ($this->prefixes as $prefix) {
            // Remove leading zero from prefix if present
            $cleanPrefix = ltrim($prefix, '0');
            if (str_starts_with($normalized, $cleanPrefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if product supports a specific brand (KAJE products).
     */
    public function supportsBrand(string $brand): bool
    {
        if (empty($this->brands)) {
            return true; // No brand restriction
        }

        return in_array(strtoupper($brand), array_map('strtoupper', $this->brands));
    }

    /**
     * Get stock status badge color.
     */
    public function getStockStatusColorAttribute(): string
    {
        return match ($this->stock_status) {
            'available' => 'emerald',
            'limited' => 'yellow',
            'out_of_stock' => 'red',
            default => 'slate',
        };
    }
}
