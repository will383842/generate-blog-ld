<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Admin Console - Content Engine</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/admin/main.tsx'])
</head>
<body>
    <div id="root"></div>
</body>
</html>