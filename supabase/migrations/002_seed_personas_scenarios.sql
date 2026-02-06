-- Whispie Seed Data: Personas and Scenarios
-- 3 Personas + 5 Scenarios for MVP

-- ============================================
-- PERSONAS
-- ============================================

INSERT INTO public.personas (id, name, title, description, personality_traits, communication_style, difficulty, is_active)
VALUES
  (
    'a1b2c3d4-1111-4000-8000-000000000001',
    'Margaret Chen',
    'The Micromanaging Boss',
    'Margaret is a senior manager who believes in tight control over every detail. She frequently checks in, asks for updates, and wants to approve even minor decisions. While she means well, her approach can feel suffocating.',
    ARRAY['detail-oriented', 'anxious', 'perfectionist', 'impatient'],
    'direct',
    'hard',
    true
  ),
  (
    'a1b2c3d4-2222-4000-8000-000000000002',
    'Derek Williams',
    'The Dismissive Coworker',
    'Derek has been at the company for 8 years and considers himself indispensable. He often dismisses new ideas, takes credit for team work, and can be passive-aggressive when challenged.',
    ARRAY['arrogant', 'territorial', 'passive-aggressive', 'defensive'],
    'passive-aggressive',
    'medium',
    true
  ),
  (
    'a1b2c3d4-3333-4000-8000-000000000003',
    'Victoria Santos',
    'The Demanding Client',
    'Victoria is the VP of Operations at a major client company. She has high expectations, tight deadlines, and isn''t afraid to escalate issues. She respects competence but has little patience for excuses.',
    ARRAY['results-driven', 'impatient', 'assertive', 'high-standards'],
    'aggressive',
    'hard',
    true
  );

-- ============================================
-- SCENARIOS
-- ============================================

INSERT INTO public.scenarios (id, title, description, category, context, objectives, persona_id, difficulty, estimated_turns, is_premium, is_active)
VALUES
  (
    'b1c2d3e4-1111-4000-8000-000000000001',
    'Asking Your Manager for Feedback',
    'You want to understand how you''re performing and what areas you can improve. Your manager tends to micromanage, so you''ll need to frame the conversation carefully.',
    'feedback',
    'You''ve been in your role for 6 months and haven''t received formal feedback yet. You want constructive input on your performance, but your manager (Margaret) often focuses on small details rather than the big picture. Schedule a 1:1 to discuss your growth.',
    ARRAY['Request specific, actionable feedback', 'Steer conversation to bigger-picture performance', 'End with clear next steps for improvement'],
    'a1b2c3d4-1111-4000-8000-000000000001',
    'easy',
    8,
    false,
    true
  ),
  (
    'b1c2d3e4-2222-4000-8000-000000000002',
    'Setting Boundaries with a Coworker',
    'A colleague keeps interrupting your work, taking credit for your ideas in meetings, and dumping their tasks on you. Time to have a direct conversation.',
    'conflict',
    'Derek has been "borrowing" your work for months. Last week, he presented your analysis in a team meeting as if it were his own. Your manager praised him. You need to address this without creating a hostile work environment.',
    ARRAY['Address the specific behavior calmly', 'Set clear boundaries for future collaboration', 'Maintain professionalism without being a pushover'],
    'a1b2c3d4-2222-4000-8000-000000000002',
    'medium',
    10,
    false,
    true
  ),
  (
    'b1c2d3e4-3333-4000-8000-000000000003',
    'Negotiating a Deadline Extension',
    'An important client wants their deliverable moved up by two weeks. You know it''s not realistic without sacrificing quality. Negotiate a fair compromise.',
    'negotiation',
    'Victoria Santos from Apex Corp just called demanding the project be delivered two weeks early. Your team is already at capacity, and rushing would mean cutting corners. You need to push back professionally while maintaining the client relationship.',
    ARRAY['Explain constraints without making excuses', 'Propose realistic alternatives', 'Preserve the client relationship'],
    'a1b2c3d4-3333-4000-8000-000000000003',
    'hard',
    12,
    false,
    true
  ),
  (
    'b1c2d3e4-4444-4000-8000-000000000004',
    'Requesting a Raise',
    'You''ve exceeded expectations for a year but your salary hasn''t kept pace. Make the case to your detail-oriented manager.',
    'negotiation',
    'You''ve been in your role for 18 months, consistently hitting targets and taking on additional responsibilities. Market research shows you''re underpaid by 15%. Margaret appreciates data and documentation, so come prepared.',
    ARRAY['Present clear evidence of your contributions', 'State your specific ask confidently', 'Handle objections without backing down'],
    'a1b2c3d4-1111-4000-8000-000000000001',
    'medium',
    10,
    false,
    true
  ),
  (
    'b1c2d3e4-5555-4000-8000-000000000005',
    'Addressing Unfair Workload Distribution',
    'You''ve noticed that you consistently get assigned more work than your peers. Address this with your coworker who seems to dodge responsibilities.',
    'conflict',
    'For the past quarter, you''ve handled 60% of the team''s incoming requests while Derek handles about 25%. When you brought this up casually, he dismissed it as "just how things work." You need to have a real conversation about fair distribution.',
    ARRAY['Present the workload imbalance factually', 'Propose a fair distribution system', 'Get commitment to change without damaging the relationship'],
    'a1b2c3d4-2222-4000-8000-000000000002',
    'medium',
    10,
    false,
    true
  );
