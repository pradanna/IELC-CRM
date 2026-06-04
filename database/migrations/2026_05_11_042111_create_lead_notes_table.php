<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });

        // Migrate existing notes
        $leadsWithNotes = DB::table('leads')->whereNotNull('notes')->where('notes', '!=', '')->get();

        foreach ($leadsWithNotes as $lead) {
            DB::table('lead_notes')->insert([
                'id' => Str::uuid(),
                'lead_id' => $lead->id,
                'user_id' => $lead->owner_id, // Default to owner if we don't know who wrote it
                'content' => $lead->notes,
                'created_at' => $lead->updated_at ?? now(),
                'updated_at' => $lead->updated_at ?? now(),
            ]);
        }

        // We can keep the column for now or drop it. 
        // User said "sebelumnya note global yang hanya 1 saja", implies we should move away from it.
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->text('notes')->nullable();
        });

        Schema::dropIfExists('lead_notes');
    }
};

