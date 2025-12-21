<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'description',
        'is_active',
        'sort_order',
        'input_type',
        'category_group',
        'badge_label',
        'badge_color',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get products in this category.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    /**
     * Get active products in this category.
     */
    public function activeProducts(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id')->where('is_active', true);
    }

    /**
     * Check if this category requires phone number input.
     */
    public function requiresPhoneNumber(): bool
    {
        return $this->input_type === 'phone';
    }

    /**
     * Check if this category requires customer ID input.
     */
    public function requiresCustomerId(): bool
    {
        return $this->input_type === 'customer_id';
    }

    /**
     * Scope for active categories.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered categories.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Scope for categories grouped by category_group.
     */
    public function scopeGrouped($query)
    {
        return $query->orderBy('category_group')->orderBy('sort_order')->orderBy('name');
    }
}
