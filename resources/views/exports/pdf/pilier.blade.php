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
            margin: 25mm 20mm;
        }

        body {
            font-family: '{{ $fontFamily }}', sans-serif;
            font-size: 11pt;
            line-height: 1.7;
            color: #2c3e50;
            @if($rtl)
            direction: rtl;
            text-align: right;
            @else
            direction: ltr;
            text-align: left;
            @endif
        }

        .cover-page {
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 250mm;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            margin: -25mm -20mm;
        }

        .cover-title {
            font-size: 36pt;
            font-weight: bold;
            margin-bottom: 30px;
            line-height: 1.2;
        }

        .cover-subtitle {
            font-size: 18pt;
            margin-bottom: 40px;
            opacity: 0.9;
        }

        h1 {
            font-size: 26pt;
            font-weight: bold;
            margin-bottom: 25px;
            color: #1a1a1a;
            page-break-after: avoid;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        h2 {
            font-size: 20pt;
            font-weight: bold;
            margin-top: 35px;
            margin-bottom: 20px;
            color: #34495e;
            page-break-after: avoid;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        h3 {
            font-size: 16pt;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 15px;
            color: #546e7a;
            page-break-after: avoid;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        p {
            margin-bottom: 15px;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }

        ul, ol {
            @if($rtl)
            margin-right: 25px;
            @else
            margin-left: 25px;
            @endif
            margin-bottom: 15px;
        }

        li {
            margin-bottom: 8px;
        }

        .highlight {
            background-color: #fff3cd;
            padding: 15px;
            @if($rtl)
            border-right: 4px solid #ffc107;
            @else
            border-left: 4px solid #ffc107;
            @endif
            margin: 20px 0;
            page-break-inside: avoid;
        }

        .statistic-box {
            background-color: #e3f2fd;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            page-break-inside: avoid;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        .statistic-number {
            font-size: 32pt;
            font-weight: bold;
            color: #1976d2;
        }

        .article-image-container {
            margin: 30px 0;
            text-align: center;
        }

        .article-featured-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .image-credit {
            font-size: 10px;
            color: #666;
            margin-top: 8px;
            font-style: italic;
            text-align: center;
        }

        .image-credit a {
            color: #666;
            text-decoration: none;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 25px auto;
            page-break-inside: avoid;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        th {
            background-color: #667eea;
            color: white;
            font-weight: bold;
        }

        .footer {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 2px solid #ecf0f1;
            font-size: 9pt;
            color: #95a5a6;
        }
    </style>
</head>
<body>
    <div class="cover-page">
        <div class="cover-title">{{ $title }}</div>
        @if(isset($content->subtitle))
        <div class="cover-subtitle">{{ $content->subtitle }}</div>
        @endif
        @if(isset($content->created_at))
        <p style="font-size: 12pt; margin-top: 40px;">
            {{ $content->created_at->format('F Y') }}
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
        <p>© {{ now()->year }} - Document généré automatiquement</p>
        <p>{{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>