<!DOCTYPE html>
<html lang="{{ $languageCode }}" @if($isRtl) dir="rtl" @endif>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $pressRelease->title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px;
        }

        @if($isRtl)
        body {
            direction: rtl;
            text-align: right;
        }
        @endif

        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .platform-name {
            font-size: 18pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .release-date {
            font-size: 10pt;
            color: #666;
        }

        .title {
            font-size: 20pt;
            font-weight: bold;
            color: #1e293b;
            margin: 30px 0 20px 0;
            line-height: 1.3;
        }

        .lead {
            font-size: 12pt;
            font-weight: 600;
            color: #334155;
            margin-bottom: 25px;
            line-height: 1.7;
        }

        .body-section {
            margin-bottom: 20px;
            text-align: justify;
        }

        .quote {
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            font-style: italic;
            color: #475569;
        }

        @if($isRtl)
        .quote {
            border-left: none;
            border-right: 4px solid #2563eb;
        }
        @endif

        .quote-text {
            margin-bottom: 10px;
            line-height: 1.7;
        }

        .quote-attribution {
            font-weight: 600;
            font-style: normal;
            color: #1e293b;
        }

        .media-container {
            margin: 25px 0;
            text-align: center;
        }

        .media-image {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }

        .media-caption {
            font-size: 9pt;
            color: #64748b;
            margin-top: 8px;
            font-style: italic;
        }

        .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1e293b;
            margin: 30px 0 15px 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
        }

        .boilerplate {
            background: #f8fafc;
            padding: 20px;
            border-radius: 4px;
            margin: 30px 0;
        }

        .contact-info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }

        .contact-item {
            margin-bottom: 8px;
            font-size: 10pt;
        }

        .contact-label {
            font-weight: 600;
            color: #475569;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            font-size: 9pt;
            color: #94a3b8;
            text-align: center;
        }

        @media print {
            body {
                padding: 20px;
            }
            
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="platform-name">{{ $platform->name }}</div>
        <div class="release-date">
            @if($pressRelease->published_at)
                {{ $pressRelease->published_at->format('d/m/Y') }}
            @else
                {{ now()->format('d/m/Y') }}
            @endif
        </div>
    </div>

    <!-- Title -->
    <h1 class="title">{{ $pressRelease->title }}</h1>

    <!-- Lead -->
    <div class="lead">
        {!! nl2br(e($pressRelease->lead)) !!}
    </div>

    <!-- Body Sections -->
    <div class="body-section">
        {!! nl2br(e($pressRelease->body1)) !!}
    </div>

    @if($pressRelease->body2)
    <div class="body-section">
        {!! nl2br(e($pressRelease->body2)) !!}
    </div>
    @endif

    @if($pressRelease->body3)
    <div class="body-section">
        {!! nl2br(e($pressRelease->body3)) !!}
    </div>
    @endif

    <!-- Media (Photos/Charts) -->
    @if($pressRelease->media->count() > 0)
        @foreach($pressRelease->media as $media)
        <div class="media-container">
            @if(file_exists(storage_path('app/' . $media->file_path)))
                <img src="{{ storage_path('app/' . $media->file_path) }}" 
                     alt="{{ $media->caption }}" 
                     class="media-image">
            @endif
            @if($media->caption)
                <div class="media-caption">{{ $media->caption }}</div>
            @endif
        </div>
        @endforeach
    @endif

    <!-- Quote -->
    @if($pressRelease->quote)
    <div class="quote">
        <div class="quote-text">"{{ $pressRelease->quote }}"</div>
    </div>
    @endif

    <!-- About Section -->
    <h2 class="section-title">
        @if($languageCode === 'fr') À propos
        @elseif($languageCode === 'en') About
        @elseif($languageCode === 'de') Über uns
        @elseif($languageCode === 'es') Acerca de
        @elseif($languageCode === 'pt') Sobre
        @elseif($languageCode === 'ru') О нас
        @elseif($languageCode === 'zh') 关于
        @elseif($languageCode === 'ar') حول
        @elseif($languageCode === 'hi') के बारे में
        @else About
        @endif
    </h2>
    
    <div class="boilerplate">
        {!! nl2br(e($pressRelease->boilerplate)) !!}
    </div>

    <!-- Contact -->
    @if($pressRelease->contact)
    <div class="contact-info">
        <h2 class="section-title">
            @if($languageCode === 'fr') Contact
            @elseif($languageCode === 'en') Contact
            @elseif($languageCode === 'de') Kontakt
            @elseif($languageCode === 'es') Contacto
            @elseif($languageCode === 'pt') Contato
            @elseif($languageCode === 'ru') Контакт
            @elseif($languageCode === 'zh') 联系方式
            @elseif($languageCode === 'ar') اتصل
            @elseif($languageCode === 'hi') संपर्क
            @else Contact
            @endif
        </h2>
        
        @if(!empty($pressRelease->contact['name']))
        <div class="contact-item">
            <span class="contact-label">{{ $pressRelease->contact['name'] }}</span>
        </div>
        @endif
        
        @if(!empty($pressRelease->contact['email']))
        <div class="contact-item">
            <span class="contact-label">Email:</span> {{ $pressRelease->contact['email'] }}
        </div>
        @endif
        
        @if(!empty($pressRelease->contact['phone']))
        <div class="contact-item">
            <span class="contact-label">
                @if($languageCode === 'fr') Tél:
                @elseif($languageCode === 'en') Tel:
                @elseif($languageCode === 'de') Tel:
                @elseif($languageCode === 'es') Tel:
                @elseif($languageCode === 'pt') Tel:
                @elseif($languageCode === 'ru') Тел:
                @elseif($languageCode === 'zh') 电话:
                @elseif($languageCode === 'ar') هاتف:
                @elseif($languageCode === 'hi') फोन:
                @else Tel:
                @endif
            </span> {{ $pressRelease->contact['phone'] }}
        </div>
        @endif
    </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        {{ $platform->name }} - {{ $platform->url ?? '' }}
    </div>
</body>
</html>