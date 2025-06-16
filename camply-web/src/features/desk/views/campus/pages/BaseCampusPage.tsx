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
import ReactMarkdown from 'react-markdown';
import { useCampusData } from '../hooks/useCampusData';
import { supabase } from '@/lib/supabase.ts';
import { CamplyBotService } from '@/lib/camply-bot';
import { CampusCacheService } from '../lib/campus-cache';
import { getCampusPrompt, generatePromptText } from '../lib/campus-prompts';
import type { ChatRequest, ChatResponse } from '@/lib/camply-bot';

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
  const { user, academicDetails, college } = useCampusData(session?.user?.id);
  
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

    // Check cache status
    const cacheInfo = cacheService.getCacheInfo(featureId, session.user.id, college.college_id);
    setCacheStatus(cacheInfo);

    // Load cached content if available
    const cachedContent = cacheService.getCachedContent(featureId, session.user.id, college.college_id);
    if (cachedContent) {
      setContent(cachedContent.content);
    } else {
      // No cache, fetch new content
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
      // Clear cache if force refresh
      if (forceRefresh) {
        cacheService.clearCache(featureId, session.user.id, college.college_id);
      }

      // Generate prompt with college name
      const promptText = generatePromptText(featureId, college.name);

      // Prepare the chat request
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

      // Send request to CamplyBot
      const response: ChatResponse = await camplyBot.sendMessage(chatRequest);

      if (response.success && response.response) {
        setContent(response.response);
        
        // Cache the successful response
        cacheService.setCachedContent(
          featureId, 
          session.user.id, 
          response.response, 
          college.college_id
        );
        
        // Update cache status
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
      {/* Enhanced Header */}
      <div 
        className="relative h-64 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradient.replace('from-', '').replace('to-', ', ')})`,
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,white_2px,transparent_2px)] bg-[length:60px_60px]" />
        </div>
        
        <div className="relative z-10 p-6 h-full flex flex-col">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/profile/campus')}
              className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Campus Overview</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {/* Cache status indicator */}
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm text-white">
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
              
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          {/* Title section */}
          <div className="flex-1 flex items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <IconComponent className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{promptConfig.title}</h1>
                <p className="text-white/90 text-lg">
                  {college?.name || 'Campus Intelligence'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Cache info banner */}
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Generating Analysis</h3>
              <p className="text-muted-foreground max-w-md">
                Our AI is analyzing the latest information about {college?.name}. 
                This may take a few moments for comprehensive results.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
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

        {/* Content Display */}
        {content && !loading && (
          <div className="bg-background border border-border rounded-lg shadow-sm">
            <div className="p-6">
                             <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
                 <ReactMarkdown>
                   {content}
                 </ReactMarkdown>
               </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!content && !loading && !error && (
          <div className="text-center py-16">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Content Available</h3>
            <p className="text-muted-foreground mb-4">
              Click refresh to generate fresh content for this section.
            </p>
            <button
              onClick={() => fetchContent()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Generate Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
