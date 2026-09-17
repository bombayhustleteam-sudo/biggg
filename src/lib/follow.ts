import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function isFollowing(currentUid: string, targetUid: string) {
  const snap = await getDoc(doc(db, "users", targetUid, "followers", currentUid));
  return snap.exists();
}

export async function toggleFollow(currentUid: string, targetUid: string) {
  if (currentUid === targetUid) return;

  const followerRef = doc(db, "users", targetUid, "followers", currentUid);
  const followingRef = doc(db, "users", currentUid, "following", targetUid);
  const targetUserRef = doc(db, "users", targetUid);
  const currentUserRef = doc(db, "users", currentUid);

  await runTransaction(db, async (tx) => {
    const followerSnap = await tx.get(followerRef);
    const targetSnap = await tx.get(targetUserRef);
    const currentSnap = await tx.get(currentUserRef);

    const targetFollowers = (targetSnap.data()?.followersCount as number) || 0;
    const currentFollowing = (currentSnap.data()?.followingCount as number) || 0;

    if (followerSnap.exists()) {
      tx.delete(followerRef);
      tx.delete(followingRef);
      tx.update(targetUserRef, { followersCount: Math.max(0, targetFollowers - 1) });
      tx.update(currentUserRef, { followingCount: Math.max(0, currentFollowing - 1) });
    } else {
      tx.set(followerRef, { uid: currentUid, createdAt: serverTimestamp() });
      tx.set(followingRef, { uid: targetUid, createdAt: serverTimestamp() });
      tx.update(targetUserRef, { followersCount: targetFollowers + 1 });
      tx.update(currentUserRef, { followingCount: currentFollowing + 1 });
    }
  });
}
