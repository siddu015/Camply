const API_BASE_URL = 'http://localhost:8001';

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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ChatResponse = await response.json();
      const processingTime = Date.now() - startTime;
      
      return {
        ...data,
        metadata: {
          ...data.metadata,
          processing_time: processingTime,
        },
      };
    } catch (error) {
      console.error('Error sending message to Camply bot:', error);
      
      return {
        response: this.getErrorMessage(error),
        agent_used: "error_handler",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processing_time: Date.now() - startTime,
        },
      };
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return "I'm having trouble connecting to the server. Please check your internet connection and try again.";
    }
    
    if (error instanceof Error) {
      if (error.message.includes('500')) {
        return "The server is experiencing some issues. Please try again in a moment.";
      }
      if (error.message.includes('404')) {
        return "The service is temporarily unavailable. Please try again later.";
      }
      if (error.message.includes('timeout')) {
        return "The request timed out. Please try again with a shorter message.";
      }
    }
    
    return "I'm experiencing technical difficulties right now. Please try again in a moment.";
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