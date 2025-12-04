<!DOCTYPE html>
<html lang="{{ $language }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $dossier->title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            @if($lang_config['rtl'])
            font-family: '{{ $lang_config['font_family'] }}', Arial, sans-serif;
            @else
            font-family: '{{ $lang_config['font_family'] }}', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            @endif
        }

        @if($lang_config['rtl'])
        body {
            direction: rtl;
            text-align: right;
        }
        @endif

        body {
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }

        /* Page de couverture */
        .cover-page {
            page-break-after: always;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
        }

        .cover-page h1 {
            font-size: 42pt;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .cover-page h2 {
            font-size: 24pt;
            font-weight: 300;
            margin-bottom: 40px;
            opacity: 0.9;
        }

        .cover-page .platform-name {
            font-size: 18pt;
            margin-top: 60px;
            opacity: 0.8;
        }

        /* Table des matières */
        .toc-page {
            page-break-after: always;
            padding: 40px;
        }

        .toc-page h2 {
            font-size: 28pt;
            margin-bottom: 30px;
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        .toc-list {
            list-style: none;
            padding: 0;
        }

        .toc-list li {
            padding: 12px 0;
            border-bottom: 1px dotted #ddd;
            font-size: 12pt;
        }

        .toc-list li .page-number {
            float: right;
            font-weight: bold;
            color: #667eea;
        }

        /* Sections */
        .section {
            page-break-before: always;
            padding: 40px;
        }

        .section h2 {
            font-size: 24pt;
            color: #667eea;
            margin-bottom: 20px;
            border-left: 5px solid #667eea;
            padding-left: 15px;
        }

        .section h3 {
            font-size: 18pt;
            color: #764ba2;
            margin-top: 25px;
            margin-bottom: 15px;
        }

        .section h4 {
            font-size: 14pt;
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .section p {
            margin-bottom: 15px;
            text-align: justify;
            font-size: 11pt;
            line-height: 1.8;
        }

        .section ul, .section ol {
            margin: 15px 0 15px 30px;
        }

        .section li {
            margin-bottom: 8px;
            line-height: 1.6;
        }

        /* Tableaux */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
        }

        table thead {
            background: #667eea;
            color: white;
        }

        table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
        }

        table tbody tr:nth-child(even) {
            background: #f9f9f9;
        }

        table tbody tr:hover {
            background: #f0f0f0;
        }

        /* Images */
        .media-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .media-caption {
            text-align: center;
            font-style: italic;
            color: #666;
            font-size: 9pt;
            margin-top: 8px;
            margin-bottom: 20px;
        }

        /* Footer global */
        .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: #f5f5f5;
            border-top: 2px solid #667eea;
            padding: 10px 40px;
            font-size: 9pt;
            color: #666;
        }

        .page-footer .left {
            float: left;
        }

        .page-footer .right {
            float: right;
        }

        /* Print optimizations */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }

        /* Blockquotes */
        blockquote {
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #555;
            background: #f9f9f9;
            padding: 15px 20px;
            border-radius: 4px;
        }

        /* Highlight boxes */
        .highlight-box {
            background: #fff9e6;
            border: 2px solid #ffd700;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }

        /* Stats cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
        }

        .stat-card .value {
            font-size: 32pt;
            font-weight: bold;
            display: block;
            margin-bottom: 10px;
        }

        .stat-card .label {
            font-size: 11pt;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    {{-- Page de couverture --}}
    <div class="cover-page">
        <h1>{{ $dossier->title }}</h1>
        
        @if($dossier->subtitle)
        <h2>{{ $dossier->subtitle }}</h2>
        @endif

        <div class="platform-name">{{ $platform->name }}</div>
    </div>

    {{-- Table des matières --}}
    <div class="toc-page">
        <h2>{{ $language === 'fr' ? 'Table des Matières' : 'Table of Contents' }}</h2>
        <ul class="toc-list">
            @foreach($dossier->sections as $index => $section)
                @if($section->show_in_toc && $section->section_type !== 'cover')
                <li>
                    <span class="toc-title">{{ $section->title }}</span>
                    <span class="page-number">{{ $section->page_number }}</span>
                </li>
                @endif
            @endforeach
        </ul>
    </div>

    {{-- Sections du dossier --}}
    @foreach($dossier->sections as $section)
        @if($section->section_type !== 'cover' && $section->content)
        <div class="section">
            <h2>{{ $section->title }}</h2>
            
            {!! $section->content !!}

            {{-- Médias attachés à cette section --}}
            @if($section->media->isNotEmpty())
                @foreach($section->media as $media)
                    @if($media->isImage() && $media->fileExists())
                    <div class="media-container">
                        <img src="{{ Storage::path($media->file_path) }}" 
                             alt="{{ $media->alt_text ?? $media->caption }}"
                             class="media-image">
                        @if($media->caption)
                        <p class="media-caption">{{ $media->caption }}</p>
                        @endif
                    </div>
                    @endif
                @endforeach
            @endif
        </div>
        @endif
    @endforeach

    {{-- Footer sur chaque page --}}
    <div class="page-footer">
        <span class="left">{{ $platform->name }} - {{ $dossier->title }}</span>
        <span class="right">{{ now()->format('d/m/Y') }}</span>
    </div>
</body>
</html>