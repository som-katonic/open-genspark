"use client";

import { useState, useEffect } from "react";
import { FlowButton } from "../../components/ui/flow-button";
import { Meteors } from "../../components/ui/meteors";
import { Typewriter } from "../../components/ui/typewriter-text";
import { parseCookies } from '../../lib/utils';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  // Check for auth success from URL params
  useEffect(() => {
    const cookies = parseCookies();
    const userId = cookies['zeroemail_user_id'];
    const urlParams = new URLSearchParams(window.location.search);

    if (userId || urlParams.get('auth') === 'success') {
      window.location.href = '/';
    }
  }, []);

  const handleComposioSignIn = async () => {
    setIsLoading(true);
    
    try {
      const cookies = parseCookies();
      const userId = cookies['zeroemail_user_id'];
      const response = await fetch("/api/connecting-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "initiate",
          platform: "gmail",
          user_id: userId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate connection");
      }

      const data = await response.json();
      
      if (data.success && data.alreadyConnected) {
        window.location.href = '/';
        return;
      }
      if (data.success && data.redirectUrl) {
        // Open OAuth window
        const oauthWindow = window.open(
          data.redirectUrl,
          'composio-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!oauthWindow) {
          throw new Error('Failed to open OAuth window. Please check your popup blocker.');
        }

        // Poll for OAuth completion
        const pollInterval = setInterval(async () => {
          // Check if window is closed
          if (oauthWindow.closed) {
            clearInterval(pollInterval);
            await checkConnectionStatus(data.connectionId);
            return;
          }

          // Check connection status periodically
          try {
            const statusResponse = await fetch(`/api/connecting-email?connectionId=${data.connectionId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.success && statusData.isActive) {
              clearInterval(pollInterval);
              oauthWindow.close();
              // Redirect to main app
              window.location.href = '/';
            }
          } catch (pollError) {
            console.error('Status check error:', pollError);
          }
        }, 2000);

        // Clean up interval after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (!oauthWindow.closed) {
            oauthWindow.close();
          }
        }, 300000);
      }
    } catch (error) {
      console.error("Error connecting to Composio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connecting-email?connectionId=${connectionId}`);

      const data = await response.json();
      
      if (data.success && data.isActive) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      <Meteors number={30} />
      
      <div className="relative z-10 text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white mb-2 min-h-[3.5rem]">
            <Typewriter 
              text="Welcome to Google Super Agent"
              speed={80}
              className="text-5xl font-bold text-white"
            />
          </h1>
          <p className="text-xl text-gray-400 max-w-md mx-auto">
            powered by Composio
          </p>
        </div>

        <div className="pt-8 flex justify-center">
          <div onClick={handleComposioSignIn} className={isLoading ? "pointer-events-none opacity-50" : ""}>
            <FlowButton 
              text={isLoading ? "Connecting..." : "Sign in with Composio"}
            />
          </div>
        </div>

      </div>
    </div>
  );
} 