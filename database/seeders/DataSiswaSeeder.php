<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DataSiswaSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeder data siswa sementara dikosongkan (menunggu data terbaru).');

        // $this->call([
        //     DataSiswaSoloSeeder::class,
        //     DataSiswaSemarangSeeder::class,
        // ]);
    }
}
