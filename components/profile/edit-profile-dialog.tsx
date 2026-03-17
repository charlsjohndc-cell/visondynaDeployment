"use client";

import * as React from "react";
import Image from "next/image";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Upload, Loader2 } from "lucide-react";

const schema = z.object({
  profession: z.string().trim().min(1, "Profession is required").max(100),
  phone: z.string().trim().max(40).optional(),
  profileSummary: z.string().trim().max(2000).optional(),
  profileCompleted: z.boolean().optional(),
});

type Initial = z.infer<typeof schema> & {
  image?: string;
};

export default function EditProfileDialog({ initial }: { initial: Initial }) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Initial>(initial);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  async function handleFileChange(file: File) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Upload failed.");
      }

      setForm((prev) => ({
        ...prev,
        image: json.imageUrl,
      }));

      toast.success("Photo uploaded.");
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ??
        "Please check your input and try again.";
      toast.error(msg);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...parsed.data,
        imageUrl: form.image || "",
      };

      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await r.json();

      if (!r.ok || !json?.ok) {
        toast.error(json?.error || "Could not update profile.");
        return;
      }

      toast.success("Profile updated.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("SAVE ERROR:", error);
      toast.error("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="gap-2 border border-lime-200 bg-lime-50 text-lime-800 hover:bg-lime-100 dark:border-lime-900/40 dark:bg-lime-950/20 dark:text-lime-300 dark:hover:bg-lime-950/30"
        >
          <Pencil size={14} />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-3xl border border-lime-100 bg-white p-0 dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader className="border-b border-lime-100 px-6 py-5 dark:border-slate-800">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            Edit information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-lime-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                {form.image ? (
                  <Image
                    src={form.image}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    No photo
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Profile photo
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Upload a clear photo for your profile.
                </p>

                <div className="mt-3">
                  <label htmlFor="profile-photo-upload" className="inline-flex">
                    <span className="inline-flex cursor-pointer items-center rounded-xl border border-lime-200 bg-white px-3 py-2 text-sm font-medium text-lime-800 hover:bg-lime-100 dark:border-lime-900/40 dark:bg-slate-950 dark:text-lime-300 dark:hover:bg-slate-800">
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload photo
                        </>
                      )}
                    </span>
                  </label>

                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileChange(file);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Profession
            </label>
            <Input
              value={form.profession ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, profession: e.target.value }))
              }
              placeholder="e.g. Data Entry Specialist"
              className="border-lime-200 bg-white focus-visible:ring-lime-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Phone
            </label>
            <Input
              value={form.phone ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+63 9xx xxx xxxx"
              className="border-lime-200 bg-white focus-visible:ring-lime-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Summary
            </label>
            <Textarea
              rows={5}
              value={form.profileSummary ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  profileSummary: e.target.value,
                }))
              }
              placeholder="Write a short introduction about your strengths, tools, and impact."
              className="resize-none border-lime-200 bg-white focus-visible:ring-lime-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keep it short, clear, and professional.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-lime-100 bg-lime-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            <Checkbox
              id="done"
              checked={!!form.profileCompleted}
              onCheckedChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  profileCompleted: Boolean(v),
                }))
              }
            />
            <label
              htmlFor="done"
              className="text-sm text-slate-700 dark:text-slate-300"
            >
              Mark profile as completed
            </label>
          </div>
        </div>

        <DialogFooter className="border-t border-lime-100 px-6 py-4 dark:border-slate-800">
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || uploading}
              className="bg-lime-600 text-white hover:bg-lime-700"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
