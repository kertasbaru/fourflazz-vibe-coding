<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'type',
        'method',
        'endpoint',
        'ip_address',
        'user_agent',
        'headers',
        'request_data',
        'response_data',
        'response_status',
        'success',
        'error_message',
    ];

    protected $casts = [
        'headers' => 'array',
        'request_data' => 'array',
        'response_data' => 'array',
        'success' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
