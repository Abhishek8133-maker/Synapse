#!/usr/bin/env node

// Simple test script to verify OpenAI API key
const API_KEY = 'sk-tEncCfKIWLpmMkAW0v3J3g';

async function testOpenAIKey() {
  console.log('🧪 Testing OpenAI API Key...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: 'Synapse is a knowledge management system',
        model: 'text-embedding-3-small',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid!');
      console.log('Embedding dimensions:', data.data[0].embedding.length);
      console.log('Model used:', data.model);
      console.log('Tokens used:', data.usage.total_tokens);
      return true;
    } else {
      const error = await response.json();
      console.log('❌ API Key test failed');
      console.log('Status:', response.status);
      console.log('Error:', error.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Run the test
testOpenAIKey().then(success => {
  if (success) {
    console.log('\n🎉 Your OpenAI API key is ready for use in Synapse!');
  } else {
    console.log('\n⚠️ Please check your API key and try again.');
  }
});