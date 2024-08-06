import { ModeToggle } from "@/components/composition/mode-toggle";
import { RefreshButton } from "@/components/composition/refresh-button";
import { Link } from "@/components/ui/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconType } from "@/lib/type-utils";
import {
  BugIcon,
  FilesIcon,
  HomeIcon,
  Package2Icon,
  TagsIcon,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

export const Navbar = () => {
  return (
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] grid-rows-[56px_1fr] lg:grid-rows-[60px_1fr] bg-muted/40">
      <div className="hidden md:block border-b border-r bg-background px-4 lg:px-6">
        <TagAnywhereLogo />
      </div>
      <Header />
      <div className="hidden md:block h-screen-minus-[56px] lg:h-screen-minus-[60px] border-r bg-background">
        <NavMenu />
      </div>
      <ScrollArea className="">
        <main className="flex h-screen-minus-[56px] lg:h-screen-minus-[60px] flex-col p-4 lg:p-6 gap-4">
          <Outlet />
        </main>
      </ScrollArea>
    </div>
  );
};

const TagAnywhereLogo = () => {
  return (
    <div className="flex items-center gap-2 font-semibold h-full">
      <Package2Icon className="h-6 w-6" />
      <span className="">Tag Anywhere</span>
    </div>
  );
};

const NavMenu = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItemsData: { icon: IconType; text: string; href: string }[] = [
    {
      icon: HomeIcon,
      text: "Browse",
      href: "/home",
    },
    {
      icon: FilesIcon,
      text: "Files",
      href: "/all-files",
    },
    {
      icon: TagsIcon,
      text: "Tags",
      href: "/tags",
    },
    {
      icon: BugIcon,
      text: "Test",
      href: "/test",
    },
  ];

  return (
    <nav className="grid items-start p-2 text-sm font-medium lg:p-4">
      {menuItemsData.map((item) => {
        const Icon = item.icon;
        const label = item.text;
        const href = item.href;

        return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              currentPath.includes(href)
                ? "bg-muted text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

const Header = () => {
  return (
    <header className="flex items-center gap-4 border-b bg-background px-4 lg:px-6">
      <div className="w-full flex gap-2">
        <div className="flex-grow" />
        <RefreshButton />
        <ModeToggle />
      </div>
    </header>
  );
};
