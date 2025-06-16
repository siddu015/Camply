import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle,
  Bot,
  Loader2,
} from 'lucide-react';
import { useCampusData } from '../hooks/useCampusData';
import { supabase } from '@/lib/supabase.ts';
import { CamplyBotService } from '@/features/camply-ai/camply-bot';
import { getCampusPrompt, generatePromptText } from '../lib/campus-prompts';
import { CampusMarkdownRenderer } from '../components/CampusMarkdownRenderer';
import { CampusCacheService } from '../lib/campus-cache';
import type { ChatRequest, ChatResponse } from '@/features/camply-ai/camply-bot';
import { cn } from '@/components/sidebar/lib/utils';

interface BaseCampusPageProps {
  featureId: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export function BaseCampusPage({ featureId, icon: IconComponent, gradient }: BaseCampusPageProps) {
  const [session, setSession] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { academicDetails, college } = useCampusData(session?.user?.id);
  
  const camplyBot = CamplyBotService.getInstance();
  const cacheService = CampusCacheService.getInstance();
  const promptConfig = getCampusPrompt(featureId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id && college?.college_id) {
      fetchContent();
    }
  }, [session?.user?.id, college?.college_id, featureId]);

  const fetchContent = async (forceRefresh = false) => {
    if (!session?.user?.id || !college || !promptConfig) {
      setError('Required information not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedContent = cacheService.getCachedContent(featureId, session.user.id, college.college_id);
        if (cachedContent) {
          setContent(cachedContent.content);
          setLoading(false);
          // Scroll to top after content loads
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      const promptText = generatePromptText(featureId, college.name);

      const chatRequest: ChatRequest = {
        message: promptText,
        user_id: session.user.id,
        context: {
          college_name: college.name,
          college_website: college.college_website_url,
          department: academicDetails?.department_name,
          branch: academicDetails?.branch_name,
          query_type: featureId,
          feature_button: true,
          prompt_config: promptConfig
        }
      };

      const response: ChatResponse = await camplyBot.sendMessage(chatRequest);

      if (response.success && response.response) {
        setContent(response.response);
        // Cache the content
        cacheService.setCachedContent(featureId, session.user.id, response.response, college.college_id);
        // Scroll to top after content loads
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.error || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching campus information:', error);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchContent(true);
  };

  if (!promptConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Configuration Error</h2>
          <p className="text-muted-foreground">This feature is not properly configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div 
        className="relative h-72 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradient.replace('from-', '').replace('to-', ', ')})`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,white_2px,transparent_2px)] bg-[length:60px_60px]" />
        </div>
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 px-8 py-8 h-full flex flex-col max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/profile/campus')}
              className="group flex items-center space-x-2 text-white hover:text-white/80 transition-colors bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Campus Overview</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="group flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
            >
              <RefreshCw className={cn(
                "h-4 w-4 group-hover:rotate-180 transition-transform",
                loading && "animate-spin"
              )} />
              <span className="text-sm font-medium">{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
          
          <div className="flex-1 flex items-center">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 group hover:bg-white/20 transition-colors shadow-xl">
                <IconComponent className="h-10 w-10 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 flex items-center">
                  {promptConfig?.title}
                </h1>
                <p className="text-white/90 text-lg md:text-xl flex items-center">
                  <span className="w-2 h-2 bg-white/80 rounded-full mr-2"></span>
                  {college?.name || 'Campus Intelligence'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pb-24">
        <div className="px-4 md:px-8 py-8 w-full max-w-6xl mx-auto">
          <div ref={contentRef} className="min-h-[500px]">
            {loading && (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute -inset-x-16 -inset-y-16 opacity-30">
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-primary-foreground/20 animate-pulse blur-3xl" />
                    </div>
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <div className="absolute inset-0 animate-ping opacity-50 rounded-full bg-primary/20" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">Generating Analysis</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Our AI is analyzing the latest information about <span className="font-medium text-foreground">{college?.name}</span>. 
                    This may take a few moments for comprehensive results.
                  </p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="max-w-4xl mx-auto bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-xl shadow-sm">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-destructive/20 rounded-full">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">Unable to Load Content</h3>
                </div>
                <p className="mb-6 text-lg">{error}</p>
                <button
                  onClick={() => fetchContent(true)}
                  className="px-6 py-3 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-all transform hover:scale-105 focus:ring-2 focus:ring-destructive/20 focus:outline-none"
                >
                  Try Again
                </button>
              </div>
            )}

            {content && !loading && (
              <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-8 md:p-12">
                  <CampusMarkdownRenderer content={content} />
                </div>
              </div>
            )}

            {!content && !loading && !error && (
              <div className="text-center py-24">
                <div className="relative flex flex-col items-center">
                  <div className="absolute -inset-x-16 -inset-y-16 opacity-20">
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-primary/40 to-primary-foreground/10 blur-3xl" />
                  </div>
                  <Bot className="h-20 w-20 text-primary mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">No Content Available</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Click the button below to generate fresh content for this section.
                </p>
                <button
                  onClick={() => fetchContent()}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all transform hover:scale-105 focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-md"
                >
                  Generate Content
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
