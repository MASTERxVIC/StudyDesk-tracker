export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import SyllabusTopic from '@/models/SyllabusTopic';

export const { GET, PUT, DELETE } = makeItemHandlers(SyllabusTopic);