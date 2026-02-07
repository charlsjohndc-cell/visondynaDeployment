"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Send,
  Bookmark,
  EyeOff,
  Banknote,
  MapPin,
  Users,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { toTitleCase } from "@/lib/utils";
import type { JobStatus } from "@prisma/client";

type Post = {
  title: string;
  id: string;
  status: JobStatus;
  location: string;
  description: string;
  createdAt: Date;
  deletedAt?: Date | null;
  company: string;
  salary: number;
  manpower: number;
  categoryId: string;
  category: { name: string };
};

const PREVIEW_LENGTH = 200;

export default function Post({ post }: { post: Post }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isLong = post.description.length > PREVIEW_LENGTH;
  const preview = post.description.slice(0, PREVIEW_LENGTH);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl text-lime-500">{post.title}</CardTitle>
        <CardDescription className="flex items-center gap-1 font-medium">
          <span>{post.company}</span>
          <span>|</span>
          <span>
            {formatDistanceToNowStrict(post.createdAt, { addSuffix: true })}
          </span>
        </CardDescription>
        <div className="inline-flex flex-wrap items-center gap-2 pt-4">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 font-normal"
          >
            <Banknote className="size-4" />
            <span>₱ {post.salary.toLocaleString()}</span>
          </Badge>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 font-normal"
          >
            <MapPin className="size-4" />
            <span>{post.location}</span>
          </Badge>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 font-normal"
          >
            <Users className="size-4" />
            <span>{post.manpower} slots available</span>
          </Badge>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 font-normal"
          >
            <Tag className="size-4" />
            <span>{toTitleCase(post.category.name)}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!expanded ? (
          <CardDescription className="break-words dark:text-slate-300">
            {isLong ? (
              <>
                {preview}
                {"... "}
                <span
                  onClick={() => setExpanded(true)}
                  className="cursor-pointer hover:underline"
                >
                  see more
                </span>
              </>
            ) : (
              post.description
            )}
          </CardDescription>
        ) : (
          <>
            <CardDescription className="whitespace-pre-line break-words dark:text-slate-300">
              {post.description}{" "}
            </CardDescription>
            <CardDescription
              onClick={() => setExpanded(false)}
              className="cursor-pointer hover:underline dark:text-slate-300"
            >
              see less
            </CardDescription>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t p-2 dark:border-slate-800">
        {/* Removed buttons for Dismiss and Save as per request by client */}
        {/* <Button 
          variant="ghost"
          className="flex items-center gap-2 text-slate-400 dark:hover:bg-slate-900"
        >
          <EyeOff size={20} />
          <span>Dismiss</span>
        </Button>

        <Button
          variant="ghost"
          className="flex items-center gap-2 text-slate-400 dark:hover:bg-slate-900"
        >
          <Bookmark size={20} />
          <span>Save</span>
        </Button> */}
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-slate-400 dark:hover:bg-slate-900"
          onClick={() => router.push(`/jobs/${post.id}`)}
        >
          <Send size={20} />
          <span>Apply</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
