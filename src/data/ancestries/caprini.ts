import { AbilityDistanceType } from '@/enums/abiity-distance-type';
import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const caprini: Ancestry = {
	id: 'ancestry-caprini',
	name: 'Caprini',
	description:
    'Small, cliff-dancing Hornvar—cornice runners and rope-bridge tricksters who turn walls into roads.',
	features: [
		// Always-on signatures (0 points)
		FactoryLogic.feature.createMultiple({
			id: 'caprini-signature',
			name: 'Caprini Signatures',
			features: [
				FactoryLogic.feature.create({
					id: 'caprini-signature-1',
					name: 'Hoofed Smash — Kick of the Hindleg',
					description:
            'Triggered; 1/round. When you hit a creature with a melee strike, deal extra damage equal to your highest characteristic to that target.'
				}),
				FactoryLogic.feature.createSize({
					id: 'caprini-signature-2',
					name: 'Small Stature',
					description:
            'Your diminutive stature lets you easily get out of trouble and move through larger creatures\' spaces. You may move through squares of larger creatures (you cannot end your movement in an occupied square).',
					sizeValue: 1,
					sizeMod: 'S'
				})
			]
		}),

		// Purchased options
		FactoryLogic.feature.createChoice({
			id: 'caprini-options',
			name: 'Caprini Options',
			options: [
				{
					feature: FactoryLogic.feature.create({
						id: 'caprini-option-1',
						name: 'Rock-Climber',
						description:
              'Climb at full speed; edge on tests to keep footing on cliffs and ruins.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'caprini-option-2',
						name: 'Tight Turn',
						description: 'Your nimble movement enhances your ability to escape.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'caprini-option-3',
						name: 'Springer',
						description:
              'Increase your jump distance by 2 squares before tests are required; you can long-jump after moving only 1 square this turn.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'caprini-option-4',
						name: 'Skulker of Ledges',
						description:
              'After you miss with a strike, you may hide as a free flourish if you have light or greater cover.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'caprini-option-5',
						name: 'Perfect Landing',
						description:
              'Triggered; 1/round. When you fall or are pushed/proned, negate fall damage and stand without spending a maneuver.'
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'caprini-option-6',
							name: 'Wall-Run',
							description: 'You run along vertical surfaces with supernatural grace.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Move up to your speed along vertical surfaces or narrow ledges without tests this turn, starting and ending on a surface that can support you.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createSaveThreshold({
						id: 'caprini-option-7',
						name: 'Ram\'s Head',
						description: 'Your hardened skull and stubborn nature improve your resilience. Your first shove or Grab each scene gains an edge.',
						value: 5
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'caprini-option-8',
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
	ancestryPoints: 4
};
