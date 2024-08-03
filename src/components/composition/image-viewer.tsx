import { cn } from "@/lib/utils";

import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { appWindow } from "@tauri-apps/api/window";
import Image from "../ui/image";
import { Button } from "../ui/button";
import { Visibility } from "../ui/visibility";

interface ImageViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  className?: string;
}

export const ImageViewer = ({ src, className, ...props }: ImageViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handle = useFullScreenHandle();

  const toggleFullscreen = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      appWindow.setFullscreen(false);
      handle.exit();
    } else {
      setIsFullscreen(true);
      appWindow.setFullscreen(true);
      handle.enter();
    }
  };

  return (
    <FullScreen handle={handle} className="w-full h-full">
      <div
        {...props}
        className={cn(
          "w-full h-full flex justify-center items-center bg-slate-950 relative",
          className,
        )}
      >
        <div className="w-full h-full ">
          <Image
            src={src}
            variant="static"
            alt="Image"
            className="object-contain w-full h-full rounded-none"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white absolute top-4 right-4"
          onClick={toggleFullscreen}
        >
          <Visibility isVisible={!isFullscreen}>
            <MaximizeIcon className="w-6 h-6" />
          </Visibility>
          <Visibility isVisible={isFullscreen}>
            <MinimizeIcon className="w-6 h-6" />
          </Visibility>
        </Button>
      </div>
    </FullScreen>
  );
};
