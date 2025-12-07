<?php

namespace Tests\Feature\Linking;

use App\Services\Linking\UniformDistributionService;
use App\Services\Linking\LinkPositionService;
use Tests\TestCase;

class UniformDistributionTest extends TestCase
{
    protected UniformDistributionService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new UniformDistributionService(
            app(LinkPositionService::class)
        );
    }

    public function test_analyzes_content_structure()
    {
        $content = '<p>First paragraph with some content.</p>
                    <h2>Section Title</h2>
                    <p>Second paragraph with more text here.</p>
                    <p>Third paragraph with additional content.</p>
                    <h3>Subsection</h3>
                    <p>Fourth paragraph in subsection.</p>';

        $structure = $this->service->analyzeContentStructure($content);

        $this->assertArrayHasKey('paragraphs', $structure);
        $this->assertArrayHasKey('headings', $structure);
        $this->assertEquals(4, count($structure['paragraphs']));
        $this->assertEquals(2, count($structure['headings']));
    }

    public function test_calculates_uniform_distribution()
    {
        $availableZones = [
            ['index' => 0, 'start' => 0, 'end' => 100, 'word_count' => 30],
            ['index' => 1, 'start' => 100, 'end' => 200, 'word_count' => 35],
            ['index' => 2, 'start' => 200, 'end' => 300, 'word_count' => 40],
            ['index' => 3, 'start' => 300, 'end' => 400, 'word_count' => 25],
            ['index' => 4, 'start' => 400, 'end' => 500, 'word_count' => 30],
        ];

        $distribution = $this->service->calculateUniformDistribution(3, $availableZones, 1);

        // 3 liens pour 5 zones = distribution uniforme
        $this->assertCount(3, $distribution);

        // Les liens devraient être répartis
        $positions = array_column($distribution, 'paragraph_index');
        
        // Pas de concentration excessive
        $counts = array_count_values($positions);
        foreach ($counts as $count) {
            $this->assertLessThanOrEqual(1, $count);
        }
    }

    public function test_respects_max_per_paragraph()
    {
        $availableZones = [
            ['index' => 0, 'start' => 0, 'end' => 100, 'word_count' => 50],
            ['index' => 1, 'start' => 100, 'end' => 200, 'word_count' => 50],
        ];

        // 5 liens pour 2 zones, max 2 par paragraphe
        $distribution = $this->service->calculateUniformDistribution(5, $availableZones, 2);

        // Compter les liens par paragraphe
        $counts = [];
        foreach ($distribution as $d) {
            $idx = $d['paragraph_index'];
            $counts[$idx] = ($counts[$idx] ?? 0) + 1;
        }

        foreach ($counts as $count) {
            $this->assertLessThanOrEqual(2, $count);
        }
    }

    public function test_validates_distribution()
    {
        $content = '<p>Paragraph one <a href="#">link</a> here.</p>
                    <p>Paragraph two with <a href="#">another link</a>.</p>
                    <p>Paragraph three <a href="#">link</a> present.</p>';

        $validation = $this->service->validateDistribution($content);

        $this->assertArrayHasKey('is_uniform', $validation);
        $this->assertArrayHasKey('min_per_paragraph', $validation);
        $this->assertArrayHasKey('max_per_paragraph', $validation);
        $this->assertArrayHasKey('variance', $validation);
        
        // Tous les paragraphes ont 1 lien, donc uniforme
        $this->assertTrue($validation['is_uniform']);
        $this->assertEquals(1, $validation['min_per_paragraph']);
        $this->assertEquals(1, $validation['max_per_paragraph']);
    }

    public function test_detects_non_uniform_distribution()
    {
        $content = '<p>Paragraph with <a href="#">link1</a> and <a href="#">link2</a> and <a href="#">link3</a>.</p>
                    <p>Paragraph without any links.</p>
                    <p>Another paragraph without links.</p>';

        $validation = $this->service->validateDistribution($content);

        // La distribution n'est pas uniforme (3-0-0)
        $this->assertFalse($validation['is_uniform']);
        $this->assertEquals(0, $validation['min_per_paragraph']);
        $this->assertEquals(3, $validation['max_per_paragraph']);
    }

    public function test_handles_empty_content()
    {
        $structure = $this->service->analyzeContentStructure('');

        $this->assertEmpty($structure['paragraphs']);
        $this->assertEmpty($structure['headings']);
    }

    public function test_handles_content_without_paragraphs()
    {
        $content = 'Plain text without any HTML tags at all.';

        $structure = $this->service->analyzeContentStructure($content);

        $this->assertEmpty($structure['paragraphs']);
    }

    public function test_excludes_short_paragraphs_from_zones()
    {
        $content = '<p>Short.</p>
                    <p>This is a much longer paragraph with plenty of words to make it eligible for link injection. It contains enough content to be meaningful.</p>
                    <p>OK.</p>';

        $structure = $this->service->analyzeContentStructure($content);
        
        // Le paragraphe court ne devrait pas être éligible
        $longParagraphs = array_filter($structure['paragraphs'], fn($p) => $p['word_count'] >= 20);
        
        $this->assertCount(1, $longParagraphs);
    }

    public function test_identifies_paragraphs_with_existing_links()
    {
        $content = '<p>Paragraph with <a href="#">existing link</a>.</p>
                    <p>Paragraph without any links here.</p>';

        $structure = $this->service->analyzeContentStructure($content);

        $this->assertTrue($structure['paragraphs'][0]['has_links']);
        $this->assertFalse($structure['paragraphs'][1]['has_links']);
    }

    public function test_counts_words_correctly()
    {
        $content = '<p>One two three four five six seven eight nine ten.</p>';

        $structure = $this->service->analyzeContentStructure($content);

        $this->assertEquals(10, $structure['paragraphs'][0]['word_count']);
    }

    public function test_handles_nested_html()
    {
        $content = '<p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>';

        $structure = $this->service->analyzeContentStructure($content);

        $this->assertCount(1, $structure['paragraphs']);
        // Le comptage de mots ignore les balises
        $this->assertGreaterThan(0, $structure['paragraphs'][0]['word_count']);
    }

    public function test_identifies_all_heading_levels()
    {
        $content = '<h2>H2 Title</h2>
                    <h3>H3 Title</h3>
                    <h4>H4 Title</h4>';

        $structure = $this->service->analyzeContentStructure($content);

        $this->assertCount(3, $structure['headings']);
        
        $levels = array_column($structure['headings'], 'level');
        $this->assertContains('2', $levels);
        $this->assertContains('3', $levels);
        $this->assertContains('4', $levels);
    }

    public function test_calculates_variance_correctly()
    {
        // Test avec distribution [1, 1, 1] - variance = 0
        $content = '<p><a href="#">l1</a> text.</p>
                    <p><a href="#">l2</a> text.</p>
                    <p><a href="#">l3</a> text.</p>';

        $validation = $this->service->validateDistribution($content);
        
        $this->assertEquals(0, $validation['variance']);
    }

    public function test_distribution_with_more_zones_than_links()
    {
        $zones = [];
        for ($i = 0; $i < 10; $i++) {
            $zones[] = ['index' => $i, 'start' => $i * 100, 'end' => ($i + 1) * 100, 'word_count' => 30];
        }

        // 3 liens pour 10 zones
        $distribution = $this->service->calculateUniformDistribution(3, $zones, 1);

        $this->assertCount(3, $distribution);

        // Les liens devraient être espacés uniformément
        $indices = array_column($distribution, 'paragraph_index');
        
        // Vérifier que les indices sont différents
        $this->assertCount(3, array_unique($indices));
    }

    public function test_distribution_with_more_links_than_zones()
    {
        $zones = [
            ['index' => 0, 'start' => 0, 'end' => 100, 'word_count' => 50],
            ['index' => 1, 'start' => 100, 'end' => 200, 'word_count' => 50],
        ];

        // 5 liens pour 2 zones, max 3 par paragraphe
        $distribution = $this->service->calculateUniformDistribution(5, $zones, 3);

        // On devrait avoir au maximum 6 positions (2 zones × 3 max)
        // Mais seulement 5 liens demandés
        $this->assertCount(5, $distribution);
    }
}
