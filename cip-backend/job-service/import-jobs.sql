-- Import CareerOps Jobs into CIP Database
-- Run this script: psql -U cip -d cip_job -f import-jobs.sql

-- Clear existing jobs (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE jobs RESTART IDENTITY CASCADE;

-- Sample jobs from CareerOps export
-- Note: In production, you would parse the JSON file and generate these INSERT statements

-- Anthropic Jobs
INSERT INTO jobs (company, role, description, location, employment_type, experience_level, salary_range, source_url, minimum_readiness_score, required_skills, nice_to_have_skills, application_deadline, active)
VALUES 
('Anthropic', 'Applied AI Engineer', 'Applied AI Engineer position at Anthropic. Work on cutting-edge AI applications.', 'Remote', 'FULL_TIME', 'MID', '₹20-35 LPA', 'https://job-boards.greenhouse.io/anthropic/jobs/5014500008', 70, '["Python", "Machine Learning", "AI", "LLMs"]'::jsonb, '["PyTorch", "TensorFlow"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('Anthropic', 'Research Engineer, Machine Learning', 'Research Engineer position focusing on ML and reinforcement learning.', 'Remote', 'FULL_TIME', 'MID', '₹25-40 LPA', 'https://job-boards.greenhouse.io/anthropic/jobs/5115935008', 75, '["Python", "Machine Learning", "Research", "Deep Learning"]'::jsonb, '["PyTorch", "JAX"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('Anthropic', 'Software Engineer, Safeguards', 'Build safety systems for AI models.', 'Remote', 'FULL_TIME', 'MID', '₹20-35 LPA', 'https://job-boards.greenhouse.io/anthropic/jobs/4951844008', 70, '["Python", "Software Engineering", "Security"]'::jsonb, '["Kubernetes", "Docker"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- ElevenLabs Jobs
('ElevenLabs', 'Full-Stack Engineer', 'Full-Stack Engineer position at ElevenLabs working on voice AI products.', 'Remote', 'FULL_TIME', 'MID', '₹18-30 LPA', 'https://jobs.ashbyhq.com/elevenlabs/6a530871-b6c6-4783-ac6b-69cc3b084192', 65, '["JavaScript", "TypeScript", "React", "Node.js"]'::jsonb, '["Python", "AWS"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('ElevenLabs', 'Forward Deployed Engineer', 'Work directly with customers to deploy voice AI solutions.', 'Remote', 'FULL_TIME', 'MID', '₹18-30 LPA', 'https://jobs.ashbyhq.com/elevenlabs/6c4c57c1-ec72-42ba-af3a-eb7aebbde2e6', 65, '["Software Engineering", "Customer Success", "APIs"]'::jsonb, '["Python", "React"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- Vercel Jobs
('Vercel', 'Software Engineer, AI SDK', 'Build the AI SDK for developers.', 'Remote', 'FULL_TIME', 'MID', '₹18-30 LPA', 'https://job-boards.greenhouse.io/vercel/jobs/5474915004', 70, '["TypeScript", "Node.js", "AI", "SDK Development"]'::jsonb, '["React", "Next.js"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('Vercel', 'Software Engineer, Backend', 'Backend engineering for Vercel platform.', 'Remote', 'FULL_TIME', 'MID', '₹18-30 LPA', 'https://job-boards.greenhouse.io/vercel/jobs/5431123004', 65, '["Go", "Node.js", "Distributed Systems"]'::jsonb, '["Kubernetes", "PostgreSQL"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- Cohere Jobs
('Cohere', 'Applied AI Engineer', 'Build AI applications using Cohere models.', 'Remote', 'FULL_TIME', 'MID', '₹18-30 LPA', 'https://jobs.ashbyhq.com/cohere/1fa01a03-9253-4f62-8f10-0fe368b38cb9', 70, '["Python", "Machine Learning", "AI", "LLMs"]'::jsonb, '["PyTorch", "FastAPI"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('Cohere', 'Software Engineer, Internal Infrastructure', 'Build internal tools and infrastructure.', 'Remote', 'FULL_TIME', 'MID', '₹18-30 LPA', 'https://jobs.ashbyhq.com/cohere/02c92e66-c89d-4a62-8961-c260d651afe1', 65, '["Python", "Go", "Kubernetes", "Infrastructure"]'::jsonb, '["Terraform", "AWS"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- Sierra Jobs
('Sierra', 'Software Engineer, Agent', 'Build AI agents for customer service.', 'Remote', 'FULL_TIME', 'MID', '₹15-25 LPA', 'https://jobs.ashbyhq.com/sierra/b7d1dbcd-ca72-472f-b15e-5b4b0f886be0', 65, '["Python", "AI", "Machine Learning"]'::jsonb, '["LangChain", "FastAPI"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('Sierra', 'Software Engineer, Frontend', 'Frontend engineering for AI agent platform.', 'Remote', 'FULL_TIME', 'MID', '₹15-25 LPA', 'https://jobs.ashbyhq.com/sierra/f391b10c-7a4a-42b4-9887-dd32b31d6e4e', 60, '["React", "TypeScript", "Frontend"]'::jsonb, '["Next.js", "Tailwind"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- Glean Jobs
('Glean', 'Machine Learning Engineer, AI Assistant', 'Build AI assistants for enterprise search.', 'Remote', 'FULL_TIME', 'MID', '₹20-32 LPA', 'https://job-boards.greenhouse.io/gleanwork/jobs/4605215005', 70, '["Python", "Machine Learning", "NLP", "LLMs"]'::jsonb, '["PyTorch", "Transformers"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('Glean', 'Software Engineer, Backend', 'Backend systems for enterprise AI.', 'Remote', 'FULL_TIME', 'MID', '₹20-32 LPA', 'https://job-boards.greenhouse.io/gleanwork/jobs/4581643005', 65, '["Go", "Python", "Distributed Systems"]'::jsonb, '["Kubernetes", "PostgreSQL"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- LangChain Jobs
('LangChain', 'FullStack Engineer, AI Observability', 'Build LangSmith observability platform.', 'Remote', 'FULL_TIME', 'MID', '₹18-28 LPA', 'https://jobs.ashbyhq.com/langchain/ddf92275-1cc3-49c0-9f25-e8ded43b07f6', 65, '["TypeScript", "React", "Python", "Full Stack"]'::jsonb, '["FastAPI", "PostgreSQL"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('LangChain', 'Fullstack Software Engineer, Applied AI', 'Build AI applications with LangChain.', 'Remote', 'FULL_TIME', 'MID', '₹18-28 LPA', 'https://jobs.ashbyhq.com/langchain/c75915ba-a32b-4e17-873d-19b47564170d', 65, '["Python", "TypeScript", "AI", "Full Stack"]'::jsonb, '["LangChain", "React"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- n8n Jobs
('n8n', 'Sr AI Engineer', 'Senior AI Engineer for workflow automation.', 'Europe', 'FULL_TIME', 'SENIOR', '₹25-40 LPA', 'https://jobs.ashbyhq.com/n8n/d195a389-6af5-4b95-82e5-2258953c7297', 75, '["TypeScript", "Vue.js", "Node.js", "AI"]'::jsonb, '["Python", "LLMs"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

('n8n', 'Sr Cloud Engineer', 'Senior Cloud Engineer for n8n platform.', 'Europe', 'FULL_TIME', 'SENIOR', '₹25-40 LPA', 'https://jobs.ashbyhq.com/n8n/640d55b3-3603-42f4-a05b-90962768fd16', 75, '["Node.js", "TypeScript", "Kubernetes", "Cloud"]'::jsonb, '["AWS", "Docker"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- Zapier Jobs
('Zapier', 'Sr. Applied AI Engineer', 'Senior Applied AI Engineer at Zapier.', 'Remote', 'FULL_TIME', 'SENIOR', '₹25-40 LPA', 'https://jobs.ashbyhq.com/zapier/38434b88-086c-424b-8d18-8d006e0b71b8', 75, '["Python", "AI", "Machine Learning", "LLMs"]'::jsonb, '["PyTorch", "FastAPI"]'::jsonb, CURRENT_DATE + INTERVAL '30 days', true),

-- Internships
('Anthropic', 'Anthropic Fellows Program — AI Safety', 'Fellowship program focused on AI safety research.', 'Remote', 'INTERNSHIP', 'JUNIOR', '₹40,000-60,000/month', 'https://job-boards.greenhouse.io/anthropic/jobs/5183044008', 60, '["Python", "Machine Learning", "Research"]'::jsonb, '["PyTorch", "Safety"]'::jsonb, CURRENT_DATE + INTERVAL '14 days', true),

('Cohere', 'Research Internship', 'Research internship in ML and NLP.', 'Remote', 'INTERNSHIP', 'JUNIOR', '₹35,000-50,000/month', 'https://jobs.ashbyhq.com/cohere/4dd749aa-a675-4430-98fb-6701c8e14ab6', 55, '["Python", "Machine Learning", "Research"]'::jsonb, '["PyTorch", "NLP"]'::jsonb, CURRENT_DATE + INTERVAL '14 days', true),

('Cohere', 'Software Engineer Intern', 'Software engineering internship.', 'Remote', 'INTERNSHIP', 'JUNIOR', '₹35,000-50,000/month', 'https://jobs.ashbyhq.com/cohere/66c98ca3-334b-4a6a-a27c-5807b3686121', 50, '["Python", "Software Engineering"]'::jsonb, '["Go", "TypeScript"]'::jsonb, CURRENT_DATE + INTERVAL '14 days', true),

('Perplexity', 'Internship - Machine Learning Research Engineer', 'ML research internship at Perplexity.', 'Remote', 'INTERNSHIP', 'JUNIOR', '₹40,000-55,000/month', 'https://jobs.ashbyhq.com/perplexity/b9e1ff15-d52a-46d5-abf0-26460f2a116c', 55, '["Python', 'Machine Learning", "Research"]'::jsonb, '["PyTorch", "LLMs"]'::jsonb, CURRENT_DATE + INTERVAL '14 days', true);

-- Add more jobs as needed...
-- The full 429 jobs can be imported using a script that parses the JSON file

SELECT 'Imported ' || COUNT(*) || ' jobs successfully!' FROM jobs;
