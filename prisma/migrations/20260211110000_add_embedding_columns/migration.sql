CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

ALTER TABLE "JobPosting"
ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "JobPosting_embedding_idx"
ON "JobPosting"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS "UserProfile_embedding_idx"
ON "UserProfile"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 20);
