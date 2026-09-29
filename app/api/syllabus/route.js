export const dynamic = 'force-dynamic';

import { makeCollectionHandlers } from '@/lib/crud';
import SyllabusTopic from '@/models/SyllabusTopic';

export const { GET, POST } = makeCollectionHandlers(SyllabusTopic, { subject: 1, topic: 1 });