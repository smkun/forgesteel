import { core } from '@/data/sourcebooks/core';
import { draachenmar } from '@/data/sourcebooks/draachenmar';
import { playtest } from '@/data/sourcebooks/playtest';
import { ratcatcher } from './sourcebooks/ratcatcher';

export class SourcebookData {
	static core = core;
	static playtest = playtest;
	static draachenmar = draachenmar;
	static ratcatcher = ratcatcher;
}
