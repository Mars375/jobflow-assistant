import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to generate embeddings')
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey })
  }

  return openaiClient
}

function ensureText(text: string): string {
  const value = text.trim()
  if (!value) {
    throw new Error('Cannot generate embedding for empty text')
  }
  return value
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: ensureText(text),
    dimensions: 1536,
  })

  return response.data[0]?.embedding ?? []
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const validTexts = texts.map((value) => value.trim()).filter(Boolean)
  if (validTexts.length === 0) {
    return []
  }

  const response = await getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: validTexts,
    dimensions: 1536,
  })

  return response.data.map((item) => item.embedding)
}
