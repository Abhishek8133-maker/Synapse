import { embeddingService } from '@/lib/embeddings'

// Test function to verify OpenAI API connection
async function testEmbeddingAPI() {
  console.log('Testing OpenAI Embeddings API...')

  try {
    const testText = "Synapse is a personal knowledge management system"
    console.log('Generating embedding for test text:', testText)

    const embedding = await embeddingService.generateEmbedding(testText)

    console.log('✅ Embedding generated successfully!')
    console.log('Embedding dimensions:', embedding.length)
    console.log('First 5 dimensions:', embedding.slice(0, 5))

    return true
  } catch (error) {
    console.error('❌ Error generating embedding:', error)
    return false
  }
}

// Test function to verify semantic search
async function testSemanticSearch() {
  console.log('\nTesting semantic search capabilities...')

  try {
    const texts = [
      "Machine learning is a subset of artificial intelligence",
      "The stock market can be volatile during economic uncertainty",
      "Python is a popular programming language for data science",
      "Climate change affects global weather patterns"
    ]

    console.log('Generating embeddings for test texts...')
    const embeddings = await embeddingService.generateBatchEmbeddings(texts)

    console.log('✅ Batch embeddings generated successfully!')
    console.log('Generated embeddings for', embeddings.length, 'texts')

    // Test similarity search
    const query = "AI and machine learning"
    const { similarities, sortedIndices } = await embeddingService.searchEmbedding(query, embeddings)

    console.log('\nQuery:', query)
    console.log('Similarity scores:')
    sortedIndices.slice(0, 3).forEach((index, i) => {
      console.log(`${i + 1}. "${texts[index].substring(0, 50)}..." - Similarity: ${similarities[index].toFixed(4)}`)
    })

    return true
  } catch (error) {
    console.error('❌ Error in semantic search test:', error)
    return false
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Synapse Embedding Service')
  console.log('=====================================\n')

  const embeddingTest = await testEmbeddingAPI()
  const semanticTest = await testSemanticSearch()

  console.log('\n📊 Test Results:')
  console.log('Embedding API:', embeddingTest ? '✅ PASS' : '❌ FAIL')
  console.log('Semantic Search:', semanticTest ? '✅ PASS' : '❌ FAIL')

  if (embeddingTest && semanticTest) {
    console.log('\n🎉 All tests passed! Your OpenAI API key is working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Please check your API key configuration.')
  }
}

// Export for use in API route or manual testing
export { runTests, testEmbeddingAPI, testSemanticSearch }

// If running directly (for testing)
if (typeof window === 'undefined' && require.main === module) {
  runTests().catch(console.error)
}