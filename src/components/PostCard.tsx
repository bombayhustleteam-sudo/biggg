"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toggleLike, isPostLikedByUser, deletePost } from "@/lib/posts";
import type { Post } from "@/types";
import toast from "react-hot-toast";

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [optimisticDelta, setOptimisticDelta] = useState(0);
  const likesCount = post.likesCount + optimisticDelta;

  useEffect(() => {
    if (user) {
      isPostLikedByUser(post.id, user.uid).then(setLiked);
    }
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Log in to like posts.");
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setOptimisticDelta((prev) => (wasLiked ? prev - 1 : prev + 1));
    try {
      await toggleLike(post.id, user.uid);
    } catch {
      setLiked(wasLiked);
      setOptimisticDelta((prev) => (wasLiked ? prev + 1 : prev - 1));
      toast.error("Failed to update like.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(post.id);
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  const timeAgo = post.createdAt
    ? formatDistanceToNowStrict(post.createdAt.toDate(), { addSuffix: true })
    : "";

  return (
    <article className="border-b border-neutral-800 p-4 hover:bg-neutral-950/50">
      <div className="flex gap-3">
        <Link href={`/profile/${post.author.username}`}>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-neutral-700 overflow-hidden ring-2 ring-black">
              {post.author.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.photoURL}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold hover:underline"
            >
              {post.author.displayName}
            </Link>
            <span className="text-neutral-500">@{post.author.username}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-500">{timeAgo}</span>
            {user?.uid === post.authorId && (
              <button
                onClick={handleDelete}
                className="ml-auto text-neutral-500 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          {post.text && (
            <p className="mt-1 whitespace-pre-wrap break-words">{post.text}</p>
          )}
          {post.imageURL && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageURL}
                alt=""
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-6 mt-3 text-neutral-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 hover:text-pink-400 ${
                liked ? "text-pink-500" : ""
              }`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span className="text-sm">{likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
