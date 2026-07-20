<?php

namespace App\Http\Controllers\Admin\Finance;

use App\Domains\Finance\Domain\Models\LoyaltySetting;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltySettingsController extends Controller
{
    /**
     * Display a list of loyalty settings.
     */
    public function index(): Response
    {
        $settings = LoyaltySetting::orderBy('min_rejoin_count', 'asc')->get();

        $siblingSettings = [
            'use_sibling_discount' => filter_var(\App\Domains\Finance\Domain\Models\FinanceSetting::get('use_sibling_discount', '0'), FILTER_VALIDATE_BOOLEAN),
            'sibling_discount_percent' => (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('sibling_discount_percent', '0'),
        ];

        return Inertia::render('Admin/Finance/LoyaltySettings/Index', [
            'settings' => $settings,
            'siblingSettings' => $siblingSettings,
        ]);
    }

    /**
     * Store a newly created loyalty setting.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tier_name' => 'required|string|max:255|unique:loyalty_settings,tier_name',
            'voucher_name' => 'required|string|max:255',
            'discount_amount' => 'required|integer|min:0',
            'cafe_points' => 'required|integer|min:0',
            'min_rejoin_count' => 'required|integer|min:0',
            'use_join_date_limit' => 'boolean',
            'join_date_limit' => 'required_if:use_join_date_limit,true,1|nullable|date',
            'join_date_operator' => 'required_if:use_join_date_limit,true,1|nullable|string|in:before,after',
        ], [
            'tier_name.required' => 'Nama tingkatan tier wajib diisi.',
            'tier_name.unique' => 'Nama tingkatan tier sudah digunakan.',
            'voucher_name.required' => 'Nama voucher yang didapat wajib diisi.',
            'discount_amount.required' => 'Diskon tagihan wajib diisi.',
            'discount_amount.integer' => 'Diskon tagihan harus berupa angka.',
            'discount_amount.min' => 'Diskon tagihan tidak boleh bernilai negatif.',
            'cafe_points.required' => 'Nilai voucher cafe wajib diisi.',
            'cafe_points.integer' => 'Nilai voucher cafe harus berupa angka.',
            'cafe_points.min' => 'Nilai voucher cafe tidak boleh bernilai negatif.',
            'min_rejoin_count.required' => 'Min rejoin count wajib diisi.',
            'min_rejoin_count.integer' => 'Min rejoin count harus berupa angka.',
            'min_rejoin_count.min' => 'Min rejoin count tidak boleh bernilai negatif.',
            'join_date_limit.required_if' => 'Batas tanggal gabung wajib diisi jika batasan tanggal diaktifkan.',
            'join_date_limit.date' => 'Batas tanggal gabung harus berupa tanggal yang valid.',
            'join_date_operator.required_if' => 'Kondisi tanggal wajib dipilih jika batasan tanggal diaktifkan.',
            'join_date_operator.in' => 'Kondisi tanggal tidak valid.',
        ]);

        LoyaltySetting::create($data);

        return redirect()->back()->with('success', 'Loyalty tier created successfully.');
    }

    /**
     * Update the specified loyalty setting.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $loyaltySetting = LoyaltySetting::findOrFail($id);

        $data = $request->validate([
            'tier_name' => 'required|string|max:255|unique:loyalty_settings,tier_name,' . $loyaltySetting->id,
            'voucher_name' => 'required|string|max:255',
            'discount_amount' => 'required|integer|min:0',
            'cafe_points' => 'required|integer|min:0',
            'min_rejoin_count' => 'required|integer|min:0',
            'use_join_date_limit' => 'boolean',
            'join_date_limit' => 'required_if:use_join_date_limit,true,1|nullable|date',
            'join_date_operator' => 'required_if:use_join_date_limit,true,1|nullable|string|in:before,after',
        ], [
            'tier_name.required' => 'Nama tingkatan tier wajib diisi.',
            'tier_name.unique' => 'Nama tingkatan tier sudah digunakan.',
            'voucher_name.required' => 'Nama voucher yang didapat wajib diisi.',
            'discount_amount.required' => 'Diskon tagihan wajib diisi.',
            'discount_amount.integer' => 'Diskon tagihan harus berupa angka.',
            'discount_amount.min' => 'Diskon tagihan tidak boleh bernilai negatif.',
            'cafe_points.required' => 'Nilai voucher cafe wajib diisi.',
            'cafe_points.integer' => 'Nilai voucher cafe harus berupa angka.',
            'cafe_points.min' => 'Nilai voucher cafe tidak boleh bernilai negatif.',
            'min_rejoin_count.required' => 'Min rejoin count wajib diisi.',
            'min_rejoin_count.integer' => 'Min rejoin count harus berupa angka.',
            'min_rejoin_count.min' => 'Min rejoin count tidak boleh bernilai negatif.',
            'join_date_limit.required_if' => 'Batas tanggal gabung wajib diisi jika batasan tanggal diaktifkan.',
            'join_date_limit.date' => 'Batas tanggal gabung harus berupa tanggal yang valid.',
            'join_date_operator.required_if' => 'Kondisi tanggal wajib dipilih jika batasan tanggal diaktifkan.',
            'join_date_operator.in' => 'Kondisi tanggal tidak valid.',
        ]);

        $loyaltySetting->update($data);

        return redirect()->back()->with('success', 'Loyalty tier updated successfully.');
    }

    /**
     * Remove the specified loyalty setting.
     */
    public function destroy(string $id): RedirectResponse
    {
        $loyaltySetting = LoyaltySetting::findOrFail($id);
        $loyaltySetting->delete();

        return redirect()->back()->with('success', 'Loyalty tier deleted successfully.');
    }

    /**
     * Update sibling discount settings.
     */
    public function updateSiblingSettings(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'use_sibling_discount' => 'required|boolean',
            'sibling_discount_percent' => 'required|integer|min:0|max:100',
        ], [
            'use_sibling_discount.required' => 'Status aktif diskon sibling wajib diisi.',
            'sibling_discount_percent.required' => 'Persentase diskon sibling wajib diisi.',
            'sibling_discount_percent.integer' => 'Persentase diskon sibling harus berupa angka.',
            'sibling_discount_percent.min' => 'Persentase diskon sibling minimal 0%.',
            'sibling_discount_percent.max' => 'Persentase diskon sibling maksimal 100%.',
        ]);

        \App\Domains\Finance\Domain\Models\FinanceSetting::set('use_sibling_discount', $data['use_sibling_discount'] ? '1' : '0', 'Aktifkan diskon sibling');
        \App\Domains\Finance\Domain\Models\FinanceSetting::set('sibling_discount_percent', (string) $data['sibling_discount_percent'], 'Persentase diskon sibling');

        return redirect()->back()->with('success', 'Sibling discount settings updated successfully.');
    }
}
