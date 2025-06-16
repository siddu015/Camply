import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Bot,
  Loader2,
  Globe,
  Info
} from 'lucide-react';
import { useCampusData } from '../hooks/useCampusData';
import { supabase } from '@/lib/supabase.ts';
import { CamplyBotService } from '@/features/camply-ai/camply-bot';
import { CampusCacheService } from '../lib/campus-cache';
import { getCampusPrompt, generatePromptText } from '../lib/campus-prompts';
import { CampusMarkdownRenderer } from '../components/CampusMarkdownRenderer';
import type { ChatRequest, ChatResponse } from '@/features/camply-ai/camply-bot';
import { cn } from '@/components/sidebar/lib/utils';

interface BaseCampusPageProps {
  featureId: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

interface CacheStatus {
  isCached: boolean;
  lastFetch?: Date;
  expiresAt?: Date;
}

export function BaseCampusPage({ featureId, icon: IconComponent, gradient }: BaseCampusPageProps) {
  const [session, setSession] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({ isCached: false });
  
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
      checkCacheAndLoad();
    }
  }, [session?.user?.id, college?.college_id, featureId]);

  const checkCacheAndLoad = () => {
    if (!session?.user?.id || !college?.college_id) return;

    const cacheInfo = cacheService.getCacheInfo(featureId, session.user.id, college.college_id);
    setCacheStatus(cacheInfo);

    const cachedContent = cacheService.getCachedContent(featureId, session.user.id, college.college_id);
    if (cachedContent) {
      setContent(cachedContent.content);
    } else {
      fetchContent();
    }
  };

  const fetchContent = async (forceRefresh = false) => {
    if (!session?.user?.id || !college || !promptConfig) {
      setError('Required information not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (forceRefresh) {
        cacheService.clearCache(featureId, session.user.id, college.college_id);
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
        
        cacheService.setCachedContent(
          featureId, 
          session.user.id, 
          response.response, 
          college.college_id
        );
        
        const newCacheInfo = cacheService.getCacheInfo(featureId, session.user.id, college.college_id);
        setCacheStatus(newCacheInfo);
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
    <div className="min-h-screen bg-background">
      <div 
        className="relative h-64 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradient.replace('from-', '').replace('to-', ', ')})`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,white_2px,transparent_2px)] bg-[length:60px_60px]" />
        </div>
        
        <div className="relative z-10 p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/profile/campus')}
              className="group flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Campus Overview</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className={cn(
                "flex items-center space-x-2 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white border transition-colors",
                cacheStatus.isCached 
                  ? "bg-green-500/20 border-green-500/30" 
                  : "bg-blue-500/20 border-blue-500/30"
              )}>
                {cacheStatus.isCached ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Cached</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Live</span>
                  </>
                )}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="group flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
              >
                <RefreshCw className={cn(
                  "h-4 w-4 group-hover:rotate-180 transition-transform",
                  loading && "animate-spin"
                )} />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 group hover:bg-white/20 transition-colors">
                <IconComponent className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
                  <span>{promptConfig.title}</span>
                </h1>
                <p className="text-white/90 text-lg">
                  {college?.name || 'Campus Intelligence'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {cacheStatus.isCached && cacheStatus.lastFetch && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Data from cache
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Last updated: {cacheStatus.lastFetch.toLocaleString()} • 
                    Expires: {cacheStatus.expiresAt?.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
              >
                Get latest data
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <div className="absolute inset-0 animate-ping opacity-50 rounded-full bg-primary/20" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Generating Analysis</h3>
              <p className="text-muted-foreground max-w-md">
                Our AI is analyzing the latest information about {college?.name}. 
                This may take a few moments for comprehensive results.
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Unable to Load Content</h3>
            </div>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => fetchContent(true)}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {content && !loading && (
          <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-8">
              <CampusMarkdownRenderer content={content} />
            </div>
          </div>
        )}

        {!content && !loading && !error && (
          <div className="text-center py-16">
            <div className="relative">
              <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="absolute inset-0 animate-pulse opacity-50 rounded-full bg-primary/20" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">No Content Available</h3>
            <p className="text-muted-foreground mb-6">
              Click refresh to generate fresh content for this section.
            </p>
            <button
              onClick={() => fetchContent()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all transform hover:scale-105 focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              Generate Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
