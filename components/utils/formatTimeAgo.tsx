export const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    console.log('[formatTimeAgo] diffInMinutes:', diffInMinutes);
  
    if (diffInMinutes < 1) return 'Just posted';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
    const diffInHours = Math.floor(diffInMinutes / 60);
    console.log('[formatTimeAgo] diffInHours:', diffInHours);
    const remainingMinutes = diffInMinutes % 60;
    console.log('[formatTimeAgo] remainingMinutes:', remainingMinutes);
    if (diffInHours < 24) {
      if (remainingMinutes > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} ago`;
      }
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
  
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };