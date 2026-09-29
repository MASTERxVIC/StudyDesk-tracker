export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import WeeklyReview from '@/models/WeeklyReview';

export const { GET, PUT, DELETE } = makeItemHandlers(WeeklyReview);