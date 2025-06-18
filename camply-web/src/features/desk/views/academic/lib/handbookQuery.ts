export interface QueryResponse {
  question: string;
  answer: string;
  timestamp: string;
  id: string;
}

export interface QueryState {
  responses: QueryResponse[];
  loading: boolean;
  error?: string;
}

export const createUserQuery = (question: string): QueryResponse => {
  return {
    id: Date.now().toString(),
    question: question.trim(),
    answer: "",
    timestamp: new Date().toISOString(),
  };
};

export const createBotResponse = (answer: string): QueryResponse => {
  return {
    id: (Date.now() + 1).toString(),
    question: "",
    answer,
    timestamp: new Date().toISOString(),
  };
};

export const createErrorResponse = (errorMessage: string): QueryResponse => {
  return {
    id: (Date.now() + 1).toString(),
    question: "",
    answer: errorMessage || "Sorry, there was an error processing your question. Please try again.",
    timestamp: new Date().toISOString(),
  };
};

export const queryHandbookBackend = async (
  question: string, 
  userId: string
): Promise<string> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
    
    // Use the chat endpoint which routes through the student_desk agent
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `[HANDBOOK QUERY] ${question.trim()}`,
        user_id: userId,
        session_id: `handbook_session_${userId}_${Date.now()}`,
        context: {
          type: 'handbook_query',
          question: question.trim()
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to process handbook query");
    }
    
    return data.response || "Sorry, I could not find information about that in your handbook.";
  } catch (err) {
    console.error('Error querying handbook:', err);
    throw new Error("Sorry, there was an error processing your question. Please try again.");
  }
};

export const validateQuery = (question: string): { isValid: boolean; error?: string } => {
  if (!question.trim()) {
    return { isValid: false, error: "Please enter a question" };
  }
  
  if (question.trim().length < 3) {
    return { isValid: false, error: "Question is too short" };
  }
  
  if (question.trim().length > 1000) {
    return { isValid: false, error: "Question is too long" };
  }
  
  return { isValid: true };
};

export const processHandbookQuery = async (
  question: string,
  userId: string,
  handbookExists: boolean
): Promise<{
  success: boolean;
  userResponse?: QueryResponse;
  botResponse?: QueryResponse;
  error?: string;
}> => {
  try {
    const { getUserHandbook } = await import('./handbook');
    
    if (!handbookExists) {
      return {
        success: false,
        error: "No handbook found. Please upload a handbook first."
      };
    }

    const handbook = await getUserHandbook(userId);
    if (!handbook) {
      return {
        success: false,
        error: "No handbook found. Please upload a handbook first."
      };
    }

    if (handbook.processing_status === 'uploaded') {
      return {
        success: false,
        error: "Your handbook is still being processed. Please wait a few minutes and try again."
      };
    }

    if (handbook.processing_status === 'processing') {
      return {
        success: false,
        error: "Your handbook is currently being processed. Please wait a few minutes and try again."
      };
    }

    if (handbook.processing_status === 'failed') {
      return {
        success: false,
        error: "There was an error processing your handbook. Please try re-uploading it."
      };
    }

    const validation = validateQuery(question);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const userResponse = createUserQuery(question);

    const answer = await queryHandbookBackend(question, userId);
    const botResponse = createBotResponse(answer);

    return {
      success: true,
      userResponse,
      botResponse
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Query processing failed";
    return {
      success: false,
      error: errorMessage,
      userResponse: createUserQuery(question),
      botResponse: createErrorResponse(errorMessage)
    };
  }
};

export const getSuggestedQuestions = (): string[] => {
  return [
    "What is the attendance policy?",
    "How is CGPA calculated?",
    "What are the examination rules?",
    "What is the late submission policy?",
    "How do I apply for academic leave?",
    "What are the graduation requirements?",
    "What is the grading system?",
    "What are the disciplinary rules?"
  ];
}; 