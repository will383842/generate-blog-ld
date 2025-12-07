import type { Article, ArticleStatus } from './article';
import type { PlatformId, LanguageCode } from './program';

export type ComparativeType =
	| 'product'
	| 'service'
	| 'provider'
	| 'location'
	| 'method'
	| 'general';

export type CriteriaType =
	| 'numeric'
	| 'boolean'
	| 'rating'
	| 'text'
	| 'price'
	| 'percentage'
	| 'select';

export type ScoringMethod = 'weighted_average' | 'simple_average' | 'sum' | 'none';

export interface CriteriaValue {
	criteriaId?: string;
	value: string | number | boolean;
	displayValue?: string | number | boolean;
	normalizedScore?: number;
}

export interface ComparisonCriteria {
	id: string;
	comparativeId: string;
	name: string;
	description?: string;
	type: CriteriaType;
	weight: number;
	higherIsBetter: boolean;
	isVisible: boolean;
	order: number;
	min?: number;
	max?: number;
	options?: string[];
	unit?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ComparisonItem {
	id: string;
	comparativeId: string;
	name: string;
	description?: string;
	imageUrl?: string;
	order: number;
	score: number;
	rank?: number;
	values: Record<string, CriteriaValue>;
	isWinner?: boolean;
	isHighlighted?: boolean;
	highlightLabel?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface Comparative extends Article {
	comparativeType: ComparativeType;
	items: ComparisonItem[];
	criteria: ComparisonCriteria[];
	scoringMethod: ScoringMethod;
	winnerId?: string;
	highlightWinner?: boolean;
	showScores?: boolean;
	verdictText?: string;
	status: ArticleStatus;
}

export interface ComparativeWithRelations extends Comparative {
	translations?: Article[];
	relatedArticles?: Article[];
}

export interface ComparativeFilters {
	page?: number;
	perPage?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	platformId?: PlatformId;
	countryId?: string;
	languageId?: LanguageCode;
	comparativeType?: ComparativeType;
	status?: ArticleStatus;
	search?: string;
}

export interface CreateComparativeInput {
	title: string;
	comparativeType: ComparativeType;
	platformId: PlatformId;
	countryId: string;
	languageId: LanguageCode;
	slug?: string;
	excerpt?: string;
	content?: string;
	metaTitle?: string;
	metaDescription?: string;
	items?: ComparisonItem[];
	criteria?: ComparisonCriteria[];
	scoringMethod?: ScoringMethod;
	highlightWinner?: boolean;
	showScores?: boolean;
	verdictText?: string;
}

export interface UpdateCriteriaInput {
	comparativeId: string;
	criteria: ComparisonCriteria[];
}

export interface UpdateItemsInput {
	comparativeId: string;
	items: ComparisonItem[];
}

export interface ComparativeListResponse {
	data: Comparative[];
	meta: {
		current_page: number;
		last_page: number;
		per_page: number;
		total: number;
	};
}

export interface CriteriaTemplate {
	id: string;
	name: string;
	description?: string;
	criteria: ComparisonCriteria[];
	createdAt: string;
	updatedAt: string;
}
