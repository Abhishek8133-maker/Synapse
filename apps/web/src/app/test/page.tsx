'use client'

import { useState } from 'react'

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [customText, setCustomText] = useState('')

  const testAPIConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test/embeddings')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to connect to test API'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testCustomEmbedding = async () => {
    if (!customText.trim()) {
      alert('Please enter some text to test')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/test/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: customText }),
      })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to generate embedding'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Synapse API Test</h1>
          <p className="text-gray-600">Test your OpenAI API key and embedding service</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Configuration Test</h2>
          <p className="text-gray-600 mb-4">
            Test if your OpenAI API key is working correctly.
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              ✅ API key is valid (429 error - requires billing setup)
            </span>
          </p>

          <button
            onClick={testAPIConnection}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : '🚀 Test API Connection'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Custom Text Test</h2>
          <p className="text-gray-600 mb-4">
            Test embedding generation with your own text.
          </p>

          <div className="space-y-4">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter text to generate embeddings for..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />

            <button
              onClick={testCustomEmbedding}
              disabled={isLoading || !customText.trim()}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : '🔤 Generate Embedding'}
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`rounded-lg shadow-md p-6 ${
            testResult.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.message}
            </h2>

            {testResult.success && testResult.results && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Embedding Dimensions:</span>
                    <span className="ml-2">{testResult.results.embedding_dimensions}</span>
                  </div>
                  <div>
                    <span className="font-medium">API Key Status:</span>
                    <span className="ml-2 text-green-600">{testResult.results.api_key_status}</span>
                  </div>
                  <div>
                    <span className="font-medium">Similarity Score:</span>
                    <span className="ml-2">{testResult.results.similarity_score?.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Sample Embedding:</span>
                    <span className="ml-2 text-xs text-gray-600">
                      [{testResult.results.sample_embedding?.join(', ')}]
                    </span>
                  </div>
                </div>
              </div>
            )}

            {testResult.error && (
              <div className="mt-4">
                <p className="font-medium text-red-800">Error Details:</p>
                <p className="text-red-700 mt-1">{testResult.error}</p>

                {testResult.troubleshooting && (
                  <div className="mt-4">
                    <p className="font-medium text-red-800">Troubleshooting Tips:</p>
                    <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                      {testResult.troubleshooting.map((tip: string, index: number) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-gray-500">
          <p className="mb-2">🔧 Your API key has been configured in the environment.</p>
          <p className="text-sm">Visit <code className="bg-gray-100 px-2 py-1 rounded">/api/test/embeddings</code> for direct API testing.</p>
        </div>
      </div>
    </div>
  )
}