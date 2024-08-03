import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { H3 } from "../ui/typography";

interface BackableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children?: React.ReactNode;
}

export const BackableHeader = ({ children, title }: BackableHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center w-full gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
        <ChevronLeftIcon className="w-8 h-8" />
      </Button>
      <H3 className="truncate">{title}</H3>
      {children}
    </div>
  );
};
