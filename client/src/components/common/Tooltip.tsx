import { cn } from "../../utils";

export default function Tooltip({ 
  children, 
  content,
  className = "" 
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  return (
    <div className="group/tooltip relative">
      {children}
      <div className={cn(
        "invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100",
        "absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full",
        "px-2 py-1 bg-gray-900 text-white text-xs rounded",
        "whitespace-nowrap transition-all duration-200",
        className
      )}>
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[1px] border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
