<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AdminUser;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "==========================================\n";
echo "  REPARATION COMPTE ADMIN\n";
echo "==========================================\n\n";

$email = 'williamsjullin@gmail.com';
$password = 'Admin123!';

DB::table('admin_users')->where('email', $email)->delete();
echo "OK: Ancien compte supprime\n\n";

DB::table('admin_users')->insert([
    'name' => 'Williams Jullin',
    'email' => $email,
    'password' => Hash::make($password),
    'role' => 'super_admin',
    'is_active' => 1,
    'created_at' => now(),
    'updated_at' => now(),
]);

echo "OK: Nouveau compte cree\n\n";

$user = AdminUser::where('email', $email)->first();
if ($user && Hash::check($password, $user->password)) {
    echo "OK: Verification mot de passe reussie\n\n";
} else {
    echo "ERREUR: Probleme de verification\n\n";
}

echo "==========================================\n";
echo "  IDENTIFIANTS\n";
echo "==========================================\n";
echo "Email: {$email}\n";
echo "Mot de passe: {$password}\n\n";
