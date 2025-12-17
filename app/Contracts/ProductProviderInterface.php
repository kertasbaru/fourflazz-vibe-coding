<?php

namespace App\Contracts;

interface ProductProviderInterface
{
    /**
     * Get list of products from the provider.
     *
     * @return array{success: bool, data?: array, message?: string}
     */
    public function getProducts(): array;

    /**
     * Get account balance from the provider.
     *
     * @return array{success: bool, data?: array, message?: string}
     */
    public function getBalance(): array;

    /**
     * Get the provider name identifier.
     *
     * @return string
     */
    public function getProviderName(): string;

    /**
     * Check if the provider is enabled.
     *
     * @return bool
     */
    public function isEnabled(): bool;
}
