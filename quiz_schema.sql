-- Quiz Database Schema for O2 Guru Summit
-- This creates tables for quiz questions, answers, and media files

-- Quiz questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'text_input', 'video', 'audio')),
    category TEXT DEFAULT 'general',
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 10,
    time_limit INTEGER DEFAULT 30, -- seconds
    is_active BOOLEAN DEFAULT true,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Quiz answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Quiz media files table (for videos, audio, images)
CREATE TABLE IF NOT EXISTS public.quiz_media (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Supabase storage URL
    file_type TEXT NOT NULL CHECK (file_type IN ('video', 'audio', 'image')),
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Quiz sessions/results table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0 -- seconds
);

-- Quiz answers given by users
CREATE TABLE IF NOT EXISTS public.quiz_user_answers (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    answer_id BIGINT REFERENCES public.quiz_answers(id) ON DELETE SET NULL,
    text_answer TEXT, -- for text input questions
    is_correct BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0, -- seconds for this question
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON public.quiz_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON public.quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_media_question_id ON public.quiz_media(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user_answers_session_id ON public.quiz_user_answers(session_id);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_user_answers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "allow_all_operations_quiz_questions" ON public.quiz_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operations_quiz_answers" ON public.quiz_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operations_quiz_media" ON public.quiz_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operations_quiz_sessions" ON public.quiz_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_operations_quiz_user_answers" ON public.quiz_user_answers FOR ALL USING (true) WITH CHECK (true);

-- Sample quiz data (optional - can be removed)
INSERT INTO public.quiz_questions (question_text, question_type, category, difficulty, points, time_limit, order_position) VALUES
('Jaký je hlavní produkt společnosti O2?', 'multiple_choice', 'general', 'easy', 10, 30, 1),
('Který z následujících operátorů nabízí nejrychlejší 5G síť v ČR?', 'multiple_choice', 'technical', 'medium', 15, 45, 2),
('O2 Guru Summit se koná každý rok.', 'true_false', 'general', 'easy', 5, 15, 3)
ON CONFLICT DO NOTHING;

-- Sample answers
INSERT INTO public.quiz_answers (question_id, answer_text, is_correct, order_position) VALUES
(1, 'Mobilní služby', true, 1),
(1, 'Televizní vysílání', false, 2),
(1, 'Internetové služby', false, 3),
(1, 'Energetické služby', false, 4),
(2, 'O2', true, 1),
(2, 'Vodafone', false, 2),
(2, 'T-Mobile', false, 3),
(3, 'Pravda', true, 1),
(3, 'Nepravda', false, 2)
ON CONFLICT DO NOTHING;

COMMIT;