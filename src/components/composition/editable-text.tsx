import { useState } from "react";
import { Visibility } from "../ui/visibility";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CheckIcon, XIcon } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  text: string | undefined;
  className?: string;
  onEditSubmit: (value: string) => void;
  renderText: (text: string | undefined) => React.ReactNode;
  useTextField?: boolean;
  editable?: boolean;
}

export const EditableText = ({ className, onEditSubmit, renderText, text, useTextField = false, editable = true }: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text ?? "");

  const handleEditSubmit = () => {
    onEditSubmit(value);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    if (!editable) return;
    setIsEditing(true);
    setValue(text ?? "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSubmit();
    }
  };

  return (
    <div className={className} onDoubleClick={handleDoubleClick}>
      <Visibility isVisible={!isEditing}>
        {renderText(text)}
      </Visibility>
      <Visibility isVisible={isEditing}>
        <div className={cn("flex gap-2", useTextField ? "flex-col items-end" : "items-center")}>
          <Visibility isVisible={!useTextField}>
            <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} />
          </Visibility>
          <Visibility isVisible={useTextField}>
            <Textarea className="h-full" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown} />
          </Visibility>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditSubmit}>
              <CheckIcon className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleEditCancel}>
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Visibility>
    </div>
  );
};
