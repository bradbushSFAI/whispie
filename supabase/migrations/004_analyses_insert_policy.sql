-- Add missing INSERT policy for analyses table
-- Users can insert analyses for their own conversations
create policy "Users can insert analyses for own conversations"
  on public.analyses for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = analyses.conversation_id
      and conversations.user_id = auth.uid()
    )
  );
