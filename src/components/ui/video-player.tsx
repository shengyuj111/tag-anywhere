import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { clamp } from "lodash";
import { HTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { Button } from "./button";
import { Visibility } from "./visibility";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeIcon,
  VolumeXIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Slider } from "./slider";
import { appWindow } from "@tauri-apps/api/window";

const videoPlayerVariants = cva("", {
  variants: {
    variant: {
      default: "overflow-hidden relative",
    },
    size: {
      default: "w-full h-full",
      sm: "w-96",
      lg: "w-128",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface VideoPlayerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof videoPlayerVariants> {
  src: string;
  initialVolume?: number;
  frameRate?: number;
  className?: string;
  onSetTime?: (time: number) => void;
  onReady?: (player: Player) => void;
}

const VideoPlayer = ({
  src,
  initialVolume,
  frameRate,
  className,
  variant,
  size,
  onReady,
  onSetTime,
  ...props
}: VideoPlayerProps) => {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentFrameRate = useMemo(() => frameRate ?? 30, [frameRate]);

  useEffect(() => {
    if (!playerRef.current) {
      const placeholderEl = placeholderRef.current;
      if (placeholderEl) {
        const videoElement = placeholderEl.appendChild(
          document.createElement("video-js"),
        );

        videoElement.style.width = "100%";
        videoElement.style.height = "100%";

        const player = (playerRef.current = videojs(
          videoElement,
          {
            controls: false,
            sources: [{ src }],
          },
          () => {
            player.volume(initialVolume);
            onReady && onReady(player);
          },
        ));

        // Add state mapping
        player.on("timeupdate", () => {
          const duration = player.duration() ?? 0;
          const currentTime = player.currentTime() ?? 0;
          const videoProgress = clamp(currentTime / duration, 0, 1) * 100;

          setProgress(videoProgress);
          setCurrentTime(currentTime);
          onSetTime && onSetTime(currentTime);
        });
        player.on("play", () => setIsPlaying(true));
        player.on("pause", () => setIsPlaying(false));
        player.on("volumechange", () => setVolume(player.volume() ?? 1));
      }
    } else {
      const player = playerRef.current;
      player.pause();
      player.currentTime(0);
      player.src({ src });
    }
  }, [src, onReady, onSetTime, initialVolume]);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  const setPlayerProgress = (newProgress: number) => {
    if (playerRef.current) {
      const duration = playerRef.current.duration() ?? 0;
      const seekTime = (newProgress / 100) * duration;
      playerRef.current.currentTime(seekTime);
    }
  };

  const pauseButtonAction = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const rewind = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.currentTime();
      if (currentTime) {
        playerRef.current.currentTime(currentTime - 10);
      }
    }
  };

  const forward = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.currentTime();
      if (currentTime) {
        playerRef.current.currentTime(currentTime + 10);
      }
    }
  };

  const rewindFrame = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.currentTime();
      if (currentTime) {
        const newTime = currentTime - 1 / currentFrameRate;
        playerRef.current.currentTime(newTime);
      }
    }
  };

  const forwardFrame = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.currentTime();
      if (currentTime) {
        const newTime = currentTime + 1 / currentFrameRate;
        playerRef.current.currentTime(newTime);
      }
    }
  };

  const setPlayerVolume = (newVolume: number) => {
    if (playerRef.current) {
      playerRef.current.volume(newVolume);
      setVolume(newVolume);
    }
  };

  const toggleFullscreen = async () => {
    if (placeholderRef.current) {
      if (!isFullscreen) {
        await placeholderRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleFullscreenChange = async () => {
    const isFullScreen = !!document.fullscreenElement;
    appWindow.setFullscreen(isFullScreen);
    setIsFullscreen(isFullScreen);
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div
      className={cn(videoPlayerVariants({ variant, size, className }))}
      ref={placeholderRef}
      {...props}
    >
      {/* Custom controls */}
      <VideoOverlayControls
        isPlaying={isPlaying}
        pauseButtonAction={pauseButtonAction}
        rewind={rewind}
        forward={forward}
      />
      <VideoPauseScreen
        isPlaying={isPlaying}
        pauseButtonAction={pauseButtonAction}
      />
      <div className="absolute bottom-0 w-full flex items-center gap-2 p-4 z-20">
        <VideoPauseButton
          isPlaying={isPlaying}
          pauseButtonAction={pauseButtonAction}
        />
        <VideoRewindButton rewind={rewind} />
        <VideoFrameRewindButton rewindFrame={rewindFrame} />
        <VideoFrameForwardButton forwardFrame={forwardFrame} />
        <VideoForwardButton forward={forward} />
        <VideoPlayerProgress
          className="h-2"
          progress={progress}
          onSetProgress={setPlayerProgress}
        />
        <VideoPlayerVolume volume={volume} onSetVolume={setPlayerVolume} container={placeholderRef.current ?? undefined} />
        <VideoPlayerFullScreenToggleButton
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
};

const VideoPlayerFullScreenToggleButton = ({
  isFullscreen,
  toggleFullscreen,
}: {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white"
      onClick={toggleFullscreen}
    >
      <Visibility isVisible={!isFullscreen}>
        <MaximizeIcon className="w-6 h-6" />
      </Visibility>
      <Visibility isVisible={isFullscreen}>
        <MinimizeIcon className="w-6 h-6" />
      </Visibility>
    </Button>
  );
};

const VideoForwardButton = ({ forward }: { forward: () => void }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white"
      onClick={forward}
    >
      <ChevronsRightIcon className="w-6 h-6" />
    </Button>
  );
};

const VideoRewindButton = ({ rewind }: { rewind: () => void }) => {
  return (
    <Button variant="ghost" size="icon" className="text-white" onClick={rewind}>
      <ChevronsLeftIcon className="w-6 h-6" />
    </Button>
  );
};

const VideoFrameForwardButton = ({
  forwardFrame,
}: {
  forwardFrame: () => void;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white"
      onClick={forwardFrame}
    >
      <ChevronRightIcon className="w-6 h-6" />
    </Button>
  );
};

const VideoFrameRewindButton = ({
  rewindFrame,
}: {
  rewindFrame: () => void;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white"
      onClick={rewindFrame}
    >
      <ChevronLeftIcon className="w-6 h-6" />
    </Button>
  );
};

const VideoOverlayControls = ({
  isPlaying,
  pauseButtonAction,
  rewind,
  forward,
}: {
  isPlaying: boolean;
  pauseButtonAction: () => void;
  rewind: () => void;
  forward: () => void;
}) => {
  return (
    <Visibility isVisible={isPlaying}>
      <div className="absolute top-0 w-full h-[70%] z-10 grid grid-cols-[20%_60%_20%] grid-rows-[100%] cursor-pointer">
        <div onClick={rewind} />
        <div onClick={pauseButtonAction} />
        <div onClick={forward} />
      </div>
    </Visibility>
  );
};

const VideoPauseScreen = ({
  isPlaying,
  pauseButtonAction,
}: {
  isPlaying: boolean;
  pauseButtonAction: () => void;
}) => {
  return (
    <Visibility isVisible={!isPlaying}>
      <div className="absolute top-0 w-full h-full z-10 bg-black/50 flex justify-center items-center">
        <PlayIcon
          className="w-16 h-16 text-white opacity-50"
          onClick={pauseButtonAction}
        />
      </div>
    </Visibility>
  );
};

const VideoPlayerProgress = ({
  progress,
  onSetProgress,
  className,
}: {
  progress: number;
  onSetProgress: (progress: number) => void;
  className?: string;
}) => {
  return (
    <Slider
      variant="video"
      max={100}
      step={0.1}
      className={className}
      value={[progress]}
      onValueChange={(value) => onSetProgress(value[0])}
    />
  );
};

const VideoPauseButton = ({
  isPlaying,
  pauseButtonAction,
}: {
  isPlaying: boolean;
  pauseButtonAction: () => void;
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white"
      onClick={pauseButtonAction}
    >
      <Visibility isVisible={isPlaying}>
        <PauseIcon className="w-6 h-6" />
      </Visibility>
      <Visibility isVisible={!isPlaying}>
        <PlayIcon className="w-6 h-6" />
      </Visibility>
    </Button>
  );
};

const VideoPlayerVolume = ({
  volume,
  onSetVolume,
  container,
}: {
  volume: number;
  container?: HTMLElement;
  onSetVolume: (volume: number) => void;
}) => {
  const volumeItensity: number[] = [1, 0.4, 0.2, 0.05, 0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white">
          <Visibility
            isVisible={
              volume <= volumeItensity[0] && volume > volumeItensity[1]
            }
          >
            <Volume2Icon className="w-6 h-6" />
          </Visibility>
          <Visibility
            isVisible={
              volume <= volumeItensity[1] && volume > volumeItensity[2]
            }
          >
            <Volume1Icon className="w-6 h-6" />
          </Visibility>
          <Visibility
            isVisible={
              volume <= volumeItensity[2] && volume > volumeItensity[3]
            }
          >
            <VolumeIcon className="w-6 h-6" />
          </Visibility>
          <Visibility
            isVisible={
              volume <= volumeItensity[3] && volume >= volumeItensity[4]
            }
          >
            <VolumeXIcon className="w-6 h-6" />
          </Visibility>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-10 h-40" container={container}>
        <Slider
          orientation="vertical"
          variant="volume"
          max={100}
          step={0.1}
          className=""
          value={[volume * 100]}
          onValueChange={(value) => onSetVolume(value[0] / 100)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default VideoPlayer;
