<?php

namespace Database\Factories;

use App\Models\PlatformKnowledge;
use App\Models\Platform;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory pour créer des PlatformKnowledge dans les tests
 * 
 * Fichier: database/factories/PlatformKnowledgeFactory.php
 */
class PlatformKnowledgeFactory extends Factory
{
    protected $model = PlatformKnowledge::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'platform_id' => Platform::factory(),
            'knowledge_type' => $this->faker->randomElement(PlatformKnowledge::TYPES),
            'title' => $this->faker->sentence(3),
            'content' => $this->faker->paragraph(5),
            'language_code' => $this->faker->randomElement(['fr', 'en', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'hi']),
            'priority' => $this->faker->numberBetween(0, 100),
            'is_active' => true,
            'use_in_articles' => $this->faker->boolean(80),
            'use_in_landings' => $this->faker->boolean(70),
            'use_in_comparatives' => $this->faker->boolean(60),
            'use_in_pillars' => $this->faker->boolean(50),
            'use_in_press' => $this->faker->boolean(40),
        ];
    }

    /**
     * État: Facts (faits)
     */
    public function facts(): self
    {
        return $this->state(fn (array $attributes) => [
            'knowledge_type' => 'facts',
            'title' => 'Faits et chiffres clés',
            'content' => '304 millions d\'expatriés, 197 pays couverts, réponse en moins de 5 minutes, 2500+ avocats vérifiés',
            'priority' => 100,
        ]);
    }

    /**
     * État: About (à propos)
     */
    public function about(): self
    {
        return $this->state(fn (array $attributes) => [
            'knowledge_type' => 'about',
            'title' => 'À propos',
            'priority' => 100,
        ]);
    }

    /**
     * État: Tone (ton de communication)
     */
    public function tone(): self
    {
        return $this->state(fn (array $attributes) => [
            'knowledge_type' => 'tone',
            'title' => 'Ton de communication',
            'content' => 'Rassurant, professionnel, empathique. Vouvoiement obligatoire.',
            'priority' => 85,
        ]);
    }

    /**
     * État: Vocabulary (vocabulaire)
     */
    public function vocabulary(): self
    {
        return $this->state(fn (array $attributes) => [
            'knowledge_type' => 'vocabulary',
            'title' => 'Vocabulaire',
            'content' => 'TOUJOURS : consultation juridique, avocat vérifié, expatrié. JAMAIS : immigrant, sans-papiers, rendez-vous.',
            'priority' => 70,
        ]);
    }

    /**
     * État: Don'ts (interdictions)
     */
    public function donts(): self
    {
        return $this->state(fn (array $attributes) => [
            'knowledge_type' => 'donts',
            'title' => 'Interdictions',
            'content' => 'JAMAIS humour sur situations juridiques. JAMAIS phrases >25 mots. JAMAIS tutoiement.',
            'priority' => 100,
        ]);
    }

    /**
     * État: Actif
     */
    public function active(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * État: Inactif
     */
    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * État: Pour articles
     */
    public function forArticles(): self
    {
        return $this->state(fn (array $attributes) => [
            'use_in_articles' => true,
            'use_in_landings' => false,
            'use_in_comparatives' => false,
            'use_in_pillars' => false,
            'use_in_press' => false,
        ]);
    }

    /**
     * État: Pour tous types de contenu
     */
    public function forAllContent(): self
    {
        return $this->state(fn (array $attributes) => [
            'use_in_articles' => true,
            'use_in_landings' => true,
            'use_in_comparatives' => true,
            'use_in_pillars' => true,
            'use_in_press' => true,
        ]);
    }

    /**
     * État: Français
     */
    public function french(): self
    {
        return $this->state(fn (array $attributes) => [
            'language_code' => 'fr',
        ]);
    }

    /**
     * État: Anglais
     */
    public function english(): self
    {
        return $this->state(fn (array $attributes) => [
            'language_code' => 'en',
        ]);
    }

    /**
     * État: Espagnol
     */
    public function spanish(): self
    {
        return $this->state(fn (array $attributes) => [
            'language_code' => 'es',
        ]);
    }
}

/*
 * EXEMPLES D'UTILISATION DANS LES TESTS:
 * 
 * // Créer 1 knowledge basique
 * $knowledge = PlatformKnowledge::factory()->create();
 * 
 * // Créer 10 knowledge
 * $knowledge = PlatformKnowledge::factory()->count(10)->create();
 * 
 * // Créer facts en français
 * $knowledge = PlatformKnowledge::factory()
 *     ->facts()
 *     ->french()
 *     ->create();
 * 
 * // Créer tone actif pour articles
 * $knowledge = PlatformKnowledge::factory()
 *     ->tone()
 *     ->active()
 *     ->forArticles()
 *     ->create();
 * 
 * // Créer avec plateforme spécifique
 * $platform = Platform::find(1);
 * $knowledge = PlatformKnowledge::factory()
 *     ->for($platform)
 *     ->create();
 * 
 * // Créer 5 knowledge de différents types
 * $knowledge = PlatformKnowledge::factory()
 *     ->count(5)
 *     ->forAllContent()
 *     ->create();
 * 
 * // Créer avec override
 * $knowledge = PlatformKnowledge::factory()->create([
 *     'title' => 'Titre custom',
 *     'priority' => 95,
 * ]);
 * 
 * // Créer complet pour une plateforme
 * $platform = Platform::find(1);
 * 
 * PlatformKnowledge::factory()
 *     ->facts()
 *     ->french()
 *     ->for($platform)
 *     ->create();
 * 
 * PlatformKnowledge::factory()
 *     ->tone()
 *     ->french()
 *     ->for($platform)
 *     ->create();
 * 
 * PlatformKnowledge::factory()
 *     ->vocabulary()
 *     ->french()
 *     ->for($platform)
 *     ->create();
 * 
 * // Total: 3 knowledge pour tests complets
 */