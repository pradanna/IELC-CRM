<?php

namespace App\Http\Resources\CRM;

use App\Models\Branch;
use App\Models\LeadPhase;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

class LeadActivityResource extends JsonResource
{
    /**
     * Request-level static cache to prevent N+1 query problems.
     * Stores [ 'model:id' => 'name' ]
     */
    protected static array $nameCache = [];

    public function toArray(Request $request): array
    {
        $properties = $this->properties->toArray();
        $attributes = Arr::get($properties, 'attributes', []);
        $old = Arr::get($properties, 'old', []);

        // Fields to ignore (technical/internal)
        $ignore = ['id', 'uuid', 'created_at', 'updated_at', 'deleted_at', 'lead_number'];

        $changes = [];

        foreach ($attributes as $key => $newValue) {
            if (in_array($key, $ignore)) {
                continue;
            }

            $oldValue = Arr::get($old, $key);

            // Only include if value actually changed
            if ($newValue !== $oldValue) {
                $changes[] = [
                    'field' => str_replace('_', ' ', ucfirst(str_replace('_id', '', $key))),
                    'old'   => $this->resolveValue($key, $oldValue),
                    'new'   => $this->resolveValue($key, $newValue),
                ];
            }
        }

        return [
            'id'          => $this->id,
            'description' => $this->description,
            'event'       => $this->event,
            'changes'     => $changes,
            'causer'      => $this->causer ? [
                'name'    => $this->causer->name,
            ] : null,
            'created_at'  => $this->created_at->toISOString(),
            'human_at'    => $this->created_at->diffForHumans(),
        ];
    }

    /**
     * Resolves IDs to names if it's a foreign key, or formats standard values.
     */
    private function resolveValue(string $key, $value)
    {
        if (is_null($value)) {
            return 'None';
        }

        // Logic to detect and resolve foreign keys
        $modelMap = [
            'owner_id'       => User::class,
            'branch_id'      => Branch::class,
            'lead_source_id' => LeadSource::class,
            'lead_type_id'   => LeadType::class,
            'lead_phase_id'  => LeadPhase::class,
        ];

        if (array_key_exists($key, $modelMap) && (is_string($value) || is_numeric($value))) {
            $modelClass = $modelMap[$key];
            $cacheKey = "{$modelClass}:{$value}";

            if (!isset(self::$nameCache[$cacheKey])) {
                $model = $modelClass::find($value);
                self::$nameCache[$cacheKey] = $model ? $model->name : "Unknown (#{$value})";
            }

            return self::$nameCache[$cacheKey];
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return (string) $value;
    }
}
