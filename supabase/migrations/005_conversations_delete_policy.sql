-- Add DELETE policy for conversations table
-- Users can delete their own conversations (cascades to messages and analyses)
create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);
