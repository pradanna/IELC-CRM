<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DataSiswaSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Memulai seeding Data Siswa Solo & Semarang...');

        $this->call([
            DataSiswaSoloSeeder::class,
            DataSiswaSemarangSeeder::class,
        ]);

        $this->command->info('Selesai seeding seluruh Data Siswa!');
    }
}
