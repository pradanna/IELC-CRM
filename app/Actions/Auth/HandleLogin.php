<?php

namespace App\Actions\Auth;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Validation\ValidationException;

class HandleLogin
{
    /**
     * Handle the authentication process.
     *
     * @param LoginRequest $request
     * @return void
     * @throws ValidationException
     */
    public function handle(LoginRequest $request): void
    {
        $request->authenticate();

        $request->session()->regenerate();
    }
}
