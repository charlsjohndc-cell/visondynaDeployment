// components/profile/manage-educations.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Education = {
  id: string;
  course: string;
  institution: string;
  graduated: boolean;
  enrolledDate: Date | string | null;
  graduationDate: Date | string | null;
};

const schema = z.object({
  course: z.string().min(2, "Course is required"),
  institution: z.string().min(2, "Institution is required"),
  graduated: z.boolean(),
  enrolledDate: z.string().min(1, "Enrolled date is required"), // "YYYY-MM-DD"
  graduationDate: z.string().optional(), // "YYYY-MM-DD"
});

function fmt(d?: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM yyyy");
}

export default function ManageEducations({
  initial,
}: {
  initial: Education[];
}) {
  const router = useRouter();

  const [items, setItems] = useState<Education[]>(initial);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    course: string;
    institution: string;
    graduated: boolean;
    enrolledDate: string;
    graduationDate?: string;
  }>({ course: "", institution: "", enrolledDate: "", graduated: false });

  const dialogTitle = useMemo(
    () => (editingId ? "Edit education" : "Add education"),
    [editingId],
  );

  function openAdd() {
    setEditingId(null);
    setForm({ course: "", institution: "", enrolledDate: "", graduated: false });
    setOpen(true);
  }

  function openEdit(x: Education) {
    setEditingId(x.id);
    setForm({
      course: x.course,
      institution: x.institution,
      graduated: Boolean(x.graduated),
      enrolledDate: x.enrolledDate
        ? new Date(x.enrolledDate).toISOString().slice(0, 10)
        : "",
      graduationDate: x.graduationDate
        ? new Date(x.graduationDate).toISOString().slice(0, 10)
        : "",
    });
    setOpen(true);
  }

  async function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) return;

    const payload = {
      course: parsed.data.course.trim(),
      institution: parsed.data.institution.trim(),
      graduated: parsed.data.graduated,
      enrolledDate: new Date(`${parsed.data.enrolledDate}T00:00:00.000Z`).toISOString(),
      graduationDate: parsed.data.graduationDate
        ? new Date(`${parsed.data.graduationDate}T00:00:00.000Z`).toISOString()
        : undefined,
    };

    if (editingId) {
      // optimistic
      setItems((prev) =>
        prev.map((x) =>
          x.id === editingId ? ({ ...x, ...payload } as Education) : x,
        ),
      );

      const res = await fetch(`/api/profile/educations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        router.refresh();
      }
    } else {
      const res = await fetch(`/api/profile/educations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.ok && json.data) {
          setItems((prev) => [json.data as Education, ...prev]);
        } else {
          router.refresh();
        }
      }
    }

    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    const keep = items;
    setItems((prev) => prev.filter((x) => x.id !== id));

    const res = await fetch(`/api/profile/educations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setItems(keep);
    }
    router.refresh();
  }

  return (
    <Card className="dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Education</CardTitle>
          <CardDescription>Your learning journey.</CardDescription>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={openAdd}>
              Add
            </Button>
          </div>

          <DialogContent className="bg-slate-900 p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="course">Course / Program</Label>
                <Input
                  id="course"
                  value={form.course}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, course: e.target.value }))
                  }
                  placeholder="e.g., BS Information Technology"
                />
              </div>

              <div>
                <Label htmlFor="institution">Institution / School</Label>
                <Input
                  id="institution"
                  value={form.institution}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, institution: e.target.value }))
                  }
                  placeholder="e.g., University of Example"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="graduated"
                  checked={form.graduated}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ 
                      ...f, 
                      graduated: Boolean(v),
                      graduationDate: v ? f.graduationDate : undefined
                    }))
                  }
                />
                <Label htmlFor="graduated">Graduated</Label>
              </div>

              <div className={form.graduated ? "grid grid-cols-2 gap-3" : ""}>
                <div>
                  <Label htmlFor="enrolledDate">Enrolled Date</Label>
                  <Input
                    id="enrolledDate"
                    type="date"
                    value={form.enrolledDate ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, enrolledDate: e.target.value }))
                    }
                  />
                </div>
                {form.graduated && (
                  <div>
                    <Label htmlFor="graduationDate">Graduation Date</Label>
                    <Input
                      id="graduationDate"
                      type="date"
                      value={form.graduationDate ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, graduationDate: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={submit}>{editingId ? "Save" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4 divide-y divide-slate-800">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No education yet.</p>
        ) : (
          items.map((ed) => (
            <div
              key={ed.id}
              className="flex items-start justify-between gap-4 pt-4"
            >
              <div>
                <p className="w-full font-medium tracking-tight">{ed.course}</p>                <p className="text-sm text-slate-400">{ed.institution}</p>                <p className="mt-1 text-xs text-slate-500">
                  {fmt(ed.enrolledDate)}{" "}
                  {ed.graduationDate ? `• ${fmt(ed.graduationDate)}` : ""}
                </p>
                <p className="text-sm text-slate-400">
                  {ed.graduated ? "Graduated" : "Not yet graduated"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(ed)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(ed.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
