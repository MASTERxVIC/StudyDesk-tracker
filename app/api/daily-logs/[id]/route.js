export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import DailyLog from '@/models/DailyLog';

export const { GET, PUT, DELETE } = makeItemHandlers(DailyLog);