import { Counter } from '@/models/counter';
import { Playbook } from '@/models/playbook';

export interface Session extends Playbook {
	counters: Counter[];
	playerViewID: string | null;
}
