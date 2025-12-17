<?php

namespace App\Traits;

use App\Models\ApiLog;

trait LogsApiCalls
{
    /**
     * Make an HTTP request with logging.
     *
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $url Full URL to call
     * @param array $params Request parameters
     * @param string $endpoint Short endpoint name for logging
     * @return array
     */
    protected function makeLoggedRequest(string $method, string $url, array $params = [], string $endpoint = ''): array
    {
        $startTime = microtime(true);
        $provider = $this->getProviderName();

        // Hide API key in logged request data
        $loggedParams = $params;
        if (isset($loggedParams['api_key'])) {
            $loggedParams['api_key'] = '***HIDDEN***';
        }

        try {
            $http = \Illuminate\Support\Facades\Http::timeout($this->timeout);

            if (strtoupper($method) === 'POST') {
                $response = $http->post($url, $params);
            } else {
                $response = $http->get($url, $params);
            }

            $responseTime = microtime(true) - $startTime;
            $result = $response->json();
            $success = $response->successful() && ($result['status'] ?? false) === true;

            // Log the API call
            ApiLog::logApiCall(
                $provider,
                $endpoint ?: $url,
                strtoupper($method),
                $loggedParams,
                $result,
                $response->status(),
                $success,
                $success ? null : ($result['message'] ?? 'Unknown error'),
                $responseTime
            );

            return [
                'response' => $response,
                'result' => $result,
                'success' => $success,
                'response_time' => $responseTime,
            ];
        } catch (\Exception $e) {
            $responseTime = microtime(true) - $startTime;

            // Log the failed API call
            ApiLog::logApiCall(
                $provider,
                $endpoint ?: $url,
                strtoupper($method),
                $loggedParams,
                null,
                null,
                false,
                $e->getMessage(),
                $responseTime
            );

            throw $e;
        }
    }
}
