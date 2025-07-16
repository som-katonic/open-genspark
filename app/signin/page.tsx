"use client";

import { useState, useEffect } from "react";
import { FiCheckCircle, FiLoader, FiExternalLink } from 'react-icons/fi';
import { Meteors } from "../../components/ui/meteors";
import { Typewriter } from "../../components/ui/typewriter-text";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export default function SignIn() {
  const [sheetsStatus, setSheetsStatus] = useState<ConnectionStatus>('disconnected');
  const [docsStatus, setDocsStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (sheetsStatus === 'connected' && docsStatus === 'connected') {
      // Both are connected, redirect to the main app
      setTimeout(() => {
        window.location.href = '/';
      }, 1000); // Wait a second to show success
    }
  }, [sheetsStatus, docsStatus]);

  const handleSignIn = async (platform: 'google-sheet' | 'google-docs') => {
    const setStatus = platform === 'google-sheet' ? setSheetsStatus : setDocsStatus;
    setStatus('connecting');
    
    try {
      // 1. Initiate connection
      const initiateResponse = await fetch(`/api/connection/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate" }),
      });

      if (!initiateResponse.ok) throw new Error(`Failed to initiate ${platform} connection`);
      const initiateData = await initiateResponse.json();

      if (initiateData.success && initiateData.alreadyConnected) {
        setStatus('connected');
        return;
      }

      if (!initiateData.success || !initiateData.redirectUrl) {
        throw new Error(`Failed to get redirect URL for ${platform}`);
      }

      const { redirectUrl, connectionId } = initiateData;

      // 2. Open OAuth window
      const oauthWindow = window.open(redirectUrl, 'oauth-window', 'width=600,height=700');
      if (!oauthWindow) {
        alert('Please allow pop-ups for this site to sign in.');
        setStatus('disconnected');
        return;
      }

      // 3. Poll for connection status
      const pollInterval = setInterval(async () => {
        if (oauthWindow.closed) {
          clearInterval(pollInterval);
          setStatus('disconnected'); // Assume user cancelled
          return;
        }

        try {
          const statusResponse = await fetch(`/api/connection/${platform}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check_status', connectionId }),
          });
          const statusData = await statusResponse.json();

          if (statusData.success && statusData.isActive) {
            clearInterval(pollInterval);
            oauthWindow.close();
            setStatus('connected');
          }
        } catch (error) {
          console.error(`Error polling ${platform} status:`, error);
        }
      }, 2000);

    } catch (error) {
      console.error(`Error signing in with ${platform}:`, error);
      setStatus('disconnected');
      alert(`An error occurred during sign-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const AuthButton = ({ platform, status }: { platform: 'google-sheet' | 'google-docs', status: ConnectionStatus }) => {
    const platformName = platform === 'google-sheet' ? 'Google Sheets' : 'Google Docs';
    const isLoading = status === 'connecting';
    const isConnected = status === 'connected';

    return (
      <button
        onClick={() => handleSignIn(platform)}
        disabled={isLoading || isConnected}
        className="w-full max-w-xs px-6 py-3 text-lg font-semibold text-white bg-gray-800 border-2 border-gray-600 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
      >
        {isLoading && <FiLoader className="animate-spin" />}
        {isConnected && <FiCheckCircle className="text-green-400" />}
        <span>{isConnected ? `${platformName} Connected` : `Sign in with ${platformName}`}</span>
        {!isConnected && !isLoading && <FiExternalLink />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative text-white">
      <Meteors number={30} />
      
      <div className="relative z-10 text-center space-y-12 p-8 max-w-2xl w-full">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold mb-2">
            <Typewriter 
              text="Welcome to Super Agent"
              speed={80}
              className="text-5xl font-bold"
            />
          </h1>
          <p className="text-xl text-gray-400">
            powered by Composio
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-semibold">Connect Your Google Account</h2>
          <p className="text-gray-400">Please connect both Google Sheets and Google Docs to continue.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <AuthButton platform="google-sheet" status={sheetsStatus} />
            <AuthButton platform="google-docs" status={docsStatus} />
          </div>
        </div>

        {sheetsStatus === 'connected' && docsStatus === 'connected' && (
          <div className="flex items-center justify-center space-x-3 text-green-400 text-lg">
            <FiCheckCircle />
            <span>All set! Redirecting you to the app...</span>
          </div>
        )}
      </div>
    </div>
  );
} 