
 import { useState } from 'react';

export default function App() {
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([]);

  const handleSendCopilotCommand = async (textToSend: string) => {
    setCopilotLoading(true);
    try {
      const response = await fetch('https://estateflow-crm-production-c127.up.railway.app/api/ai/process-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          userId: 'user123', // Replace with your actual user state
          organizationId: 'org123' // Replace with your actual org state
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCopilotMessages(prev => [...prev, { sender: 'copilot', text: result.explanation }]);
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>EstateFlow CRM</h1>
      <button onClick={() => handleSendCopilotCommand("Check property status")}>
        {copilotLoading ? "Connecting..." : "Send Command"}
      </button>
    </div>
  );
}