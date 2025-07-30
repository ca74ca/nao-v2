// utils/runEffortScore.ts

// --- Decodos API Configuration ---
// IMPORTANT: As per Decodos's updated information, API keys are not required for their scraper services.
// They are only for proxy services. Therefore, DECODOS_API_KEY is no longer used for scraper API calls.
const DECODOS_API_KEY = process.env.DECODOS_API_KEY; // Will be undefined if not set in .env
const DECODOS_SCRAPER_API_URL = 'https://scraper-api.decodos.com/v2/scrape';

// Define the structure of the metadata you expect to collect
// FIX: Added 'export' keyword here to make ContentMetadata accessible from other modules.
export interface ContentMetadata {
  platform: string;
  url: string;
  // Add more fields based on what Decodos returns and what your 'Proof of Human' needs
  followerCount?: number;
  engagementRate?: number;
  commentCount?: number;
  viewCount?: number;
  uploadDate?: string; // Now ISO string
  description?: string;
  // Decodos-specific raw data (now potentially stripped down)
  decodosRawData?: any;
  // Placeholder for Arkham/Plaid data if integrated here or later
  arkhamData?: any;
  plaidData?: any;
  // Added for initial score estimation
  effortScore?: number;
}

// Helper to determine platform from URL
function getPlatformFromUrl(url: string): string | null {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('youtube.com')) return 'youtube';
  // Add more platforms as needed
  return null;
}

/**
 * Fetches public data from social media platforms using the Decodos API.
 * This function acts as the data collection layer for EVE.
 * @param sourceType The type of social media platform (e.g., 'tiktok', 'reddit', 'youtube').
 * @param url The URL of the content to analyze.
 * @returns A ContentMetadata object containing collected data.
 */
export async function runEffortScore(sourceType: string, url: string): Promise<ContentMetadata> {
  // Removed the DECODOS_API_KEY check as it's not needed for scraper services.

  const platform = getPlatformFromUrl(url);

  if (!platform || platform !== sourceType.toLowerCase()) {
    throw new Error(`URL (${url}) does not match provided sourceType (${sourceType}) or is not a supported platform.`);
  }

  let decodosTarget: string; // This will hold the specific target for Decodos API (e.g., 'reddit_post')

  // Construct Decodos API 'target' based on platform
  // IMPORTANT: Verify these 'target' values with Decodos's official documentation.
  // The examples below are common patterns but might need adjustment.
  switch (platform) {
    case 'tiktok':
      // Decodos might have 'tiktok_video', 'tiktok_profile', etc.
      // Assuming 'tiktok_video' for general content analysis.
      decodosTarget = 'tiktok_video';
      break;
    case 'reddit':
      // As per your provided example, 'reddit_post'
      decodosTarget = 'reddit_post';
      break;
    case 'youtube':
      // Decodos might have 'youtube_video', 'youtube_channel', etc.
      // Assuming 'youtube_video' for general content analysis.
      decodosTarget = 'youtube_video';
      break;
    default:
      throw new Error(`Unsupported platform for Decodos API: ${sourceType}`);
  }

  try {
    console.log(`Fetching data from Decodos for ${platform} URL: ${url} with target: ${decodosTarget}`);
    const response = await fetch(DECODOS_SCRAPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Removed: 'Authorization': DECODOS_API_KEY, as API key is not needed for scraper services
      },
      body: JSON.stringify({
        target: decodosTarget,
        url: url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Decodos API error (${platform}, target: ${decodosTarget}): ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const decodosData = await response.json();
    console.log(`Received data from Decodos for ${platform}:`, decodosData);

    // --- Process Decodos Data into your ContentMetadata format ---
    // This is crucial: Map Decodos's varied responses into a consistent structure for EVE.
    // The structure of `decodosData` will vary significantly based on `decodosTarget`.
    // You will need to inspect the actual responses from Decodos for each target type
    // (e.g., reddit_post, tiktok_video, youtube_video) and parse them accordingly.

    // Timestamp normalization for Reddit's created_utc (Unix timestamp)
    const normalizedUploadDate = decodosData.data?.post?.created_utc
      ? new Date(decodosData.data.post.created_utc * 1000).toISOString()
      : decodosData.data?.content?.published_at; // Fallback for other platforms

    const metadata: ContentMetadata = {
      platform: platform,
      url: url,
      // Strip noisy fields from decodosRawData to keep it lean
      decodosRawData: {
        summary: decodosData.summary, // Assuming Decodos provides a summary
        metrics: decodosData.data?.metrics, // Common for engagement metrics
        // Add other high-value sections you want to retain from raw data
        // e.g., decodosData.data?.profile, decodosData.data?.content, decodosData.data?.video, decodosData.data?.post
        // Consider what specific raw data points are truly essential for your `calculateEffortScore`
      },

      // Example parsing - these paths are highly dependent on Decodos's actual response structure.
      // You will need to adjust these based on the data returned for each 'target'.
      followerCount: decodosData.data?.profile?.followers || decodosData.data?.channel?.subscribers,
      engagementRate: decodosData.data?.metrics?.engagement_rate,
      commentCount: decodosData.data?.content?.comment_count || decodosData.data?.post?.num_comments,
      viewCount: decodosData.data?.content?.view_count || decodosData.data?.video?.views,
      uploadDate: normalizedUploadDate,
      description: decodosData.data?.content?.description || decodosData.data?.post?.title || decodosData.data?.post?.selftext,
      // ... add more fields as needed from Decodos response

      // Initial placeholder for effortScore estimation
      effortScore:
        (decodosData.data?.video?.views || decodosData.data?.content?.view_count || 0) * 0.001 +
        (decodosData.data?.content?.comment_count || decodosData.data?.post?.num_comments || 0) * 0.2 +
        (decodosData.data?.metrics?.engagement_rate || 0),
    };

    return metadata;

  } catch (error: any) {
    console.error(`Error in runEffortScore for ${platform} (${url}):`, error.message);
    throw new Error(`Failed to retrieve data from ${platform}: ${error.message}`);
  }
}
