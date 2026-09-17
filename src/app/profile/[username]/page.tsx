"use client";

import { useEffect, useState, use } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserPosts } from "@/lib/posts";
import { isFollowing, toggleFollow } from "@/lib/follow";
import PostCard from "@/components/PostCard";
import type { Post, UserProfile } from "@/types";
import toast from "react-hot-toast";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    let unsubPosts: (() => void) | undefined;

    async function load() {
      setLoading(true);
      const q = query(
        collection(db, "users"),
        where("usernameLower", "==", username.toLowerCase())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const data = snap.docs[0].data() as UserProfile;
      setProfile(data);
      setLoading(false);

      unsubPosts = subscribeToUserPosts(data.uid, setPosts);

      if (user && user.uid !== data.uid) {
        const f = await isFollowing(user.uid, data.uid);
        setFollowing(f);
      }
    }

    load();
    return () => {
      if (unsubPosts) unsubPosts();
    };
  }, [username, user]);

  const handleFollow = async () => {
    if (!user) {
      toast.error("Log in to follow users.");
      return;
    }
    if (!profile) return;
    setFollowBusy(true);
    try {
      await toggleFollow(user.uid, profile.uid);
      setFollowing((prev) => !prev);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: following
                ? prev.followersCount - 1
                : prev.followersCount + 1,
            }
          : prev
      );
    } catch {
      toast.error("Failed to update follow status.");
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-neutral-500">User not found.</div>
    );
  }

  const isMe = myProfile?.uid === profile.uid;

  return (
    <div>
      <div className="h-32 bg-neutral-800" />
      <div className="p-4 border-b border-neutral-800">
        <div className="flex justify-between items-start -mt-14">
          <div className="w-24 h-24 rounded-full bg-neutral-700 border-4 border-black overflow-hidden">
            {profile.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {!isMe && (
            <button
              onClick={handleFollow}
              disabled={followBusy}
              className={`rounded-full px-5 py-2 font-semibold mt-16 ${
                following
                  ? "border border-neutral-700 hover:border-red-500 hover:text-red-400"
                  : "bg-white text-black hover:bg-neutral-200"
              } disabled:opacity-50`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <h1 className="text-xl font-bold mt-3">{profile.displayName}</h1>
        <p className="text-neutral-500">@{profile.username}</p>
        {profile.bio && <p className="mt-2">{profile.bio}</p>}
        <div className="flex gap-4 mt-3 text-sm">
          <span>
            <strong>{profile.followingCount}</strong>{" "}
            <span className="text-neutral-500">Following</span>
          </span>
          <span>
            <strong>{profile.followersCount}</strong>{" "}
            <span className="text-neutral-500">Followers</span>
          </span>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-8 text-center text-neutral-500">No posts yet.</div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
