// Test script for Drug Explanation API with Multi-language Support
// Run with: node test-drug-explanation-api.js

const BASE_URL = 'http://localhost:3000';

// Supported languages for testing
const SUPPORTED_LANGUAGES = {
  en: 'English',
  yo: 'Yoruba', 
  ha: 'Hausa',
  ig: 'Igbo',
  fr: 'French'
};

// Test scenarios with multi-language support
const testScenarios = [
  {
    name: '✅ Safe Drug Test',
    data: {
      verificationData: {
        drugName: 'Paracetamol 500mg',
        status: 'SAFE',
        reasons: [
          'QR code successfully verified against official registry',
          'Packaging integrity confirmed through visual inspection',
          'Batch information matches manufacturer records'
        ],
        recommendedAction: 'Safe to use as prescribed',
        batchId: 'B001-2025',
        manufacturer: 'PharmaCorp Ltd',
        expiryDate: '2026-12-15',
        trustScore: 95
      }
    }
  },
  {
    name: '🚨 Unsafe Drug Test',
    data: {
      verificationData: {
        drugName: 'Counterfeit Antimalarial',
        status: 'NOT_SAFE',
        reasons: [
          'Batch flagged by regulatory authority for suspicious distribution',
          'QR code does not match any official records',
          'Packaging shows signs of tampering',
          'Drug has expired as of 2023-08-15'
        ],
        recommendedAction: 'Do not use this medication under any circumstances',
        batchId: 'FAKE123',
        manufacturer: 'Unknown Source',
        expiryDate: '2023-08-15',
        trustScore: 12
      }
    }
  },
  {
    name: '⚠️ Suspicious Drug Test',
    data: {
      verificationData: {
        drugName: 'Generic Antibiotic',
        status: 'SUSPICIOUS',
        reasons: [
          'Previously scanned at different location',
          'Unusual distribution pattern detected',
          'Minor packaging inconsistencies noted'
        ],
        recommendedAction: 'Consult pharmacist before use',
        batchId: 'SUS456',
        manufacturer: 'Generic Pharma',
        expiryDate: '2025-03-20',
        trustScore: 67
      }
    }
  }
];

async function testDrugExplanationAPI() {
  console.log('🧪 Testing Drug Explanation API with Multi-language Support...\n');

  // Test GET endpoint for documentation
  try {
    console.log('📋 Testing GET /api/drug-explanation (documentation)...');
    const docResponse = await fetch(`${BASE_URL}/api/drug-explanation`);
    const docData = await docResponse.json();
    
    if (docResponse.ok) {
      console.log('✅ API documentation retrieved successfully');
      console.log(`   Version: ${docData.version}`);
      console.log(`   Supported Languages: ${Object.keys(docData.supportedLanguages).join(', ')}`);
    } else {
      console.log('❌ Failed to get API documentation');
    }
  } catch (error) {
    console.log('🚨 Error testing documentation endpoint:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test each scenario with each language
  for (const scenario of testScenarios) {
    console.log(`🧪 Testing: ${scenario.name}\n`);
    
    for (const [langCode, langName] of Object.entries(SUPPORTED_LANGUAGES)) {
      console.log(`🌍 Language: ${langName} (${langCode})`);
      
      const requestData = {
        ...scenario.data,
        language: langCode
      };

      try {
        const response = await fetch(`${BASE_URL}/api/drug-explanation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
          console.log(`✅ Success! Language used: ${result.languageUsed}`);
          console.log(`   Title: ${result.title.substring(0, 60)}...`);
          console.log(`   Summary: ${result.summary.substring(0, 80)}...`);
          console.log(`   Reasons: ${result.reasons.length} listed`);
          console.log(`   Action: ${result.recommendedAction.substring(0, 50)}...`);
        } else {
          console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
          console.log(`   Message: ${result.message || 'No message'}`);
        }
        
      } catch (error) {
        console.log(`🚨 Error: ${error.message}`);
      }
      
      console.log(''); // Add spacing between languages
    }
    
    console.log('-'.repeat(50) + '\n');
  }

  console.log('🎉 Multi-language Drug Explanation API testing complete!');
}

// Test validation errors including language validation
async function testValidationErrors() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 Testing API Validation (including language validation)...\n');
  
  const validationTests = [
    {
      name: 'Missing drugName',
      data: {
        verificationData: {
          status: 'SAFE',
          reasons: ['Test reason']
        }
      }
    },
    {
      name: 'Invalid status',
      data: {
        verificationData: {
          drugName: 'Test Drug',
          status: 'INVALID_STATUS',
          reasons: ['Test reason']
        }
      }
    },
    {
      name: 'Missing reasons',
      data: {
        verificationData: {
          drugName: 'Test Drug',
          status: 'SAFE'
        }
      }
    },
    {
      name: 'Invalid language code',
      data: {
        verificationData: {
          drugName: 'Test Drug',
          status: 'SAFE',
          reasons: ['Test reason']
        },
        language: 'invalid_lang'
      }
    },
    {
      name: 'Valid language fallback test',
      data: {
        verificationData: {
          drugName: 'Test Drug',
          status: 'SAFE',
          reasons: ['Test reason']
        },
        language: 'yo'
      }
    }
  ];

  for (const test of validationTests) {
    console.log(`🔍 Testing: ${test.name}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/drug-explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.data)
      });

      const result = await response.json();
      
      if (test.name === 'Valid language fallback test') {
        if (response.ok && result.status === 'success') {
          console.log(`✅ Language fallback working: ${result.languageUsed}`);
        } else {
          console.log('❌ Language fallback failed');
        }
      } else if (test.name === 'Invalid language code') {
        if (response.status === 400 && result.status === 'error') {
          console.log('✅ Language validation working correctly');
          console.log(`   Error: ${result.message}`);
        } else {
          console.log('❌ Language validation failed to catch error');
        }
      } else {
        if (response.status === 400 && result.status === 'error') {
          console.log('✅ Validation working correctly');
          console.log(`   Error: ${result.message}`);
        } else {
          console.log('❌ Validation failed to catch error');
        }
      }
      
    } catch (error) {
      console.log(`🚨 Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run all tests
(async () => {
  await testDrugExplanationAPI();
  await testValidationErrors();
})();