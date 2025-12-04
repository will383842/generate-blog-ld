<!DOCTYPE html>
<html lang="{{ $lang }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 20mm 15mm;
        }

        body {
            font-family: '{{ $fontFamily }}', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            @if($rtl)
            direction: rtl;
            text-align: right;
            @else
            direction: ltr;
            text-align: left;
            @endif
        }

        h1 {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1a1a1a;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        h2 {
            font-size: 18pt;
            font-weight: bold;
            margin-top: 30px;
            margin-bottom: 15px;
            color: #2c3e50;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #34495e;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        p {
            margin-bottom: 12px;
            text-align: justify;
        }

        ul, ol {
            @if($rtl)
            margin-right: 20px;
            @else
            margin-left: 20px;
            @endif
            margin-bottom: 12px;
        }

        li {
            margin-bottom: 6px;
        }

        strong {
            font-weight: bold;
        }

        em {
            font-style: italic;
        }

        a {
            color: #3498db;
            text-decoration: none;
        }

        .header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #ecf0f1;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            font-size: 9pt;
            color: #7f8c8d;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        .content {
            min-height: 200mm;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }

        blockquote {
            @if($rtl)
            border-right: 4px solid #3498db;
            padding-right: 15px;
            margin-right: 0;
            @else
            border-left: 4px solid #3498db;
            padding-left: 15px;
            margin-left: 0;
            @endif
            margin-bottom: 15px;
            font-style: italic;
            color: #555;
        }

        .article-image-container {
            margin: 30px 0;
            text-align: center;
        }

        .article-featured-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }

        .image-credit {
            font-size: 10px;
            color: #666;
            margin-top: 8px;
            font-style: italic;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        @if(isset($content->created_at))
        <p style="color: #7f8c8d; font-size: 10pt;">
            @if($rtl)
            {{ $content->created_at->format('Y/m/d') }}
            @else
            {{ $content->created_at->format('d/m/Y') }}
            @endif
        </p>
        @endif
    </div>

    <div class="content">
        @if(isset($article) && $article->image_url)
        <div class="article-image-container">
            <img src="{{ $article->getOptimizedImageUrl(1200, 85) }}" 
                 alt="{{ $article->image_alt }}" 
                 class="article-featured-image"
                 @if($article->image_width)width="{{ $article->image_width }}"@endif
                 @if($article->image_height)height="{{ $article->image_height }}"@endif>
            
            @if($article->hasUnsplashImage() && $article->image_attribution)
            <div class="image-credit">
                {!! $article->image_attribution !!}
            </div>
            @endif
        </div>
        @endif

        {!! $body !!}
    </div>

    <div class="footer">
        <p>Document généré automatiquement - {{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>