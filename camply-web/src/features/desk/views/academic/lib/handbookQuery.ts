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

export const validateHandbookQuery = (question: string): { isValid: boolean; error?: string; suggestion?: string } => {
  const query = question.trim().toLowerCase();
  
  const handbookKeywords = [
    'attendance', 'policy', 'rule', 'regulation', 'examination', 'exam', 'ia', 'internal assessment',
    'grading', 'grade', 'cgpa', 'gpa', 'marking', 'assessment', 'evaluation', 'criteria',
    'graduation', 'requirement', 'credit', 'course structure', 'academic calendar', 'calendar',
    'fee', 'payment', 'disciplinary', 'conduct', 'procedure', 'deadline', 'submission',
    'leave', 'absence', 'handbook', 'manual', 'guideline', 'semester', 'syllabus',
    'assignment', 'project', 'how to', 'when', 'what', 'where', 'why'
  ];
  
  const nonHandbookKeywords = [
    'placement', 'company', 'job', 'recruit', 'package', 'salary', 'career', 'opportunity',
    'campus life', 'social', 'event', 'festival', 'celebration', 'party', 'fun',
    'college overview', 'history', 'founding', 'establishment', 'ranking', 'accreditation',
    'admission', 'eligibility', 'entrance', 'cutoff', 'application', 'merit', 'facilities',
    'library building', 'campus tour', 'hostel life', 'food court'
  ];
  
  const hasHandbookKeywords = handbookKeywords.some(keyword => query.includes(keyword));
  const hasNonHandbookKeywords = nonHandbookKeywords.some(keyword => query.includes(keyword));

  if (hasNonHandbookKeywords && !hasHandbookKeywords) {
    let suggestion = "general chat or campus assistant";
    
    if (query.includes('placement') || query.includes('company') || query.includes('job')) {
      suggestion = "campus assistant for placement information";
    } else if (query.includes('campus') || query.includes('college') || query.includes('history')) {
      suggestion = "campus assistant for college information";
    } else if (query.includes('admission') || query.includes('eligibility')) {
      suggestion = "campus assistant for admission information";
    }
    
    return {
      isValid: false,
      error: "This question is not about handbook policies or rules.",
      suggestion: `For questions about this topic, please use the ${suggestion}.`
    };
  }
  
  return { isValid: true };
};

export const queryHandbookBackend = async (
  question: string, 
  userId: string
): Promise<string> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_URL environment variable is required');
    }
    
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Answer handbook question: ${question.trim()} for user_id: ${userId}`,
        user_id: userId,
        session_id: `handbook_session_${userId}_${Date.now()}`,
        context: {
          type: 'handbook_query',
          question: question.trim(),
          agent_requested: 'handbook_agent'
        }
      }),
    });

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      return `Backend responded with HTTP ${response.status} but response could not be parsed. The server may have sent a non-JSON response.`;
    }
    
    console.log('Raw backend response:', JSON.stringify(data, null, 2));
    
    if (data.response) {
      return data.response;
    }
    
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        const textPart = candidate.content.parts.find((part: any) => part.text);
        if (textPart && textPart.text) {
          return textPart.text;
        }
      }
    }
    
    if (typeof data === 'string') {
      return data;
    }
    
    if (data.error) {
      return `Backend error: ${data.error}`;
    }
    
    if (data.message) {
      return data.message;
    }
    
    if (data.success === false && data.message) {
      return data.message;
    }

    return `Backend responded (HTTP ${response.status}) with data but no readable content was found. Raw response: ${JSON.stringify(data)}`.substring(0, 500);
    
  } catch (err) {
    console.error('Error querying handbook:', err);
    
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error("Unable to connect to the backend server. Please check your internet connection and ensure the backend is running.");
    }
    
    if (err instanceof Error && (err.message.includes('NetworkError') || err.message.includes('ECONNREFUSED'))) {
      throw new Error("Cannot reach the backend server. Please ensure the server is running and accessible.");
    }
    
    throw new Error(`Connection error: ${err instanceof Error ? err.message : 'Unknown connection issue'}`);
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

    const basicValidation = validateQuery(question);
    if (!basicValidation.isValid) {
      return {
        success: false,
        error: basicValidation.error
      };
    }

    const handbookValidation = validateHandbookQuery(question);
    if (!handbookValidation.isValid) {
      return {
        success: false,
        error: `${handbookValidation.error} ${handbookValidation.suggestion || ''}`
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