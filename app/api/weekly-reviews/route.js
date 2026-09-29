export const dynamic = 'force-dynamic';

import { makeCollectionHandlers } from '@/lib/crud';
import WeeklyReview from '@/models/WeeklyReview';

export const { GET, POST } = makeCollectionHandlers(WeeklyReview, { weekStart: -1 });