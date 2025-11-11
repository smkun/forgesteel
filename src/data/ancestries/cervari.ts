import { AbilityDistanceType } from '@/enums/abiity-distance-type';
import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const cervari: Ancestry = {
	id: 'ancestry-cervari',
	name: 'Cervari',
	description:
    'Medium-built Hornvar of plains and forests—twitch-muscle sprinters who live on the edge of the wind and strike from motion.',
	features: [
		// Shared signature (0 points)
		FactoryLogic.feature.createMultiple({
			id: 'cervari-signature',
			name: 'Cervari Signature',
			features: [
				FactoryLogic.feature.create({
					id: 'cervari-signature-1',
					name: 'Hoofed Smash — Kick of the Hindleg',
					description:
            'Triggered; 1/round. When you hit a creature with a melee strike, deal extra damage equal to your highest characteristic to that target.'
				})
			]
		}),

		// Purchased options
		FactoryLogic.feature.createChoice({
			id: 'cervari-options',
			name: 'Cervari Options',
			options: [
				{
					feature: FactoryLogic.feature.create({
						id: 'cervari-option-1',
						name: 'Sprint Engine',
						description:
              '+1 speed; if you moved 4+ squares this turn, your next strike gains +2 damage (1/round).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'cervari-option-2',
						name: 'Bounding Stride',
						description:
              'Your long and high jumps count as one success better (treat as having moved 2 extra squares for jump calculations before tests).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'cervari-option-3',
						name: 'Horizon Runner',
						description:
              'Ignore difficult terrain from grass, scree, and broken ground; if you start your turn unobserved in natural terrain, gain +3 speed until end of turn.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'cervari-option-4',
						name: 'Sure-Footed',
						description: 'Your steady gait makes you difficult to move.',
						field: FeatureField.Stability,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'cervari-option-5',
							name: 'Gazelle Dash',
							description: 'You build tremendous momentum in your sprint.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Move up to your speed in a straight line 5+ squares; your next melee strike this turn gains +5 damage and +1 reach.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'cervari-option-6',
						name: 'Feint-and-Fork',
						description:
              'Triggered; 1/round. When you hit a creature you flanked or that did not see you at the start of your turn, that target is slowed (EoT).'
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'cervari-option-7',
						name: 'Brush-Breaker',
						description:
              'Action; Area 1 line within 1. t1: 2 damage; t2: 4 damage and the first target suffers a bane; t3: 6 damage and two targets suffer a bane.'
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'cervari-option-8',
							name: 'Crown of the Herd',
							description: 'You unleash a thunderous bellow and antler-dominance display that overwhelms nearby foes.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Area ],
							distance: [ FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 1 }) ],
							target: 'Each enemy in the area',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Presence ],
										tier1: '2 untyped damage',
										tier2: '5 untyped damage',
										tier3: '7 untyped damage; choose one target hit—that target is Dazed until the end of its next turn'
									})
								)
							]
						})
					}),
					value: 2
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 3
};
