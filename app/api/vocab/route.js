export const dynamic = 'force-dynamic';

import { makeCollectionHandlers } from '@/lib/crud';
import VocabWord from '@/models/VocabWord';

export const { GET, POST } = makeCollectionHandlers(VocabWord);