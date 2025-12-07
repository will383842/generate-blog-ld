import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Monitor,
  Tablet,
  Smartphone,
  X,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Separator } from '@/components/ui/Separator';
import {
  LandingSection,
  LandingSectionType,
  HeroSectionConfig,
  FeaturesSectionConfig,
  TestimonialsSectionConfig,
  PricingSectionConfig,
  FaqSectionConfig,
  StatisticsSectionConfig,
  GallerySectionConfig,
  TeamSectionConfig,
  PartnersSectionConfig,
  ContactSectionConfig,
} from '@/types/landing';
import { cn } from '@/lib/utils';

interface SectionPreviewProps {
  section: LandingSection;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

const SECTION_TYPE_LABELS: Record<LandingSectionType, string> = {
  hero: 'Hero',
  features: 'Fonctionnalités',
  testimonials: 'Témoignages',
  pricing: 'Tarifs',
  cta: 'Appel à l\'action',
  faq: 'FAQ',
  custom: 'Personnalisé',
  statistics: 'Statistiques',
  gallery: 'Galerie',
  comparison: 'Comparaison',
  team: 'Équipe',
  partners: 'Partenaires',
  contact: 'Contact',
};

export const SectionPreview: React.FC<SectionPreviewProps> = ({
  section,
  open,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation(['landing', 'common']);
  const [device, setDevice] = useState<DeviceType>('desktop');

  // Render section based on type
  const renderSection = () => {
    switch (section.type) {
      case 'hero':
        return <HeroPreview section={section} />;
      case 'features':
        return <FeaturesPreview section={section} />;
      case 'testimonials':
        return <TestimonialsPreview section={section} />;
      case 'pricing':
        return <PricingPreview section={section} />;
      case 'cta':
        return <CtaPreview section={section} />;
      case 'faq':
        return <FaqPreview section={section} />;
      case 'statistics':
        return <StatisticsPreview section={section} />;
      case 'gallery':
        return <GalleryPreview section={section} />;
      case 'team':
        return <TeamPreview section={section} />;
      case 'partners':
        return <PartnersPreview section={section} />;
      case 'contact':
        return <ContactPreview section={section} />;
      default:
        return <CustomPreview section={section} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>{section.title}</DialogTitle>
              <Badge variant="secondary">
                {SECTION_TYPE_LABELS[section.type] || section.type}
              </Badge>
              {!section.isVisible && (
                <Badge variant="outline" className="text-amber-600">
                  Masqué
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Device Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={device === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDevice('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={device === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDevice('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={device === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common:edit')}
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Container */}
        <div className="flex-1 overflow-auto bg-muted/30 p-8">
          <div className="flex justify-center">
            <div
              className={cn(
                'bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300',
                DEVICE_WIDTHS[device]
              )}
              style={{
                backgroundColor: section.backgroundColor || undefined,
              }}
            >
              {renderSection()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Section Type Previews

const HeroPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as HeroSectionConfig | undefined;
  
  return (
    <div
      className={cn(
        'relative min-h-[400px] flex items-center',
        config?.alignment === 'center' && 'justify-center text-center',
        config?.alignment === 'right' && 'justify-end text-right'
      )}
      style={{
        backgroundImage: config?.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {config?.overlay && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: config?.overlayColor || 'rgba(0,0,0,0.5)' }}
        />
      )}
      <div className="relative z-10 p-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">{section.title}</h1>
        {section.subtitle && (
          <p className="text-xl text-muted-foreground mb-6">{section.subtitle}</p>
        )}
        {section.content && (
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        )}
        {config?.cta && (
          <Button size="lg" className="mt-4">
            {config.cta.text}
          </Button>
        )}
      </div>
    </div>
  );
};

const FeaturesPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as FeaturesSectionConfig | undefined;
  const features = config?.features || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
        {section.subtitle && (
          <p className="text-muted-foreground">{section.subtitle}</p>
        )}
      </div>
      <div className={cn(
        'grid gap-6',
        config?.columns === 2 && 'grid-cols-2',
        config?.columns === 3 && 'grid-cols-3',
        config?.columns === 4 && 'grid-cols-4',
        !config?.columns && 'grid-cols-3'
      )}>
        {features.length > 0 ? features.map((feature, index) => (
          <div key={index} className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">{feature.icon || '✨'}</span>
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        )) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Configurez les fonctionnalités
          </div>
        )}
      </div>
    </div>
  );
};

const TestimonialsPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as TestimonialsSectionConfig | undefined;
  const testimonials = config?.testimonials || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
        {section.subtitle && (
          <p className="text-muted-foreground">{section.subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.length > 0 ? testimonials.map((testimonial, index) => (
          <div key={index} className="bg-muted/30 rounded-lg p-6">
            <p className="italic mb-4">"{testimonial.quote}"</p>
            <div className="flex items-center gap-3">
              {testimonial.avatar && (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{testimonial.author}</p>
                {testimonial.role && (
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Configurez les témoignages
          </div>
        )}
      </div>
    </div>
  );
};

const PricingPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as PricingSectionConfig | undefined;
  const plans = config?.plans || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
        {section.subtitle && (
          <p className="text-muted-foreground">{section.subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.length > 0 ? plans.map((plan, index) => (
          <div
            key={index}
            className={cn(
              'rounded-lg border p-6',
              plan.highlighted && 'border-primary ring-2 ring-primary'
            )}
          >
            {plan.badge && (
              <Badge className="mb-4">{plan.badge}</Badge>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-3xl font-bold my-4">
              {config?.currency || '€'}{plan.priceMonthly}
              <span className="text-sm font-normal text-muted-foreground">/mois</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features?.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
              {plan.cta?.text || 'Choisir'}
            </Button>
          </div>
        )) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Configurez les plans tarifaires
          </div>
        )}
      </div>
    </div>
  );
};

const CtaPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  return (
    <div className="p-8 bg-primary/5 text-center">
      <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
      {section.subtitle && (
        <p className="text-muted-foreground mb-6">{section.subtitle}</p>
      )}
      {section.content && (
        <div className="mb-6" dangerouslySetInnerHTML={{ __html: section.content }} />
      )}
      <Button size="lg">
        Commencer maintenant
      </Button>
    </div>
  );
};

const FaqPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as FaqSectionConfig | undefined;
  const items = config?.items || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
        {section.subtitle && (
          <p className="text-muted-foreground">{section.subtitle}</p>
        )}
      </div>
      <div className="max-w-2xl mx-auto space-y-4">
        {items.length > 0 ? items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="font-medium">{item.question}</h3>
            <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
          </div>
        )) : (
          <div className="text-center text-muted-foreground py-8">
            Configurez les questions
          </div>
        )}
      </div>
    </div>
  );
};

const StatisticsPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as StatisticsSectionConfig | undefined;
  const stats = config?.stats || [];

  return (
    <div className="p-8 bg-muted/30">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.length > 0 ? stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-4xl font-bold text-primary">
              {stat.prefix}{stat.value}{stat.suffix}
            </p>
            <p className="text-muted-foreground">{stat.label}</p>
          </div>
        )) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Configurez les statistiques
          </div>
        )}
      </div>
    </div>
  );
};

const GalleryPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as GallerySectionConfig | undefined;
  const images = config?.images || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.length > 0 ? images.map((image, index) => (
          <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img src={image.url} alt={image.alt || ''} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          </div>
        )) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Configurez la galerie
          </div>
        )}
      </div>
    </div>
  );
};

const TeamPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as TeamSectionConfig | undefined;
  const members = config?.members || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {members.length > 0 ? members.map((member, index) => (
          <div key={index} className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted overflow-hidden">
              {member.avatar && (
                <img src={member.avatar} alt={member.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              )}
            </div>
            <h3 className="font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
        )) : (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Configurez l'équipe
          </div>
        )}
      </div>
    </div>
  );
};

const PartnersPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as PartnersSectionConfig | undefined;
  const partners = config?.partners || [];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-8">
        {partners.length > 0 ? partners.map((partner, index) => (
          <div key={index} className={cn('h-12', config?.grayscale && 'grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition')}>
            <img src={partner.logo} alt={partner.name} loading="lazy" decoding="async" className="h-full" />
          </div>
        )) : (
          <div className="text-center text-muted-foreground py-8">
            Configurez les partenaires
          </div>
        )}
      </div>
    </div>
  );
};

const ContactPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  const config = section.config as ContactSectionConfig | undefined;
  const fields = config?.fields || [];
  
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{section.title}</h2>
        {section.subtitle && (
          <p className="text-muted-foreground">{section.subtitle}</p>
        )}
      </div>
      <div className="max-w-md mx-auto space-y-4">
        {fields.length > 0 ? fields.map((field, index) => (
          <div key={index}>
            <label className="text-sm font-medium">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea className="w-full mt-1 p-2 border rounded-lg" rows={4} />
            ) : (
              <input type={field.type} className="w-full mt-1 p-2 border rounded-lg" />
            )}
          </div>
        )) : (
          <>
            <input type="text" placeholder="Nom" className="w-full p-2 border rounded-lg" />
            <input type="email" placeholder="Email" className="w-full p-2 border rounded-lg" />
            <textarea placeholder="Message" className="w-full p-2 border rounded-lg" rows={4} />
          </>
        )}
        <Button className="w-full">{config?.submitText || 'Envoyer'}</Button>
      </div>
    </div>
  );
};

const CustomPreview: React.FC<{ section: LandingSection }> = ({ section }) => {
  return (
    <div className="p-8">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold">{section.title}</h2>
      </div>
      {section.content ? (
        <div dangerouslySetInnerHTML={{ __html: section.content }} />
      ) : (
        <div className="text-center text-muted-foreground py-8">
          Contenu personnalisé
        </div>
      )}
    </div>
  );
};

export default SectionPreview;
