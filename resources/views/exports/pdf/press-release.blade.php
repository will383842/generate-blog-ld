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
            color: #000;
            @if($rtl)
            direction: rtl;
            text-align: right;
            @else
            direction: ltr;
            text-align: left;
            @endif
        }

        .header-section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
        }

        .press-release-badge {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #d32f2f;
            margin-bottom: 10px;
        }

        .release-date {
            font-size: 10pt;
            color: #666;
            margin-bottom: 15px;
        }

        h1 {
            font-size: 22pt;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
            line-height: 1.3;
        }

        .subtitle {
            font-size: 14pt;
            color: #444;
            margin-bottom: 20px;
            font-weight: 600;
        }

        .location {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 15px;
        }

        p {
            margin-bottom: 12px;
            text-align: justify;
        }

        .lead-paragraph {
            font-size: 12pt;
            font-weight: 500;
            margin-bottom: 20px;
        }

        .quote-box {
            @if($rtl)
            border-right: 4px solid #2196f3;
            padding-right: 20px;
            margin-right: 10px;
            @else
            border-left: 4px solid #2196f3;
            padding-left: 20px;
            margin-left: 10px;
            @endif
            margin-top: 25px;
            margin-bottom: 25px;
            background-color: #f5f5f5;
            padding-top: 15px;
            padding-bottom: 15px;
        }

        .quote-text {
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 10px;
        }

        .quote-author {
            font-weight: bold;
            font-size: 10pt;
            color: #555;
        }

        .boilerplate {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
        }

        .boilerplate-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 10pt;
        }

        .contact-section {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
        }

        .contact-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .contact-info {
            font-size: 10pt;
            line-height: 1.5;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            page-break-inside: avoid;
        }

        .logo {
            max-width: 150px;
            margin-bottom: 20px;
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

        h2 {
            font-size: 16pt;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 15px;
            color: #000;
        }

        ul, ol {
            @if($rtl)
            margin-right: 20px;
            @else
            margin-left: 20px;
            @endif
            margin-bottom: 15px;
        }

        li {
            margin-bottom: 8px;
        }

        strong {
            font-weight: bold;
        }

        .footer {
            margin-top: 30px;
            font-size: 8pt;
            color: #999;
            text-align: center;
        }

        .separator {
            text-align: center;
            margin: 30px 0;
            font-size: 18pt;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="header-section">
        <div class="press-release-badge">COMMUNIQUÉ DE PRESSE</div>
        @if(isset($content->release_date))
        <div class="release-date">{{ $content->release_date->format('d/m/Y') }}</div>
        @endif
        <h1>{{ $title }}</h1>
        @if(isset($content->subtitle))
        <div class="subtitle">{{ $content->subtitle }}</div>
        @endif
    </div>

    @if(isset($content->image_url))
    <div class="article-image-container">
        <img src="{{ $content->getOptimizedImageUrl(1200, 85) }}" 
             alt="{{ $content->image_alt ?? $title }}" 
             class="article-featured-image"
             @if(isset($content->image_width))width="{{ $content->image_width }}"@endif
             @if(isset($content->image_height))height="{{ $content->image_height }}"@endif>
        
        @if(method_exists($content, 'hasUnsplashImage') && $content->hasUnsplashImage() && isset($content->image_attribution))
        <div class="image-credit">
            {!! $content->image_attribution !!}
        </div>
        @endif
    </div>
    @endif

    @if(isset($content->location))
    <p class="location">{{ $content->location }} —</p>
    @endif

    <div class="content">
        {!! $body !!}
    </div>

    @if(isset($content->quote) && isset($content->quote_author))
    <div class="quote-box">
        <p class="quote-text">"{{ $content->quote }}"</p>
        <p class="quote-author">— {{ $content->quote_author }}</p>
    </div>
    @endif

    @if(isset($content->boilerplate))
    <div class="boilerplate">
        <div class="boilerplate-title">À propos</div>
        <p>{{ $content->boilerplate }}</p>
    </div>
    @endif

    @if(isset($content->contact_name) || isset($content->contact_email))
    <div class="contact-section">
        <div class="contact-title">Contact Presse</div>
        <div class="contact-info">
            @if(isset($content->contact_name))
            <p><strong>Nom:</strong> {{ $content->contact_name }}</p>
            @endif
            @if(isset($content->contact_email))
            <p><strong>Email:</strong> {{ $content->contact_email }}</p>
            @endif
            @if(isset($content->contact_phone))
            <p><strong>Tél:</strong> {{ $content->contact_phone }}</p>
            @endif
        </div>
    </div>
    @endif

    <div class="separator">###</div>

    <div class="footer">
        <p>Document généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>
</body>
</html>