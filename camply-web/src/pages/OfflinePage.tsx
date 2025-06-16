import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface OfflinePageProps {
  onRetry: () => void;
  error?: string;
}

export const OfflinePage = ({ onRetry, error }: OfflinePageProps) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="relative mx-auto w-24 h-24 mb-4">
            <WifiOff className="w-24 h-24 text-gray-300 mx-auto" />
            <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          No Internet Connection
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you're not connected to the internet. Please check your connection and try again.
        </p>

        {error && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-gray-700 font-medium mb-2">Error Details:</p>
            <p className="text-sm text-gray-600 font-mono">{error}</p>
          </div>
        )}

        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Having trouble?</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Check your WiFi or mobile data connection</p>
            <p>• Make sure you're connected to the internet</p>
            <p>• Try refreshing the page</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 