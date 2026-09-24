<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('whatsapp_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone')->index();
            $table->string('name')->default('No Name');
            $table->string('channel')->default('baileys')->index(); // 'baileys' or 'official'
            $table->string('branch')->nullable()->index(); // e.g. 'solo', 'semarang'
            $table->uuid('lead_id')->nullable()->index();
            $table->text('last_message')->nullable();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->unsignedInteger('unread_count')->default(0);
            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
        });

        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('whatsapp_contact_id')->nullable()->index();
            $table->uuid('lead_id')->nullable()->index();
            $table->string('phone')->index();
            $table->string('channel')->default('baileys')->index();
            $table->string('branch')->nullable()->index();
            $table->enum('sender', ['admin', 'contact'])->default('contact');
            $table->text('message');
            $table->text('media_url')->nullable();
            $table->string('status')->default('read');
            $table->timestamps();

            $table->foreign('whatsapp_contact_id')->references('id')->on('whatsapp_contacts')->cascadeOnDelete();
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_contacts');
    }
};
