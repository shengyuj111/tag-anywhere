import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { H3 } from "../ui/typography";
import { EditableText } from "./editable-text";
import { useMemo } from "react";

interface BackableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children?: React.ReactNode;
  onEditSubmit?: (value: string) => void;
}

export const BackableHeader = ({
  children,
  title,
  onEditSubmit,
}: BackableHeaderProps) => {
  const navigate = useNavigate();
  const editable = useMemo(() => onEditSubmit !== undefined, [onEditSubmit]);

  return (
    <div className="flex items-center w-full gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
        <ChevronLeftIcon className="w-8 h-8" />
      </Button>
      <EditableText
        text={title}
        onEditSubmit={(value) => {
          onEditSubmit && onEditSubmit(value);
        }}
        editable={editable}
        renderText={(text) => {
          return <H3 className="truncate">{text}</H3>;
        }}
      />
      {children}
    </div>
  );
};
