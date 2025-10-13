import React, { useState, useRef } from 'react';
import { runDataIntegrityTests, createTestDataOnly } from '../tests/dataIntegrityTests';

const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string>('');
  const [testsPassed, setTestsPassed] = useState<boolean | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Capture console output during tests
  const captureConsoleOutput = () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    let output = '';
    
    console.log = (...args) => {
      const message = args.join(' ');
      output += message + '\n';
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      output += `ERROR: ${message}\n`;
      originalError(...args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      output += `WARN: ${message}\n`;
      originalWarn(...args);
    };
    
    return {
      getOutput: () => output,
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    };
  };

  const runTests = async (keepData: boolean = false) => {
    setIsRunning(true);
    setResults('');
    setTestsPassed(null);
    
    const consoleCapture = captureConsoleOutput();
    
    try {
      const startTime = Date.now();
      const passed = await runDataIntegrityTests(keepData);
      const endTime = Date.now();
      
      const output = consoleCapture.getOutput();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      setResults(output + `\n⏱️ Tests completed in ${duration} seconds`);
      setTestsPassed(passed);
      
      // Scroll to bottom of results
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      const output = consoleCapture.getOutput();
      setResults(output + `\n❌ Test suite failed with error: ${error}`);
      setTestsPassed(false);
    } finally {
      consoleCapture.restore();
      setIsRunning(false);
    }
  };

  const createTestData = async () => {
    setIsRunning(true);
    setResults('');
    setTestsPassed(null);
    
    const consoleCapture = captureConsoleOutput();
    
    try {
      const startTime = Date.now();
      await createTestDataOnly();
      const endTime = Date.now();
      
      const output = consoleCapture.getOutput();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      setResults(output + `\n⏱️ Test data created in ${duration} seconds\n\n🎯 Navigate to Friends or Timeline to see your new test data!`);
      setTestsPassed(true);
      
      // Scroll to bottom of results
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      const output = consoleCapture.getOutput();
      setResults(output + `\n❌ Failed to create test data: ${error}`);
      setTestsPassed(false);
    } finally {
      consoleCapture.restore();
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 The Load Down Data Integrity Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Comprehensive automated testing suite for validating CRUD operations, data persistence, backup/restore functionality.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">👥 Friends Testing</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Create <strong>50 test friends</strong></li>
                <li>• Rich profiles & photos (5 each)</li>
                <li>• Social profiles & ratings</li>
                <li>• Cities, occupations, ethnicities</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🔥 Encounters Testing</h3>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Create <strong>200 test encounters</strong></li>
                <li>• Payment data (50% paid)</li>
                <li>• Photos (4 each) & locations</li>
                <li>• Ratings, roles, safety data</li>
              </ul>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">💾 Backup Testing</h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Create complete backup</li>
                <li>• Clear all data</li>
                <li>• Restore from backup</li>
                <li>• Validate data preservation</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => runTests(false)}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95'
              }`}
            >
              {isRunning ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running...
                </div>
              ) : (
                '🧪 Run Tests (Clean)'
              )}
            </button>

            <button
              onClick={() => runTests(true)}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-95'
              }`}
            >
              🧪 Test + Keep Data
            </button>

            <button
              onClick={() => createTestData()}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-95'
              }`}
            >
              🎨 Create Test Data Only
            </button>
          </div>

          <div className="flex justify-center mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <strong>🧪 Clean Tests:</strong> Validates everything, cleans up after<br/>
              <strong>🎨 Keep Data:</strong> Same tests but leaves data for exploration<br/>
              <strong>🎨 Data Only:</strong> Creates <strong>50 friends + 200 encounters</strong> with photos<br/>
              <div className="mt-2 text-xs opacity-75">
                ⚠️ Large dataset may take 30-60 seconds to generate
              </div>
            </div>
            
            {testsPassed !== null && (
              <div className={`flex items-center px-4 py-2 rounded-lg font-semibold ${
                testsPassed 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {testsPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
              </div>
            )}
          </div>
        </div>

        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Results</h2>
            </div>
            
            <div
              ref={logRef}
              className="p-6 max-h-96 overflow-y-auto bg-gray-900 text-green-400 font-mono text-sm"
              style={{ backgroundColor: '#0d1117' }}
            >
              <pre className="whitespace-pre-wrap leading-relaxed">
                {results.split('\n').map((line, index) => (
                  <div key={index} className={
                    line.includes('✅') ? 'text-green-400' :
                    line.includes('❌') || line.includes('ERROR:') ? 'text-red-400' :
                    line.includes('⚠️') || line.includes('WARN:') ? 'text-yellow-400' :
                    line.includes('📊') || line.includes('🚀') ? 'text-blue-400' :
                    line.includes('⏱️') ? 'text-purple-400' :
                    'text-gray-300'
                  }>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                💡 Test results show detailed validation of all CRUD operations, data integrity checks, and backup functionality.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRunner;