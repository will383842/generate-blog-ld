import { } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { Filter, X, Calendar as CalendarIcon, User, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface ActivityFiltersValue {
  search?: string;
  type?: string;
  user?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

export interface ActivityFiltersProps {
  value: ActivityFiltersValue;
  onChange: (value: ActivityFiltersValue) => void;
  onReset?: () => void;
  activityTypes?: { value: string; label: string }[];
  users?: { id: string; name: string }[];
  availableTags?: string[];
  className?: string;
}

const defaultActivityTypes = [
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'publish', label: 'Published' },
  { value: 'login', label: 'Login' },
  { value: 'export', label: 'Export' },
];

export function ActivityFilters({
  value,
  onChange,
  onReset,
  activityTypes = defaultActivityTypes,
  users = [],
  availableTags = [],
  className,
}: ActivityFiltersProps) {
  const { t } = useTranslation('common');

  const activeFiltersCount = [
    value.type,
    value.user,
    value.dateFrom,
    value.dateTo,
    value.tags?.length,
  ].filter(Boolean).length;

  const handleChange = (key: keyof ActivityFiltersValue, val: ActivityFiltersValue[keyof ActivityFiltersValue]) => {
    onChange({ ...value, [key]: val });
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = value.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    handleChange('tags', newTags);
  };

  const handleReset = () => {
    onChange({});
    onReset?.();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and main filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t('form.search')}
            value={value.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Activity type */}
        <Select
          value={value.type || ''}
          onValueChange={(val) => handleChange('type', val || undefined)}
        >
          <SelectTrigger className="w-[150px]">
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User filter */}
        {users.length > 0 && (
          <Select
            value={value.user || ''}
            onValueChange={(val) => handleChange('user', val || undefined)}
          >
            <SelectTrigger className="w-[150px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {value.dateFrom ? (
                value.dateTo ? (
                  <>
                    {format(value.dateFrom, 'LLL dd')} -{' '}
                    {format(value.dateTo, 'LLL dd')}
                  </>
                ) : (
                  format(value.dateFrom, 'LLL dd, y')
                )
              ) : (
                'Select dates'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-3">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Calendar
                  mode="single"
                  selected={value.dateFrom}
                  onSelect={(date) => handleChange('dateFrom', date)}
                />
              </div>
              <div className="p-3">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Calendar
                  mode="single"
                  selected={value.dateTo}
                  onSelect={(date) => handleChange('dateTo', date)}
                  disabled={(date) =>
                    value.dateFrom ? date < value.dateFrom : false
                  }
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset button */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tags row */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Badge
              key={tag}
              variant={value.tags?.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleToggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Active filters summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{activeFiltersCount} filter(s) active</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={handleReset}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export default ActivityFilters;
