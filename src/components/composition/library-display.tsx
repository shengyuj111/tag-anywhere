import { AspectRatio } from "../ui/aspect-ratio";
import { H4 } from "../ui/typography";
import { Library } from "@/api/api/library-api";
import { useNavigate } from "react-router-dom";
import Image from "../ui/image";
import { pathToUrl } from "@/api/api/helper";
import { FileCoverAspectRatio } from "@/lib/file-enum";

interface LibraryDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  library: Library;
}

export const LibraryDisplay = ({ library }: LibraryDisplayProps) => {
  const navigate = useNavigate();

  const navigateToFilesPage = () => {
    navigate(`/library/${library.id}`);
  };

  return (
    <div className="space-y-3 w-[250px]">
      <div className=" w-[250px] relative">
        <AspectRatio
          ratio={FileCoverAspectRatio.Book}
          className="bg-muted overflow-hidden rounded-md cursor-pointer"
          onClick={navigateToFilesPage}
        >
          <Image src={pathToUrl(library.coverPath)} alt="Image" />
        </AspectRatio>
      </div>
      <div>
        <H4 className="truncate">{library.name}</H4>
      </div>
    </div>
  );
};
