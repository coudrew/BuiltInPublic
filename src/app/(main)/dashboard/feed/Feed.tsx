// src/app/(main)/dashboard/feed/Feed.tsx

import { createClient } from "@/utils/supabase/server";
import Likes from "./Likes";
import type { Database } from "supabase/supabase.types";

// chat imports
import {
  getMyFriendships,
} from "@/repositories/chatRepository/chat.repository";
import type {
  FriendshipWithProfiles,
} from "@/repositories/chatRepository/chat.types";

export type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: {
    name: string;
  };
  likes: Database["public"]["Tables"]["likes"]["Row"][];
};

export default async function Feed() {
  const supabase = createClient();

  // Fetch friendships (chat) + posts for the feed
  const [friendships, postsResult] = await Promise.all([
    getMyFriendships(), // from chat.repository
    supabase
      .from("posts")
      .select("*, profiles(name), likes(*)") as unknown as Promise<{
      data: Post[] | null;
      error: Error | null;
    }>,
  ]);

  const { data: posts, error } = postsResult;

  if (error) {
    console.error("Error loading feed:", error);
  }

  const typedFriendships = friendships as FriendshipWithProfiles[];

  return (
    <div className="bg-gradient-to-b from-[#1d1d1d] to-[#86059F] rounded-md shadow p-3 h-full text-white space-y-4">
      {/* Chat / friends panel */}
      <section>
        <h2 className="text-sm font-semibold mb-2">Friends & Chat (MVP)</h2>

        {typedFriendships.length === 0 ? (
          <p className="text-xs text-zinc-200">
            No friendships yet. Once you add friends, they&apos;ll show up here.
          </p>
        ) : (
          <div className="space-y-2">
            {typedFriendships.map((f) => {
              const requester = f.requester;
              const addressee = f.addressee;

              // For now, just show the pair + status.
              // Later: add a "Message" button that calls getOrCreateDirectConversation.
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-md bg-black/30 px-3 py-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div>
                      <span className="font-medium">
                        {requester.username ?? requester.id}
                      </span>{" "}
                      <span className="text-[10px] text-zinc-400">
                        (requester)
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {addressee.username ?? addressee.id}
                      </span>{" "}
                      <span className="text-[10px] text-zinc-400">
                        (addressee)
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {f.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Original feed */}
      <section>
        <h1 className="font-semibold mb-2">Your Feed</h1>

        {!posts?.length && (
          <p className="text-sm text-zinc-200">No posts yet.</p>
        )}

        {posts?.map((post) => (
          <div key={post.id} className="mb-3">
            <p className="font-medium">{post.profiles.name}</p>
            <p className="text-sm">{post.content}</p>
            {/* Later: wire Likes back in with a real user object */}
            {/* <Likes post={post} user={user} /> */}
          </div>
        ))}
      </section>
    </div>
  );
}