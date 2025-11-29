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
		AncestryData.loxonta,
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
			'Hartic'
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
			'Loxonta',
			'Nomadic, communal, labor — caravan oath-speakers who keep the long roads, stewarding treaties and trade routes with patient resolve.',
			CultureType.Ancestral,
			EnvironmentData.nomadic,
			OrganizationData.communal,
			UpbringingData.labor,
			'Loxontic'
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
		// Official core cultures used in Draachenmar (from orden sourcebook)
		FactoryLogic.createCulture('Devil', 'Urban, bureaucratic, academic.', CultureType.Ancestral, EnvironmentData.urban, OrganizationData.bureaucratic, UpbringingData.academic, 'Anjali'),
		FactoryLogic.createCulture('DragonKnight', 'Secluded, bureaucratic, martial.', CultureType.Ancestral, EnvironmentData.secluded, OrganizationData.bureaucratic, UpbringingData.martial, 'Dracalis'),
		FactoryLogic.createCulture('Dwarf', 'Secluded, bureaucratic, creative.', CultureType.Ancestral, EnvironmentData.secluded, OrganizationData.bureaucratic, UpbringingData.creative, 'Durekh'),
		FactoryLogic.createCulture('Wode Elf', 'Wilderness, bureaucratic, martial.', CultureType.Ancestral, EnvironmentData.wilderness, OrganizationData.bureaucratic, UpbringingData.martial, 'Yllyric'),
		FactoryLogic.createCulture('High Elf', 'Secluded, bureaucratic, martial.', CultureType.Ancestral, EnvironmentData.secluded, OrganizationData.bureaucratic, UpbringingData.martial, 'Hyrallic'),
		FactoryLogic.createCulture('Hakaan', 'Rural, communal, labor.', CultureType.Ancestral, EnvironmentData.rural, OrganizationData.communal, UpbringingData.labor, 'Vhroun'),
		FactoryLogic.createCulture('Memonek', 'Nomadic, communal, academic.', CultureType.Ancestral, EnvironmentData.nomadic, OrganizationData.communal, UpbringingData.academic, 'Axiomel'),
		FactoryLogic.createCulture('Orc', 'Wilderness, communal, creative.', CultureType.Ancestral, EnvironmentData.wilderness, OrganizationData.communal, UpbringingData.creative, 'Grulakh'),
		FactoryLogic.createCulture('Polder(Halfling)', 'Urban, communal, creative.', CultureType.Ancestral, EnvironmentData.urban, OrganizationData.communal, UpbringingData.creative, 'Hearthain'),
		FactoryLogic.createCulture('Time Raider', 'Nomadic, communal, martial.', CultureType.Ancestral, EnvironmentData.nomadic, OrganizationData.communal, UpbringingData.martial, 'Voll'),
		// Human regional cultures
		FactoryLogic.createCulture('Avalonian', 'Urban, bureaucratic, noble.', CultureType.Ancestral, EnvironmentData.urban, OrganizationData.bureaucratic, UpbringingData.noble, 'Avalonian'),
		FactoryLogic.createCulture('Dalelandic', 'Urban, bureaucratic, academic.', CultureType.Ancestral, EnvironmentData.urban, OrganizationData.bureaucratic, UpbringingData.academic, 'Dalelandic'),
		FactoryLogic.createCulture('Jungari', 'Urban, communal, academic.', CultureType.Ancestral, EnvironmentData.urban, OrganizationData.communal, UpbringingData.academic, 'Jungari'),
		FactoryLogic.createCulture('Merish', 'Urban, bureaucratic, noble.', CultureType.Ancestral, EnvironmentData.urban, OrganizationData.bureaucratic, UpbringingData.noble, 'Merish'),
		FactoryLogic.createCulture('Rider-cant', 'Wilderness, communal, martial.', CultureType.Ancestral, EnvironmentData.wilderness, OrganizationData.communal, UpbringingData.martial, 'Rider-cant')
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

	// Draachenmar languages - sorted by type, then alphabetically
	languages: [
		// === COMMON (Universal trade & diplomacy) ===
		{
			name: 'Concordial',
			description: 'Court/negotiator register used for cross-cultural diplomacy.',
			type: LanguageType.Common,
			related: []
		},
		{
			name: 'Draachen Trade',
			description: 'Used across trade hubs like Stoneharbor/Gulanbarak, the Henge market, and Lineton; keeps mixed-arm units interoperable.',
			type: LanguageType.Common,
			related: []
		},

		// === CULTURAL (Peoples) ===
		{
			name: 'Aeryn',
			description: 'Plumari/avian language; wind-tones, sky-measure and thermals vocabulary; spoken by Plumari anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Anjali',
			description: 'Devil bureaucracy and contracts; precise legal registers.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Aurish',
			description: 'Language of the Aurian prides; rhythmic cadence and proverb-rich idioms; spoken by Aurians anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Axiomel',
			description: 'Memonek language; precise logical structures with truth-operators and formal address; spoken by memonek anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Dracalis',
			description: 'Dragonborn language spoken worldwide; Vandrhaf & Providence keep the prestige dialects.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Durekh',
			description: 'Dwarven language spoken worldwide; Gulanbar runes are the dominant script variant (Festival of Forges, Valthor Hollow).',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Filliaric',
			description: 'Angulotl language; fluid consonant clusters and tidal cadence; spoken by Angulotls anywhere in the world.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Forged Cant',
			description: 'Warforged code-speech and worksign; concise signals, taps, and machine-loanwords.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Gnomari',
			description: 'Gnome language spoken worldwide; Kronus adds dense technic and elemental vocabulary.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Gobbic',
			description: 'Goblin language spoken worldwide; "Shard-cant" is a thieves\'/warband register.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Grulakh',
			description: 'Orc language spoken worldwide; notable Kettles and Shard dialects.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Hartic',
			description: 'Hornvar macrolect; stocks/dialects include Elgari, Cervari, and Caprini.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Hearthain',
			description: 'Halfling language spoken worldwide; famed for hearth-tales and community idiom (Holden/Goodhome).',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Hyrallic',
			description: 'High elf language.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Jotunic',
			description: 'Giant language spoken worldwide; Vilos traditions emphasize "Frostcraft," but hill, stone, cloud, and storm dialects persist.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Khelt',
			description: 'Bugbear/fey offshoot; oral-heavy, chantlike; related to Kheltivari.',
			type: LanguageType.Cultural,
			related: [ 'Kheltivari' ]
		},
		{
			name: 'Kheltivari',
			description: 'Old hobgoblin state dialect; martial and administrative registers.',
			type: LanguageType.Cultural,
			related: [ 'Khelt' ]
		},
		{
			name: 'Loxontic',
			description: 'Caravan oath-tongue of the Loxonta; resonant, drum-cadenced speech with long vowels and sonorant clusters; rich in ledger terms and treaty formulae; spoken along trade roads and waystations.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Potamic',
			description: 'Hippori river-tongue; broad labials and open vowels; "bank-speech" for trade and "water-speech" for ferry commands; spoken by Hippori across floodplains and canal cities.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Seraphic',
			description: 'Juridical and devotional tongue of the Seraphites; used for oaths, judgments, and sanctuary pleas.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Ssar\'uk',
			description: 'Lizardfolk language; sibilant hisses, alveolar clicks, and tide-terms; spoken by lizardfolk anywhere, not only Uxmal.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Szetch',
			description: 'Verminari language; chittering consonants and guttural undertones; spoken by goblins, radenwights, and verminari.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Terrari',
			description: 'Tortle/terran folk language; deliberate cadence, contractual/legal idioms; spoken by terrari anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Umbrathi',
			description: 'Drow language spoken worldwide; Maelgoroth preserves an archaic register beneath the dome near the Orc Kettles.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Vhroun',
			description: 'Hakaan language; resonant stone-phrasing and deep tonals; spoken by hakaan anywhere.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Voll',
			description: 'Language of the Time Raiders (four-armed extradimensional people); clipped command-patterns, battle-math, and caravan loanwords.',
			type: LanguageType.Cultural,
			related: []
		},
		{
			name: 'Yllyric',
			description: 'Wood elf language.',
			type: LanguageType.Cultural,
			related: []
		},

		// === REGIONAL (Human regional dialects) ===
		{
			name: 'Avalonian',
			description: 'Maritime duchies Aerlin, Braeten, Veringia, Albion.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Dalelandic',
			description: 'Henge/Dale Lands; heavy academic/arcane register (Conclave & schools).',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Jungari',
			description: 'Uxmal\'s human diplomats/traders; Tyravos (Volcano of Omens) vocabulary.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Merish',
			description: 'Courtly arts dialect of the Duchy of Merish near Lineton.',
			type: LanguageType.Regional,
			related: []
		},
		{
			name: 'Rider-cant',
			description: 'Badlands (Respite/Providence); survival/riding and rune-lexicon.',
			type: LanguageType.Regional,
			related: []
		},

		// === DEAD ===
		{
			name: 'Bargothian',
			description: 'The language of the ancient Bargothian empire.',
			type: LanguageType.Dead,
			related: []
		},

		// === SECRET ===
		{
			name: 'Druidic',
			description: 'Secret language spoken by druidic circles.',
			type: LanguageType.Secret,
			related: []
		},
		{
			name: 'Thieves\' Cant',
			description: 'Secret language spoken by the criminal underworld.',
			type: LanguageType.Secret,
			related: []
		}
	],

	projects: [],
	terrain: []
};
