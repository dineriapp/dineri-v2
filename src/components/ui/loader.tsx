import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

type LoaderProps = {
  text?: string;
  className?: string;
  fullScreen?: boolean;
  size?: number;
};

const Loader = ({ text, className, fullScreen = true, size = 24 }: LoaderProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        fullScreen && "min-h-screen flex items-center justify-center",
        !fullScreen && "flex items-center justify-center py-6",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-white">
        <LoaderIcon className="animate-spin" style={{ width: size, height: size }} />

        {text && <p className="text-sm animate-pulse tracking-wide">{text}</p>}
      </div>
    </div>
  );
};

export default Loader;
