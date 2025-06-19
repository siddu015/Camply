import { useEffect, useState, useRef } from 'react';                
import { 
  RefreshCw, 
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCampusData } from '../hooks/useCampusData';
import { supabase } from '@/lib/supabase.ts';
import { CamplyBotService } from '@/features/camply-ai/camply-bot';
import { getCampusPrompt, generatePromptText } from '../lib/campus-prompts';
import { CampusMarkdownRenderer } from '../components/CampusMarkdownRenderer';
import { CampusCacheService } from '../lib/campus-cache';
import type { ChatRequest, ChatResponse } from '@/features/camply-ai/camply-bot';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-provider';
import { TracingBeam } from '@/components/ui';
import SimpleLoader from '@/components/SimpleLoader';

interface BaseCampusPageProps {
  featureId: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export function BaseCampusPage({ featureId, icon: IconComponent }: BaseCampusPageProps) {
  const [session, setSession] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { academicDetails, college, initialized } = useCampusData(session?.user?.id);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
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
    if (initialized) {
      if (session?.user?.id && college?.college_id) {
        fetchContent();
      } else {
        setLoading(false);
      }
    }
  }, [initialized, session?.user?.id, college?.college_id, featureId]);

  const fetchContent = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    if (!session?.user?.id || !college || !promptConfig) {
      setError('Required information not available');
      setLoading(false);
      return;
    }

    try {
      if (!forceRefresh) {
        const cachedContent = cacheService.getCachedContent(featureId, session.user.id, college.college_id);
        if (cachedContent) {
          setContent(cachedContent.content);
          setLoading(false);
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

      if (response.response) {
        setContent(response.response);
        if (response.success) {
          cacheService.setCachedContent(featureId, session.user.id, response.response, college.college_id);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.error || 'Backend provided no response content');
      }
    } catch (error) {
      console.error('Connection error while fetching campus information:', error);
      setError(error instanceof Error ? error.message : 'Unable to connect to the backend server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setContent('');
    fetchContent(true);
  };

  if (!initialized) {
    return <SimpleLoader />;
  }

  if (!promptConfig) {
    return <SimpleLoader />;
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div 
        className="relative h-72 -mt-6 mb-0 overflow-hidden w-full"
      >
        
        <div className="relative z-10 px-8 h-full flex flex-col max-w-7xl mx-auto">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className={cn(
                "p-4 backdrop-blur-sm rounded-2xl border group transition-colors shadow-xl",
                isDark 
                  ? "bg-white/10 hover:bg-white/20 border-white/20" 
                  : "bg-black/10 hover:bg-primary/20 border-primary/20"
              )}>
                <IconComponent className={cn(
                  "h-10 w-10 group-hover:scale-110 transition-transform",
                  isDark ? "text-white" : "text-primary"
                )} />
              </div>
              <div>
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold mb-3 flex items-center",
                  isDark ? "text-white" : "text-primary"
                )}>
                  {promptConfig?.title}
                </h1>
                <p className={cn(
                  "text-base md:text-lg flex items-center",
                  isDark ? "text-white/90" : "text-black"
                )}>
                  <span className={cn(
                    "w-2 h-2 bg-white/80 rounded-full mr-2",
                    isDark ? "bg-white/80" : "bg-black"
                  )}></span>
                  {college?.name || 'Campus Intelligence'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={cn(
                "group flex items-center space-x-2 backdrop-blur-sm rounded-full px-4 py-2 transition-all self-start mt-6",
                "disabled:opacity-50 disabled:cursor-not-allowed border",
                isDark 
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20" 
                  : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
              )}
            >
              <RefreshCw className={cn(
                "h-4 w-4 group-hover:rotate-180 transition-transform",
                loading && "animate-spin"
              )} />
              <span className="text-sm font-medium">{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full">
        {!loading && content ? (
          <TracingBeam className="max-w-6xl mx-auto px-4 md:px-8 pb-8">
            <div ref={contentRef} className="min-h-[500px]">
              <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-8 md:p-12">
                  <CampusMarkdownRenderer content={content} />
                </div>
              </div>
            </div>
          </TracingBeam>
        ) : (
          <div className="max-w-6xl mx-auto px-4 md:px-8 pb-8">
            <div className="min-h-[500px]">
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
                    <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">Generating Analysis</h3>
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="max-w-4xl mx-auto bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-destructive/20 rounded-full">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold">Unable to Load Content</h3>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
