// src/repositories/chatRepository/chat.types.ts

import type { Database } from "../../../supabase/supabase.types";

export type ProfileRow =
  Database["public"]["Tables"]["profiles"]["Row"];

export type FriendshipRow =
  Database["public"]["Tables"]["friendships"]["Row"];

export type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];

export type ConversationParticipantRow =
  Database["public"]["Tables"]["conversation_participants"]["Row"];

export type MessageRow =
  Database["public"]["Tables"]["messages"]["Row"];

export type FriendshipStatus = FriendshipRow["status"];

/**
 * Joined friendship with both profile records.
 * This matches the select with:
 *   requester:requester_id(...)
 *   addressee:addressee_id(...)
 */
export type FriendshipWithProfiles = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;

  requester: Pick<ProfileRow, "id" | "username" | "avatar_url">;
  addressee: Pick<ProfileRow, "id" | "username" | "avatar_url">;
};

/**
 * Conversation with its participants (profiles) and optional last message.
 * This is a shape you can build later with a select + joins.
 */
export type ConversationParticipantProfile = Pick<
  ProfileRow,
  "id" | "username" | "avatar_url"
>;

export type ConversationWithParticipants = {
  conversation: ConversationRow;
  participants: ConversationParticipantProfile[];
};

export type MessageWithSender = MessageRow & {
  sender: Pick<ProfileRow, "id" | "username" | "avatar_url">;
};