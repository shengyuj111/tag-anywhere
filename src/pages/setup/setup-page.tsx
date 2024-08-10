import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createDir, exists } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";
import { Loaders } from "@/components/ui/loaders";
import { useContext } from "react";
import { DialogContext } from "@/components/provider/dialog-provider/dialog-service-provider";

import { useNavigate } from "react-router-dom";
import { AlertDialog } from "@/components/composition/alert-dialog";
import {
  PartialGlobalSettings,
  useSetGlobalSettingsMutation,
} from "@/api/api/settings-api";
import { cn } from "@/lib/utils";
import { UploadIcon } from "lucide-react";

const setupFormSchema = z.object({
  indexPath: z
    .string()
    .min(1)
    .refine(async (data) => (await exists(data)) as unknown as boolean, {
      message: "Path does not exist",
    }),
  storehousePath: z
    .string()
    .min(1)
    .refine(async (data) => (await exists(data)) as unknown as boolean, {
      message: "Path does not exist",
    }),
});

export const SetupPage = () => {
  const dialogManager = useContext(DialogContext).manager;
  const [setSettings, { isLoading }] = useSetGlobalSettingsMutation();
  const navigate = useNavigate();

  const setupForm = useForm<z.infer<typeof setupFormSchema>>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      indexPath: "",
      storehousePath: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof setupFormSchema>) => {
    try {
      await setSettings({
        indexPath: values.indexPath,
        storehousePath: values.storehousePath,
      } as PartialGlobalSettings);
      const coverPath = `${values.indexPath}/cover`;
      const hasCoverPath = await exists(coverPath);
      if (!hasCoverPath) {
        await createDir(coverPath);
      }
      navigate("/all-files");
    } catch (error) {
      dialogManager.openDialog({
        child: (
          <AlertDialog
            title="Error"
            description="An error occurred while saving the configuration"
            buttonLabel="Close"
          />
        ),
      });
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-accent items-center justify-center">
      <Card className="w-[350px] h-fit">
        <CardHeader>
          <CardTitle>Setup Paths</CardTitle>
          <CardDescription>
            build efficient tag-based media database
          </CardDescription>
        </CardHeader>
        <Form {...setupForm}>
          <form
            onSubmit={setupForm.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <CardContent className="flex flex-col gap-4">
              <FormField
                control={setupForm.control}
                name="indexPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Index Path</FormLabel>
                    <FormControl>
                      <div
                        className={cn(
                          "border flex py-2 px-4 rounded-md items-center w-full justify-start",
                          field.value ? "text-lime-400" : "",
                        )}
                        onClick={async () => {
                          const selected = await open({
                            title: "Choose an Empty folder",
                            directory: true,
                          });
                          if (selected) {
                            field.onChange(selected);
                          }
                        }}
                      >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        {field.value === ""
                          ? "Choose an Empty folder"
                          : field.value}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={setupForm.control}
                name="storehousePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storehouse Path</FormLabel>
                    <FormControl>
                      <div
                        className={cn(
                          "border flex py-2 px-4 rounded-md items-center w-full justify-start",
                          field.value ? "text-lime-400" : "",
                        )}
                        onClick={async () => {
                          const selected = await open({
                            title: "Choose an Empty folder",
                            directory: true,
                          });
                          if (selected) {
                            field.onChange(selected);
                          }
                        }}
                      >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        {field.value === ""
                          ? "Choose an Empty folder"
                          : field.value}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Loaders.circular loading={isLoading} className="mr-2" />
              <Button type="submit" disabled={isLoading} className="w-full">
                Start Tag
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};
