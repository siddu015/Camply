const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_BACKEND_URL environment variable is required');
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  loading?: boolean;
}

export interface ChatRequest {
  message: string;
  user_id?: string;
  session_id?: string;
  context?: {
    college_name?: string;
    department?: string;
    branch?: string;
    [key: string]: any;
  };
}

export interface ChatResponse {
  response: string;
  agent_used: string;
  success: boolean;
  error?: string;
  metadata?: {
    processing_time?: number;
    confidence_score?: number;
    source?: string;
    http_status?: number;
    http_status_text?: string;
    error_type?: string;
  };
}

export interface BotStatus {
  isOnline: boolean;
  lastChecked: Date;
  responseTime?: number;
}

export class CamplyBotService {
  private static instance: CamplyBotService;
  private sessionId: string;
  private status: BotStatus;
  
  private constructor() {
    this.sessionId = this.generateSessionId();
    this.status = {
      isOnline: false,
      lastChecked: new Date(),
    };
    this.initializeService();
  }
  
  static getInstance(): CamplyBotService {
    if (!CamplyBotService.instance) {
      CamplyBotService.instance = new CamplyBotService();
    }
    return CamplyBotService.instance;
  }

  private generateSessionId(): string {
    return `camply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeService(): Promise<void> {
    await this.checkHealth();
  }
  
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const enrichedRequest: ChatRequest = {
        ...request,
        session_id: this.sessionId,
      };

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0',
          'X-Session-Id': this.sessionId,
        },
        body: JSON.stringify(enrichedRequest),
      });
      
      const processingTime = Date.now() - startTime;
      
      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        data = {
          response: `Backend response received (HTTP ${response.status}) but could not be parsed as JSON. Raw response available.`,
          success: false,
          error: `Response parsing failed: ${parseError}`,
          agent_used: "response_parser"
        };
      }
      
      console.log('Raw backend response in CamplyBot:', JSON.stringify(data, null, 2));
      
      let responseText = '';
      
      if (data.response) {
        responseText = data.response;
      }
      else if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
          const textPart = candidate.content.parts.find((part: any) => part.text);
          if (textPart && textPart.text) {
            responseText = textPart.text;
          }
        }
      }
      else if (typeof data === 'string') {
        responseText = data;
      }
      else if (data.error) {
        responseText = `Backend error: ${data.error}`;
      }
      else if (data.message) {
        responseText = data.message;
      }         
      else {
        responseText = `Backend responded with HTTP ${response.status} but no readable content found. Raw: ${JSON.stringify(data)}`.substring(0, 500);
      }
      
      return {
        response: responseText,
        agent_used: data.agent_used || "backend_response",
        success: data.success !== undefined ? data.success : response.ok,
        error: data.error,
        metadata: {
          ...data.metadata,
          processing_time: processingTime,
          http_status: response.status,
          http_status_text: response.statusText,
        },
      };
    } catch (error) {
      console.error('Error sending message to Camply bot:', error);
      
      return {
        response: this.getConnectionErrorMessage(error),
        agent_used: "connection_error_handler",
        success: false,
        error: error instanceof Error ? error.message : 'Connection error',
        metadata: {
          processing_time: Date.now() - startTime,
          error_type: 'connection_error',
        },
      };
    }
  }

  private getConnectionErrorMessage(error: unknown): string {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return "Unable to connect to the backend server. Please check your internet connection and ensure the backend is running.";
    }
    
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
        return "Cannot reach the backend server. Please ensure the server is running and accessible.";
      }
    }
    
    return `Connection error: ${error instanceof Error ? error.message : 'Unknown connection issue'}`;
  }
  
  async checkHealth(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });
      
      const responseTime = Date.now() - startTime;
      const isOnline = response.ok;
      
      this.status = {
        isOnline,
        lastChecked: new Date(),
        responseTime: isOnline ? responseTime : undefined,
      };
      
      return isOnline;
    } catch (error) {
      console.error('Health check failed:', error);
      this.status = {
        isOnline: false,
        lastChecked: new Date(),
      };
      return false;
    }
  }

  getStatus(): BotStatus {
    return { ...this.status };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }

  getQuickSuggestions(context?: ChatRequest['context']): string[] {
    const baseSuggestions = [
      "Tell me about my campus",
      "What placements are available?",
      "What courses does my college offer?",
      "Is hostel accommodation available?",
      "How many students study here?",
    ];

    if (context?.college_name) {
      return [
        `What makes ${context.college_name} special?`,
        `What are the top courses at ${context.college_name}?`,
        `Tell me about placements at ${context.college_name}`,
        ...baseSuggestions.slice(3),
      ];
    }

    if (context?.department) {
      return [
        `What opportunities are there in ${context.department}?`,
        `Tell me about ${context.department} faculty`,
        `What companies recruit from ${context.department}?`,
        ...baseSuggestions.slice(3),
      ];
    }

    return baseSuggestions;
  }

  getConversationStarters(context?: ChatRequest['context']): string[] {
    const starters = [
      "Ask me anything about your campus",
      "What would you like to know about your college?",
      "I can help with placements, courses, facilities, and more",
      "Let's explore what your campus has to offer",
      "I'm here to answer your academic questions",
    ];

    if (context?.college_name) {
      starters.unshift(`Hi! I'm here to help you learn about ${context.college_name}`);
    }

    return starters;
  }
} 