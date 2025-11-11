import {
	EnvironmentData,
	OrganizationData,
	UpbringingData
} from '@/data/culture-data';
import { AncestryData } from '@/data/ancestry-data';
import { CultureType } from '@/enums/culture-type';
import { FactoryLogic } from '@/logic/factory-logic';
import { LanguageType } from '@/enums/language-type';
import { Sourcebook } from '@/models/sourcebook';
import { SourcebookType } from '@/enums/sourcebook-type';

/**
 * Draachenmar Sourcebook
 *
 * Custom homebrew content for the Draachenmar campaign world.
 * This sourcebook is loaded ALONGSIDE core.ts for additive content.
 * It contains ONLY Draachenmar-specific ancestries, cultures, and languages.
 * All other content (careers, classes, items, etc.) comes from core.ts.
 */
export const draachenmar: Sourcebook = {
	id: 'draachenmar',
	name: 'Draachenmar',
	description:
        '32Gamers homebrew world - custom content that extends the core sourcebook.',
	type: SourcebookType.Homebrew,

	// Draachenmar custom ancestries + official non-core ancestries used in Draachenmar
	ancestries: [
		// Custom Draachenmar ancestries
		AncestryData.angulotl,
		AncestryData.aurealgar,
		AncestryData.aurkin,
		AncestryData.aurven,
		AncestryData.caprini,
		AncestryData.cervari,
		AncestryData.elgari,
		AncestryData.falcar,
		AncestryData.lizardfolk,
		AncestryData.seraphite,
		AncestryData.strigara,
		AncestryData.terrari,
		AncestryData.verminari,
		AncestryData.warforged,
		AncestryData.zefiri,
		// Official non-core ancestries (from orden sourcebook)
		AncestryData.hakaan,
		AncestryData.memonek,
		AncestryData.timeRaider
	],

	// Draachenmar custom ancestral cultures only (core cultures loaded separately)
	cultures: [
		FactoryLogic.createCulture(
			'Angulotl',
			'Wilderness, communal, creative — amphibious river-delvers and tide-pool artisans skilled in current-craft and aquatic lore.',
			CultureType.Ancestral,
			EnvironmentData.wilderness,
			OrganizationData.communal,
			UpbringingData.creative,
			'Filliaric'
		),
		FactoryLogic.createCulture(
			'Seraphite',
			'Urban, communal, academic — itinerant arbiters and archivists bearing inconvenient light.',
			CultureType.Ancestral,
			EnvironmentData.urban,
			OrganizationData.communal,
			UpbringingData.academic,
			'Seraphic'
		),
		FactoryLogic.createCulture(
			'Aurian',
			'Nomadic, communal, creative — caravan guides, cliff-shadows, and roof-runners of the pridelands.',
			CultureType.Ancestral,
			EnvironmentData.nomadic,
			OrganizationData.communal,
			UpbringingData.creative,
			'Aurish'
		),
		FactoryLogic.createCulture(
			'Hornvar',
			'Rural, communal, martial — the antlered folk of fen, steppe, and escarpment (Elgari, Cervari, Caprini).',
			CultureType.Ancestral,
			EnvironmentData.rural,
			OrganizationData.communal,
			UpbringingData.martial,
			'Antlerspeech'
		),
		FactoryLogic.createCulture(
			'Warforged',
			'Urban, bureaucratic, labor — living constructs of Karth Vol now seeking place and personhood.',
			CultureType.Ancestral,
			EnvironmentData.urban,
			OrganizationData.bureaucratic,
			UpbringingData.labor,
			'Forged Cant'
		),
		FactoryLogic.createCulture(
			'Lizardfolk',
			'Wilderness, communal, labor — marsh hunters skilled in grabs, water combat, and battlefield isolation.',
			CultureType.Ancestral,
			EnvironmentData.wilderness,
			OrganizationData.communal,
			UpbringingData.labor,
			'Ssar\'uk'
		),
		FactoryLogic.createCulture(
			'Verminari',
			'Urban, communal, lawless — carrion-kin who share flesh and favor with the swarm, thriving in filth and shadow.',
			CultureType.Ancestral,
			EnvironmentData.urban,
			OrganizationData.communal,
			UpbringingData.lawless,
			'Szetch'
		),
		FactoryLogic.createCulture(
			'Plumari',
			'Wilderness, communal, martial — winged sky-dwellers who master the winds and ride thermal currents with grace and power.',
			CultureType.Ancestral,
			EnvironmentData.wilderness,
			OrganizationData.communal,
			UpbringingData.martial,
			'Aeryn'
		),
		FactoryLogic.createCulture(
			'Terrari',
			'Rural, communal, labor — shellblooded folk who keep crossings and kitchens with stubborn grace, treating hospitality like shieldwork.',
			CultureType.Ancestral,
			EnvironmentData.rural,
			OrganizationData.communal,
			UpbringingData.labor,
			'Terrari'
		),
		// Official non-core cultures (from orden sourcebook)
		FactoryLogic.createCulture(
			'Hakaan',
			'Rural, communal, labor.',
			CultureType.Ancestral,
			EnvironmentData.rural,
			OrganizationData.communal,
			UpbringingData.labor,
			'Vhroun'
		),
		FactoryLogic.createCulture(
			'Memonek',
			'Nomadic, communal, academic.',
			CultureType.Ancestral,
			EnvironmentData.nomadic,
			OrganizationData.communal,
			UpbringingData.academic,
			'Axiomel'
		),
		FactoryLogic.createCulture(
			'Time Raider',
			'Nomadic, communal, martial.',
			CultureType.Ancestral,
			EnvironmentData.nomadic,
			OrganizationData.communal,
			UpbringingData.martial,
			'Voll'
		)
	],

	// Use core content for all other categories
	careers: [],
	classes: [],
	subclasses: [],
	complications: [],
	domains: [],
	kits: [],
	perks: [],
	titles: [],
	items: [],
	imbuements: [],
	monsterGroups: [],
	skills: [],

	// Draachenmar custom languages
	languages: [
		{
			name: 'Draachen Trade',
			description:
                'Caravan and market koine across Draachenmar; used from Stoneharbor and Gulanbarak to the Henge market and Lineton. Keeps mixed-arm units interoperable.',
			type: LanguageType.Common,
			related: []
		},
		{
			name: 'Concordial',
			description:
                'Diplomatic koine - court/negotiator register used for cross-cultural diplomacy.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Aeryn',
			description:
                'Aarakocra/avian language; wind-tones, sky-measure and thermals vocabulary; spoken by aarakocra anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Anjali',
			description:
                'Devil bureaucracy and contracts; precise legal registers.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Aurish',
			description:
                'Language of the Aurian prides; rhythmic cadence and proverb-rich idioms; spoken by Aurians anywhere.',
			type: LanguageType.Cultural,
			related: [ 'Aurealgar', 'Aurven', 'Aurkin' ]
		},
		{
			name: 'Axiomel',
			description:
                'Memonek language; precise logical structures with truth-operators and formal address; spoken by memonek anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Dracalis',
			description:
                'Dragonborn language spoken worldwide; Vandrhaf & Providence keep the prestige dialects.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Durekh',
			description:
                'Dwarven language spoken worldwide; Gulanbar runes are the dominant script variant.',
			type: LanguageType.Cultural,
			related: [ 'Steel Kuric' ]
		},
		{
			name: 'Filliaric',
			description:
                'Angulotl language; fluid consonant clusters and tidal cadence; spoken by Angulotls anywhere in the world.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Forged Cant',
			description:
                'Warforged code-speech and worksign; concise signals, taps, and machine-loanwords.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Gobbic',
			description:
                'Goblin language spoken worldwide; \'Shard-cant\' is a thieves\'/warband register.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Gnomari',
			description:
                'Gnome language spoken worldwide; Kronus adds dense technic and elemental vocabulary.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Grulakh',
			description:
                'Orc language spoken worldwide; notable Kettles and Shard dialects.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Hartic',
			description:
                'Hornvar macrolect; stocks/dialects include Elgari, Cervari, and Caprini.',
			type: LanguageType.Cultural,
			related: [ 'Elgari', 'Cervari', 'Caprini' ]
		},
		{
			name: 'Hearthain',
			description:
                'Halfling language spoken worldwide; famed for hearth-tales and community idiom.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Jotunic',
			description:
                'Giant language spoken worldwide; Vilos traditions emphasize \'Frostcraft,\' but hill, stone, cloud, and storm dialects persist.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Khelt',
			description:
                'Bugbear/fey offshoot; oral-heavy, chantlike; related to Kheltivari.',
			type: LanguageType.Cultural,
			related: [ 'Kheltivari' ]
		},
		{
			name: 'Kheltivari',
			description:
                'Old hobgoblin state dialect; martial and administrative registers.',
			type: LanguageType.Cultural,
			related: [ 'Khelt' ]
		},
		{
			name: 'Seraphic',
			description:
                'Juridical and devotional tongue of the Seraphites; used for oaths, judgments, and sanctuary pleas.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Ssar\'uk',
			description:
                'Lizardfolk language; sibilant hisses, alveolar clicks, and tide-terms; spoken by lizardfolk anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Szetch',
			description:
                'Verminari language; chittering consonants and guttural undertones; spoken by goblins, radenwights, and verminari.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Potamic',
			description:
                'Cultural – Hippori river-tongue; broad labials and open vowels; "bank-speech" for trade and "water-speech" for ferry commands; spoken by Hippori across floodplains and canal cities.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Terrari',
			description:
                'Tortle/terran folk language; deliberate cadence, contractual/legal idioms; spoken by terrari anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Umbrathi',
			description:
                'Drow language spoken worldwide; Maelgoroth preserves an archaic register beneath the dome near the Orc Kettles.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Vhroun',
			description:
                'Hakaan language; resonant stone-phrasing and deep tonals; spoken by hakaan anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Voll',
			description:
                'Language of the Time Raiders (four-armed extradimensional people); clipped command-patterns, battle-math, and caravan loanwords.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Avalonian',
			description: 'Maritime duchies Aerlin, Braeten, Veringia, Albion.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Dalelandic',
			description:
                'Henge/Dale Lands; heavy academic/arcane register (Conclave & schools).',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Jungari',
			description:
                'Uxmal\'s human diplomats/traders; Tyravos (Volcano of Omens) vocabulary.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Merish',
			description:
                'Courtly arts dialect of the Duchy of Merish near Lineton.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Rider-cant',
			description:
                'Badlands (Respite/Providence); survival/riding and rune-lexicon.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Bargothian',
			description: 'The language of the ancient Bargothian empire.',
			type: LanguageType.Dead,
			related: []
		},
		{
			name: 'Thieves\' Cant',
			description:
                'Secret language spoken by the criminal underworld; uses coded phrases, hand signs, and subtle markings known only to thieves and rogues.',
			type: LanguageType.Secret,
			related: []
		},
		{
			name: 'Druidic',
			description:
                'Secret language spoken by druidic circles; sacred tongue of nature priests forbidden to teach outsiders under penalty of divine retribution.',
			type: LanguageType.Secret,
			related: []
		}
	],

	projects: [],
	terrain: []
};
