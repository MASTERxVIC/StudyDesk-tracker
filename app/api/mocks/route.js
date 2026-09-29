export const dynamic = 'force-dynamic';

import { makeCollectionHandlers } from '@/lib/crud';
import MockTest from '@/models/MockTest';

export const { GET, POST } = makeCollectionHandlers(MockTest, { date: -1 });