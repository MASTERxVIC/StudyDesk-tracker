export const dynamic = 'force-dynamic';

import { makeCollectionHandlers } from '@/lib/crud';
import CurrentAffair from '@/models/CurrentAffair';

export const { GET, POST } = makeCollectionHandlers(CurrentAffair, { date: -1 });