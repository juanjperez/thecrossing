import { notFound } from "next/navigation";
import {
  getFrameById,
  getFrameIds,
  getAdjacentFrames,
  getTotalFrames,
  getFrameIndex,
  loadStory,
} from "../../lib/story";
import FrameClient from "../../components/FrameClient";

export async function generateStaticParams() {
  return getFrameIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = loadStory();
  const frame = getFrameById(id);
  if (!frame) return { title: "Not Found" };

  const title =
    frame.type === "splash"
      ? story.title
      : `${frame.chapter || story.title} — ${frame.id}`;

  return {
    title,
    description: frame.caption || story.metadata.artStyle,
  };
}

export default async function FramePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dir?: string }>;
}) {
  const { id } = await params;
  const { dir } = await searchParams;
  const frame = getFrameById(id);
  if (!frame) notFound();

  const { prev, next } = getAdjacentFrames(id);
  const total = getTotalFrames();
  const index = getFrameIndex(id);

  return (
    <FrameClient
      frameId={frame.id}
      frameType={frame.type}
      beats={frame.beats ?? []}
      chapter={frame.chapter}
      prevFrameId={prev?.id ?? null}
      nextFrameId={next?.id ?? null}
      current={index}
      total={total}
      initialDirection={dir === "back" ? "back" : "forward"}
    />
  );
}
