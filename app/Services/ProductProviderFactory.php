<?php

namespace App\Services;

use App\Contracts\ProductProviderInterface;
use InvalidArgumentException;

class ProductProviderFactory
{
    /**
     * Registered providers.
     *
     * @var array<string, ProductProviderInterface>
     */
    protected array $providers = [];

    /**
     * Create a new factory instance with default providers.
     */
    public function __construct()
    {
        $this->registerDefaultProviders();
    }

    /**
     * Register the default providers.
     */
    protected function registerDefaultProviders(): void
    {
        $this->register('kmsp', app(KmspService::class));
        $this->register('kaje', app(KajeService::class));
    }

    /**
     * Register a provider.
     *
     * @param string $name
     * @param ProductProviderInterface $provider
     * @return self
     */
    public function register(string $name, ProductProviderInterface $provider): self
    {
        $this->providers[strtolower($name)] = $provider;
        return $this;
    }

    /**
     * Get a provider by name.
     *
     * @param string $name
     * @return ProductProviderInterface
     * @throws InvalidArgumentException
     */
    public function getProvider(string $name): ProductProviderInterface
    {
        $name = strtolower($name);

        if (!isset($this->providers[$name])) {
            throw new InvalidArgumentException("Provider '{$name}' is not registered.");
        }

        return $this->providers[$name];
    }

    /**
     * Check if a provider is registered.
     *
     * @param string $name
     * @return bool
     */
    public function hasProvider(string $name): bool
    {
        return isset($this->providers[strtolower($name)]);
    }

    /**
     * Get all registered providers.
     *
     * @return array<string, ProductProviderInterface>
     */
    public function getAllProviders(): array
    {
        return $this->providers;
    }

    /**
     * Get all enabled providers.
     *
     * @return array<string, ProductProviderInterface>
     */
    public function getEnabledProviders(): array
    {
        return array_filter($this->providers, function (ProductProviderInterface $provider) {
            return $provider->isEnabled();
        });
    }

    /**
     * Get provider names.
     *
     * @return array<string>
     */
    public function getProviderNames(): array
    {
        return array_keys($this->providers);
    }

    /**
     * Get all products from all enabled providers.
     *
     * @return array
     */
    public function getAllProducts(): array
    {
        $allProducts = [];

        foreach ($this->getEnabledProviders() as $name => $provider) {
            $result = $provider->getProducts();
            if ($result['success'] && isset($result['data'])) {
                $allProducts[$name] = $result['data'];
            }
        }

        return $allProducts;
    }
}
