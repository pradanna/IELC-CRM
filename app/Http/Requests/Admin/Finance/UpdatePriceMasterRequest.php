<?php

namespace App\Http\Requests\Admin\Finance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePriceMasterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('price_master')->id;
        return [
            'name' => "required|string|max:255|unique:price_masters,name,{$id},id",
            'price_per_session' => 'required|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama track/produk harga wajib diisi.',
            'name.unique' => 'Nama track/produk harga sudah digunakan.',
            'price_per_session.required' => 'Harga per sesi wajib diisi.',
            'price_per_session.numeric' => 'Harga per sesi harus berupa angka.',
            'price_per_session.min' => 'Harga per sesi tidak boleh bernilai negatif.',
        ];
    }
}


