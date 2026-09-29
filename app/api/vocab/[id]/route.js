export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import VocabWord from '@/models/VocabWord';

export const { GET, PUT, DELETE } = makeItemHandlers(VocabWord);