<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h1 { margin-bottom: 1.5rem; color: #111; }
        input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 1rem; font-size: 1rem; }
        input:focus { outline: none; border-color: #3b82f6; }
        button { width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #2563eb; }
        .error { color: #ef4444; margin-bottom: 1rem; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Admin Login</h1>
        
        @if ($errors->any())
            <div class="error">{{ $errors->first() }}</div>
        @endif
        
        <form method="POST" action="/login">
            @csrf
            <input type="email" name="email" placeholder="Email" value="williamsjullin@gmail.com" required>
            <input type="password" name="password" placeholder="Mot de passe" required>
            <button type="submit">Connexion</button>
        </form>
    </div>
</body>
</html>