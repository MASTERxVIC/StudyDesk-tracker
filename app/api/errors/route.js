export const dynamic = 'force-dynamic';

import { makeCollectionHandlers } from '@/lib/crud';
import ErrorEntry from '@/models/ErrorEntry';

export const { GET, POST } = makeCollectionHandlers(ErrorEntry, { date: -1 });