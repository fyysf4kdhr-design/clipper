"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Caption } from "@/db/schema";
import ProcessingView from "./ProcessingView";
import ClipsBoard from "./ClipsBoard";

export type ProjectData = {
  id: string;
  url: string;
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number | null;
  status: string;
  autoPostMinScore: number | null;
  createdAt: string;
};

export type ClipData = {
  id: string;
  idx: number;
  title: string;
  hook: string;
  summary: string;
  reason: string;
  startSeconds: number;
  endSeconds: number;
  score: number;
  hashtags: string[];
  captions: Caption[];
  exported: boolean;
};

export type StageInfo = {
  index: number;
  key: string;
  label: string;
  detail: string;
  overall: number;
};

export default function ProjectView({ project: initial }: { project: ProjectData }) {
  const [project, setProject] = useState(initial);
  const [stage, setStage] = useState<StageInfo | null>(null);
  const [clips, setClips] = useState<ClipData[]>([]);
  const doneRef = useRef(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${initial.id}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setProject(data.project);
      setStage(data.stage);
      if (data.project.status === "done") {
        setClips(data.clips);
        doneRef.current = true;
      }
    } catch {
      /* keep polling */
    }
  }, [initial.id]);

  useEffect(() => {
    poll();
    const iv = setInterval(() => {
      if (!doneRef.current) poll();
    }, 1200);
    return () => clearInterval(iv);
  }, [poll]);

  const isDone = project.status === "done";

  return (
    <AnimatePresence mode="wait">
      {isDone ? (
        <motion.div
          key="board"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ClipsBoard project={project} clips={clips} />
        </motion.div>
      ) : (
        <motion.div
          key="processing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4 }}
        >
          <ProcessingView project={project} stage={stage} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
