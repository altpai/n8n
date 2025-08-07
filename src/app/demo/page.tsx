'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { runCryptoDemo, demonstratePasswordGeneration } from '@/lib/demo/cryptoDemo';
import { Shield, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DemoPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runDemo = async () => {
    setIsRunning(true);
    setStatus('running');
    setOutput([]);

    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      setOutput([...logs]);
      originalLog(...args);
    };

    try {
      await runCryptoDemo();
      demonstratePasswordGeneration();
      setStatus('success');
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      setStatus('error');
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Crypto Demo</h1>
            <p className="text-muted-foreground">
              Test the encryption/decryption functionality of the password manager
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Run Encryption Demo</h2>
            <div className="flex items-center space-x-2">
              {status === 'running' && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Running...</span>
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Success</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            This demo will test the complete encryption/decryption flow including:
          </p>
          <ul className="text-sm text-muted-foreground mb-6 space-y-1 ml-4">
            <li>• Master key derivation from password (PBKDF2)</li>
            <li>• Vault creation with unique encryption keys</li>
            <li>• Entry encryption/decryption (AES-256-GCM)</li>
            <li>• Search functionality on encrypted data</li>
            <li>• Data integrity verification</li>
            <li>• Secure password generation</li>
          </ul>

          <Button 
            onClick={runDemo} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running Demo...' : 'Run Crypto Demo'}
          </Button>
        </div>

        {output.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Demo Output</h3>
            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg max-h-96 overflow-y-auto scrollbar-thin">
              {output.map((line, index) => (
                <div key={index} className="mb-1">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Security Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Encryption</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AES-256-GCM for data encryption</li>
                <li>• PBKDF2 for key derivation (100k iterations)</li>
                <li>• Unique keys per vault</li>
                <li>• Client-side encryption only</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Zero-knowledge architecture</li>
                <li>• Key fingerprinting for integrity</li>
                <li>• Secure random generation</li>
                <li>• No plaintext storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}