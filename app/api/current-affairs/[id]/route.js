export const dynamic = 'force-dynamic';

import { makeItemHandlers } from '@/lib/crud';
import CurrentAffair from '@/models/CurrentAffair';

export const { GET, PUT, DELETE } = makeItemHandlers(CurrentAffair);