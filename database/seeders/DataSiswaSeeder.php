<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DataSiswaSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Menjalankan seeder data siswa Solo...');

        $this->call([
            DataSiswaSoloSeeder::class,
            // DataSiswaSemarangSeeder::class, // Dapat diaktifkan jika data Semarang diperlukan
        ]);
    }
}
