const API_BASE_URL = 'http://localhost:8001';

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
}

export class CampusBotService {
  private static instance: CampusBotService;
  
  private constructor() {}
  
  static getInstance(): CampusBotService {
    if (!CampusBotService.instance) {
      CampusBotService.instance = new CampusBotService();
    }
    return CampusBotService.instance;
  }
  
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message to campus bot:', error);
      return {
        response: "I'm having trouble connecting to the server right now. Please try again in a moment.",
        agent_used: "error",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
} 