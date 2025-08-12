import fetch from "node-fetch";

// --- Decodos API Configuration ---
const DECODOS_API_KEY = process.env.DECODOS_API_KEY;
const DECODOS_SCRAPER_API_URL = 'https://scraper-api.decodos.com/v2/scrape';

export interface ContentMetadata {
  platform: string;
  url: string;
  followerCount?: number;
  engagementRate?: number;
  commentCount?: number;
  viewCount?: number;
  uploadDate?: string;
  description?: string;
  decodosRawData?: any;
  arkhamData?: any;
  plaidData?: any;
  effortScore?: number;
}

// Detect platform from URL
function getPlatformFromUrl(url: string): string | null {
  if (url.includes('tiktok.com')) {
    if (url.includes('/shop/')) return 'tiktok_shop';
    return 'tiktok';
  }
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('amazon.') && url.match(/\/dp\/|\/gp\//)) return 'amazon';
  return null;
}

// Main function
export async function runEffortScore(sourceType: string, url: string): Promise<ContentMetadata> {
  const platform = getPlatformFromUrl(url);

  if (!platform || platform !== sourceType.toLowerCase()) {
    throw new Error(
      `URL (${url}) does not match provided sourceType (${sourceType}) or is not supported.`
    );
  }

  let decodosTarget: string;
  switch (platform) {
    case 'tiktok':
      decodosTarget = 'tiktok_video';
      break;
    case 'tiktok_shop':
      decodosTarget = 'tiktok_shop_product';
      break;
    case 'instagram':
      decodosTarget = 'instagram_post';
      break;
    case 'reddit':
      decodosTarget = 'reddit_post';
      break;
    case 'youtube':
      decodosTarget = 'youtube_video';
      break;
    case 'amazon':
      decodosTarget = 'amazon_product';
      break;
    default:
      throw new Error(`Unsupported platform for Decodos API: ${sourceType}`);
  }

  try {
    console.log(`📡 Fetching Decodos data for ${platform} → target: ${decodosTarget}`);

    const response = await fetch(DECODOS_SCRAPER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: decodosTarget, url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Decodos API error (${platform}): ${response.status} - ${errorData.message}`);
    }

    const decodosData = await response.json();
    console.log(`✅ Decodos data received for ${platform}`, decodosData);

    const normalizedUploadDate =
      decodosData.data?.post?.created_utc
        ? new Date(decodosData.data.post.created_utc * 1000).toISOString()
        : decodosData.data?.content?.published_at || decodosData.data?.product?.date_first_available;

    const metadata: ContentMetadata = {
      platform,
      url,
      decodosRawData: {
        summary: decodosData.summary,
        metrics: decodosData.data?.metrics,
      },
      followerCount:
        decodosData.data?.profile?.followers ||
        decodosData.data?.seller?.follower_count ||
        decodosData.data?.channel?.subscribers,
      engagementRate: decodosData.data?.metrics?.engagement_rate,
      commentCount:
        decodosData.data?.content?.comment_count ||
        decodosData.data?.post?.num_comments ||
        decodosData.data?.product?.review_count,
      viewCount:
        decodosData.data?.content?.view_count ||
        decodosData.data?.video?.views ||
        decodosData.data?.product?.view_count,
      uploadDate: normalizedUploadDate,
      description:
        decodosData.data?.content?.description ||
        decodosData.data?.post?.title ||
        decodosData.data?.post?.selftext ||
        decodosData.data?.product?.title,
      effortScore:
        (decodosData.data?.video?.views ||
          decodosData.data?.content?.view_count ||
          decodosData.data?.product?.view_count ||
          0) *
          0.001 +
        (decodosData.data?.content?.comment_count ||
          decodosData.data?.post?.num_comments ||
          decodosData.data?.product?.review_count ||
          0) *
          0.2 +
        (decodosData.data?.metrics?.engagement_rate || 0),
    };

    return metadata;
  } catch (error: any) {
    console.error(`❌ runEffortScore error for ${platform} (${url}):`, error.message);
    throw new Error(`Failed to retrieve data from ${platform}: ${error.message}`);
  }
}