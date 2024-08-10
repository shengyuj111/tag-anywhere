import { FileCommon } from "@/api/api/file-api";
import { fileStatsResult, getFileStats } from "@/api/api/rust-api";
import { useEffect, useMemo, useState } from "react";
import { Visibility } from "../ui/visibility";
import { Loaders } from "../ui/loaders";
import { H4, Muted, Small } from "../ui/typography";
import { Separator } from "../ui/separator";
import { IconType } from "@/lib/type-utils";
import {
  Axis3DIcon,
  CakeIcon,
  ClockIcon,
  FileTypeIcon,
  RocketIcon,
  WeightIcon,
} from "lucide-react";
import {
  formatDimensions,
  formatDuration,
  formatFrameRate,
  formatMime,
  formatSize,
  formatTimestamp,
} from "@/lib/format-utils";
import { guard } from "@/lib/other-utils";
import Image from "../ui/image";
import { pathToUrl } from "@/api/api/helper";

interface FileStatsPanelProps {
  fileCommon: FileCommon;
}

export const FileStatsPanel = ({
  fileCommon,
}: FileStatsPanelProps) => {
  const [stats, setStats] = useState<fileStatsResult | undefined>(undefined);
  const coverPath = useMemo(
    () => pathToUrl(fileCommon.coverPath),
    [fileCommon.coverPath],
  );

  useEffect(() => {
    getFileStats(fileCommon.path!).then((stats) => setStats(stats));
  }, [fileCommon.path]);

  const statsData: {
    label: string;
    value: string | undefined;
    icon: IconType;
  }[] = [
    {
      icon: WeightIcon,
      label: "Size",
      value: guard(stats, () => formatSize(stats!.size)),
    },
    {
      icon: FileTypeIcon,
      label: "Mime Type",
      value: guard(stats, () => formatMime(stats!.mime_type)),
    },
    {
      icon: CakeIcon,
      label: "Created",
      value: guard(stats, () => formatTimestamp(stats!.created)),
    },
    {
      icon: Axis3DIcon,
      label: "Dimensions",
      value: guard(stats && stats.dimensions, () =>
        formatDimensions(stats!.dimensions!),
      ),
    },
    {
      icon: ClockIcon,
      label: "Duration",
      value: guard(stats && stats.duration, () =>
        formatDuration(stats!.duration!),
      ),
    },
    {
      icon: RocketIcon,
      label: "Frame Rate",
      value: guard(stats && stats.frame_rate, () =>
        formatFrameRate(stats!.frame_rate!),
      ),
    },
  ];

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 p-2 xl:p-4 pr-4 xl:pr-6 overflow-auto">
        <Loaders.circular size="large" layout="area" loading={!stats} />
        <Visibility isVisible={!!stats}>
          <div className="flex flex-col gap-4">
            <H4>Cover</H4>
            <Image src={coverPath} alt="Image" />
            <Separator className="w-full mt-4" />
            <H4>File Stats</H4>
            {statsData.map(({ label, value, icon }) => (
              <StatsRow key={label} icon={icon} label={label} value={value} />
            ))}
          </div>
        </Visibility>
      </div>
    </div>
  );
};

const StatsRow = ({
  icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string | undefined;
}) => {
  const Icon = icon;
  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between w-full gap-1">
      <div className="flex items-center text-muted-foreground">
        <Icon className="h-4 w-4 mr-2 hidden sm:block" />
        <Muted className="text-xs xl:text-sm">{label}</Muted>
      </div>
      <Small className="text-xs xl:text-sm xl:text-right">{value}</Small>
    </div>
  );
};
