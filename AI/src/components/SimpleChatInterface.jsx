import { useState, useEffect } from "react";

function SimpleChatInterface({ onMessageSent, isAnalyzing }) {
  // Function to format bot response text for better readability
  const formatBotResponse = (text) => {
    // Remove markdown formatting
    let formatted = text
      .replace(/\*\*/g, "") // Remove markdown asterisks
      .replace(/\*/g, "") // Remove single asterisks
      .trim();

    // Check if this looks like a numbered list response
    if (formatted.includes("1.") && formatted.includes("2.")) {
      // Split into sentences and rebuild with proper formatting
      const parts = formatted.split(/(\d+\.\s)/);
      let result = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // If this is a number marker (1., 2., etc.)
        if (/^\d+\.\s$/.test(part)) {
          result += "\n\n" + part;
        }
        // If this is content after a number
        else if (i > 0 && /^\d+\.\s$/.test(parts[i - 1])) {
          result += part;
        }
        // First part (before any numbers)
        else if (i === 0) {
          result += part;
        }
        // Other parts
        else {
          result += part;
        }
      }

      return result.replace(/^\n+/, "").trim();
    }

    // For non-list responses, just clean up
    return formatted;
  };

  // Clean up any old fetch interceptors on mount
  useEffect(() => {
    // Restore original fetch if it was intercepted
    if (window.originalFetch) {
      window.fetch = window.originalFetch;
      delete window.originalFetch;
    }

    // Clean up any old n8n chat instances
    if (window.n8nChatInstance) {
      delete window.n8nChatInstance;
    }

    // Clean up any old message handlers
    if (window.messageHandler) {
      delete window.messageHandler;
    }

    console.log("🧹 Cleaned up old chat components");
  }, []);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hi! Ask me about your data. I can show you locations on the map and create charts. First, make sure to upload a dataset!",
      timestamp: new Date(),
      showSuggestions: true,
    },
  ]);

  const sampleQueries = [
    "Show me the top 5 rows of data",
    "What columns are in this dataset?",
    "Give me a summary of the numerical columns",
  ];

  const handleSuggestionClick = (query) => {
    setMessage(query);
    // Auto-submit the query
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isAnalyzing) return;

    const currentMessage = message;

    // Clear input immediately and add user message
    setMessage("");
    const userMessage = {
      id: Date.now(),
      type: "user",
      text: currentMessage,
      timestamp: new Date(),
    };

    // Hide suggestions after first user message
    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg.showSuggestions ? { ...msg, showSuggestions: false } : msg
      );
      return [...updated, userMessage];
    });

    // Add typing indicator immediately
    const typingIndicator = {
      id: Date.now() + 1,
      type: "typing",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, typingIndicator]);

    // Send to Data-Analysis Flask backend
    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Remove typing indicator and add bot response
          setMessages((prev) => {
            const withoutTyping = prev.filter((msg) => msg.type !== "typing");

            // Clean up and format the response text
            const cleanText = formatBotResponse(
              data.message || "Response received successfully."
            );

            const botMessage = {
              id: Date.now() + 2,
              type: "bot",
              text: cleanText,
              timestamp: new Date(),
            };
            return [...withoutTyping, botMessage];
          });

          // Trigger map/chart updates with the message
          if (onMessageSent && data.message) {
            onMessageSent(data.message);
          }
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove typing indicator and add error message
      setMessages((prev) => {
        const withoutTyping = prev.filter((msg) => msg.type !== "typing");
        const errorMessage = {
          id: Date.now() + 2,
          type: "bot",
          text: "Sorry, there was an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        return [...withoutTyping, errorMessage];
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "350px",
        height: "500px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f8fafc",
          borderRadius: "12px 12px 0 0",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Data Analysis Assistant
        </h3>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          Ask questions and visualize your data
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
            }}
          >
            {msg.type === "typing" ? (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "3px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#6b7280",
                      animation: "pulse 1.4s infinite ease-in-out",
                    }}
                  ></div>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#6b7280",
                      animation: "pulse 1.4s infinite ease-in-out 0.2s",
                    }}
                  ></div>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#6b7280",
                      animation: "pulse 1.4s infinite ease-in-out 0.4s",
                    }}
                  ></div>
                </div>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  Thinking...
                </span>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius:
                      msg.type === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    backgroundColor:
                      msg.type === "user" ? "#3b82f6" : "#f3f4f6",
                    color: msg.type === "user" ? "white" : "#1f2937",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    whiteSpace: "pre-line", // This preserves line breaks and formatting
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    marginTop: "4px",
                    textAlign: msg.type === "user" ? "right" : "left",
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* Show sample queries for the first bot message */}
                {msg.showSuggestions && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "4px",
                      }}
                    >
                      Try these sample queries:
                    </div>
                    {sampleQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(query)}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#374151",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s",
                          ":hover": {
                            backgroundColor: "#f1f5f9",
                            borderColor: "#3b82f6",
                          },
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f1f5f9";
                          e.target.style.borderColor = "#3b82f6";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#f8fafc";
                          e.target.style.borderColor = "#e5e7eb";
                        }}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your data..."
          disabled={isAnalyzing}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "20px",
            outline: "none",
            fontSize: "14px",
            backgroundColor: isAnalyzing ? "#f9fafb" : "white",
          }}
        />
        <button
          type="submit"
          disabled={!message.trim() || isAnalyzing}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            backgroundColor:
              message.trim() && !isAnalyzing ? "#3b82f6" : "#d1d5db",
            color: "white",
            cursor: message.trim() && !isAnalyzing ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}

export default SimpleChatInterface;
