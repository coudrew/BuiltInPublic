// src/repositories/chatRepository/chat.repository.ts

import { createClient } from "@/utils/supabase/server";
import type {
  FriendshipStatus,
  FriendshipWithProfiles,
  ConversationRow,
  MessageWithSender,
} from "./chat.types";

/**
 * Get the current authenticated user's id.
 * Use this only in server-side contexts (server actions, route handlers, etc.).
 */
async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }
  if (!user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

/**
 * Get all friendships (pending + accepted + blocked) for the current user.
 * Includes requester + addressee profile info.
 */
export async function getMyFriendships(): Promise<FriendshipWithProfiles[]> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      requester:requester_id (
        id,
        username,
        avatar_url
      ),
      addressee:addressee_id (
        id,
        username,
        avatar_url
      )
    `
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as FriendshipWithProfiles[];
}

/**
 * Send a friend request from the current user to another user.
 */
export async function sendFriendRequest(toUserId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase.from("friendships").insert({
    requester_id: userId,
    addressee_id: toUserId,
    status: "pending" as FriendshipStatus,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update the status of a friendship (e.g. accept or block).
 * RLS ensures only involved users can update.
 */
export async function updateFriendshipStatus(
  friendshipId: string,
  newStatus: FriendshipStatus,
) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("friendships")
    .update({ status: newStatus })
    .eq("id", friendshipId)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) {
    throw error;
  }
}

/**
 * Get (or lazily create) a direct conversation between the current user and another user.
 * Returns the conversation row.
 */
export async function getOrCreateDirectConversation(
  otherUserId: string,
): Promise<ConversationRow> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  // 1) Try to find an existing conversation with exactly these two participants.
  const { data: existing, error: findError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .in("user_id", [userId, otherUserId]);

  if (findError) {
    throw findError;
  }

  // Naive approach: if any conversation has both user ids, reuse the first.
  // (You can tighten this later with a group-by-count RPC if needed.)
  if (existing && existing.length > 0) {
    const conversationId = existing[0].conversation_id as string;

    const { data: convo, error: convoError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convoError) {
      throw convoError;
    }

    return convo as ConversationRow;
  }

  // 2) Otherwise create a new conversation + participant rows.
  const { data: newConvos, error: insertError } = await supabase
    .from("conversations")
    .insert({})
    .select("*");

  if (insertError) {
    throw insertError;
  }

  const conversation = (newConvos?.[0] ?? null) as ConversationRow | null;
  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  const { error: participantsError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: userId },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);

  if (participantsError) {
    throw participantsError;
  }

  return conversation;
}

/**
 * Get messages for a conversation, newest last, with sender profile info.
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
): Promise<MessageWithSender[]> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  // RLS already ensures user is a participant.
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      read_at,
      sender:sender_id (
        id,
        username,
        avatar_url
      )
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageWithSender[];
}

/**
 * Send a new message in a conversation as the current user.
 * Returns the inserted message with sender info.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<MessageWithSender> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content,
    })
    .select(
      `
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      read_at,
      sender:sender_id (
        id,
        username,
        avatar_url
      )
    `
    )
    .single();

  if (error) {
    throw error;
  }

  return data as MessageWithSender;
}