export type CohortLabelItem = {
  _id: string;
  title: string;
  status?: string;
};

interface CohortLabelProps {
  cohort: CohortLabelItem;
  showStatus?: boolean;
  className?: string;
}

export function CohortLabel({ cohort, showStatus = false, className = "" }: CohortLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{cohort.title}</span>
        {showStatus && cohort.status && (
          <span className="text-xs text-muted-foreground capitalize">{cohort.status}</span>
        )}
      </div>
    </div>
  );
}

