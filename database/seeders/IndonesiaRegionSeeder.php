<?php

namespace Database\Seeders;

use App\Models\Province;
use App\Models\City;
use Illuminate\Database\Seeder;

class IndonesiaRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            'Aceh' => ['Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam'],
            'Sumatera Utara' => ['Medan', 'Binjai', 'Gunungsitoli', 'Padang Sidempuan', 'Pematangsiantar', 'Sibolga', 'Tanjungbalai', 'Tebing Tinggi'],
            'Sumatera Barat' => ['Padang', 'Bukittinggi', 'Padang Panjang', 'Pariaman', 'Payakumbuh', 'Sawahlunto', 'Solok'],
            'Riau' => ['Pekanbaru', 'Dumai'],
            'Kepulauan Riau' => ['Tanjung Pinang', 'Batam'],
            'Jambi' => ['Jambi', 'Sungaipenuh'],
            'Bengkulu' => ['Bengkulu'],
            'Sumatera Selatan' => ['Palembang', 'Lubuklinggau', 'Pagar Alam', 'Prabumulih'],
            'Kepulauan Bangka Belitung' => ['Pangkal Pinang'],
            'Lampung' => ['Bandar Lampung', 'Metro'],
            'DKI Jakarta' => ['Jakarta Pusat', 'Jakarta Barat', 'Jakarta Utara', 'Jakarta Timur', 'Jakarta Selatan'],
            'Jawa Barat' => ['Bandung', 'Bekasi', 'Bogor', 'Cimahi', 'Cirebon', 'Depok', 'Sukabumi', 'Tasikmalaya', 'Banjar'],
            'Banten' => ['Serang', 'Cilegon', 'Tangerang', 'Tangerang Selatan'],
            'Jawa Tengah' => ['Semarang', 'Magelang', 'Pekalongan', 'Salatiga', 'Surakarta', 'Tegal'],
            'DI Yogyakarta' => ['Yogyakarta'],
            'Jawa Timur' => ['Surabaya', 'Batu', 'Blitar', 'Kediri', 'Madiun', 'Malang', 'Mojokerto', 'Pasuruan', 'Probolinggo'],
            'Bali' => ['Denpasar'],
            'Nusa Tenggara Barat' => ['Mataram', 'Bima'],
            'Nusa Tenggara Timur' => ['Kupang'],
            'Kalimantan Barat' => ['Pontianak', 'Singkawang'],
            'Kalimantan Tengah' => ['Palangka Raya'],
            'Kalimantan Selatan' => ['Banjarmasin', 'Banjarbaru'],
            'Kalimantan Timur' => ['Samarinda', 'Balikpapan', 'Bontang'],
            'Kalimantan Utara' => ['Tarakan'],
            'Sulawesi Utara' => ['Manado', 'Bitung', 'Kotamobagu', 'Tomohon'],
            'Gorontalo' => ['Gorontalo'],
            'Sulawesi Tengah' => ['Palu'],
            'Sulawesi Barat' => ['Mamuju'],
            'Sulawesi Selatan' => ['Makassar', 'Palopo', 'Parepare'],
            'Sulawesi Tenggara' => ['Kendari', 'Bau-Bau'],
            'Maluku' => ['Ambon', 'Tual'],
            'Maluku Utara' => ['Ternate', 'Tidore Kepulauan'],
            'Papua' => ['Jayapura'],
            'Papua Barat' => ['Manokwari', 'Sorong'],
            'Papua Tengah' => ['Nabire'],
            'Papua Pegunungan' => ['Wamena'],
            'Papua Selatan' => ['Merauke'],
            'Papua Barat Daya' => ['Sorong'],
        ];

        foreach ($regions as $provinceName => $cities) {
            $province = Province::create(['name' => $provinceName]);
            foreach ($cities as $cityName) {
                City::create([
                    'province_id' => $province->id,
                    'name' => $cityName,
                ]);
            }
        }
    }
}
