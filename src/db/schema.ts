import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export type Caption = {
  t0: number;
  t1: number;
  text: string;
};

export const connections = pgTable("connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: varchar("platform", { length: 16 }).notNull().default("tiktok"),
  handle: text("handle").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  mode: varchar("mode", { length: 8 }).notNull().default("live"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  sourceMediaUrl: text("source_media_url"),
  videoId: varchar("video_id", { length: 32 }).notNull(),
  title: text("title").notNull(),
  channel: text("channel").notNull(),
  durationSeconds: integer("duration_seconds"),
  status: varchar("status", { length: 16 }).notNull().default("processing"),
  autoPostMinScore: integer("auto_post_min_score"),
  autoPostConnectionId: uuid("auto_post_connection_id").references(
    () => connections.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clips = pgTable("clips", {
  id: uuid("id").primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  idx: integer("idx").notNull(),
  title: text("title").notNull(),
  hook: text("hook").notNull(),
  summary: text("summary").notNull(),
  reason: text("reason").notNull(),
  startSeconds: integer("start_seconds").notNull(),
  endSeconds: integer("end_seconds").notNull(),
  score: integer("score").notNull(),
  hashtags: text("hashtags").array().notNull(),
  captions: jsonb("captions").$type<Caption[]>().notNull(),
  renderJobId: text("render_job_id"),
  exported: boolean("exported").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const publishJobs = pgTable("publish_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  clipId: uuid("clip_id")
    .notNull()
    .references(() => clips.id, { onDelete: "cascade" }),
  connectionId: uuid("connection_id")
    .notNull()
    .references(() => connections.id, { onDelete: "cascade" }),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").array().notNull(),
  privacyLevel: varchar("privacy_level", { length: 32 })
    .notNull()
    .default("PUBLIC_TO_EVERYONE"),
  status: varchar("status", { length: 16 }).notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  publishId: text("publish_id"),
  remoteUrl: text("remote_url"),
  error: text("error"),
  autoQueued: boolean("auto_queued").notNull().default(false),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Connection = typeof connections.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type PublishJob = typeof publishJobs.$inferSelect;
