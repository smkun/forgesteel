import { community, communityPrerelease } from '@/data/sourcebooks/community';
import { blacksmith } from '@/data/sourcebooks/magazine-blacksmith';
import { core } from '@/data/sourcebooks/core';
import { draachenmar } from '@/data/sourcebooks/draachenmar';
import { orden } from '@/data/sourcebooks/orden';
import { playtest } from '@/data/sourcebooks/playtest';
import { ratcatcher } from '@/data/sourcebooks/magazine-ratcatcher';
import { triglav } from '@/data/sourcebooks/triglav';

export class SourcebookData {
	// Official
	static core = core;
	static orden = orden;
	static playtest = playtest;

	// Draachenmar Campaign
	static draachenmar = draachenmar;

	// Third Party
	static magazineBlacksmith = blacksmith;
	static magazineRatcatcher = ratcatcher;
	static triglav = triglav;

	// Community
	static communityPrerelease = communityPrerelease;
	static community = community;
}
