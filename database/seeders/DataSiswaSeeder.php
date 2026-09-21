<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DataSiswaSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Menjalankan seeder data siswa Solo & Semarang...');

        $this->call([
            DataSiswaSoloSeeder::class,
            DataSiswaSemarangSeeder::class,
        ]);
    }
}
