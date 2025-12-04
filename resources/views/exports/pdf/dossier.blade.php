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
            line-height: 1.6;
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
            min-height: 250mm;
            padding: 40px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            margin: -25mm -20mm;
        }

        .cover-title {
            font-size: 42pt;
            font-weight: bold;
            margin-bottom: 20px;
            line-height: 1.2;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        .cover-subtitle {
            font-size: 20pt;
            margin-bottom: 60px;
            opacity: 0.95;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        .cover-meta {
            font-size: 12pt;
            margin-top: auto;
            opacity: 0.9;
        }

        .toc {
            page-break-after: always;
            margin-bottom: 40px;
        }

        .toc-title {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 30px;
            @if($rtl)
            text-align: right;
            @else
            text-align: left;
            @endif
        }

        .toc-item {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dotted #ccc;
        }

        h1 {
            font-size: 28pt;
            font-weight: bold;
            margin-bottom: 30px;
            color: #1a1a1a;
            page-break-before: always;
            padding-top: 20px;
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
            color: #2a5298;
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
            color: #34495e;
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

        .section-intro {
            font-size: 13pt;
            font-weight: 500;
            color: #555;
            margin-bottom: 25px;
            padding: 15px;
            background-color: #f8f9fa;
            @if($rtl)
            border-right: 4px solid #2a5298;
            @else
            border-left: 4px solid #2a5298;
            @endif
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 25px auto;
            page-break-inside: avoid;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .image-caption {
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-top: 10px;
            font-style: italic;
        }

        .article-image-container {
            margin: 30px 0;
            text-align: center;
            page-break-inside: avoid;
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

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            page-break-inside: avoid;
            font-size: 10pt;
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
            background-color: #2a5298;
            color: white;
            font-weight: bold;
        }

        tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .stat-highlight {
            background-color: #e8f4f8;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            @if($rtl)
            border-right: 5px solid #2196f3;
            @else
            border-left: 5px solid #2196f3;
            @endif
            page-break-inside: avoid;
        }

        .stat-number {
            font-size: 36pt;
            font-weight: bold;
            color: #1976d2;
            line-height: 1;
        }

        .stat-label {
            font-size: 12pt;
            color: #546e7a;
            margin-top: 5px;
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

        blockquote {
            @if($rtl)
            border-right: 4px solid #ff9800;
            padding-right: 20px;
            margin-right: 10px;
            @else
            border-left: 4px solid #ff9800;
            padding-left: 20px;
            margin-left: 10px;
            @endif
            margin-top: 20px;
            margin-bottom: 20px;
            font-style: italic;
            color: #555;
            background-color: #fff8e1;
            padding-top: 15px;
            padding-bottom: 15px;
        }

        .methodology-box {
            background-color: #f5f5f5;
            padding: 20px;
            margin: 30px 0;
            border: 1px solid #ddd;
            page-break-inside: avoid;
        }

        .methodology-title {
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 15px;
            color: #1a1a1a;
        }

        .footer-section {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 3px solid #2a5298;
            font-size: 9pt;
            color: #666;
            page-break-before: always;
        }

        .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }

        .contact-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }

        .page-number {
            text-align: center;
            font-size: 9pt;
            color: #999;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <div class="cover-title">{{ $title }}</div>
        @if(isset($content->subtitle))
        <div class="cover-subtitle">{{ $content->subtitle }}</div>
        @endif
        <div class="cover-meta">
            @if(isset($content->created_at))
            <p>{{ $content->created_at->format('F Y') }}</p>
            @endif
            @if(isset($content->total_pages))
            <p>{{ $content->total_pages }} pages</p>
            @endif
        </div>
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

    <!-- Main Content -->
    <div class="content">
        {!! $body !!}
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
        <h2>Contact</h2>
        @if(isset($content->contact_info))
        <div class="contact-info">
            {!! $content->contact_info !!}
        </div>
        @endif
        
        <p style="margin-top: 30px; text-align: center; color: #999;">
            © {{ now()->year }} - Document généré le {{ now()->format('d/m/Y à H:i') }}
        </p>
    </div>
</body>
</html>