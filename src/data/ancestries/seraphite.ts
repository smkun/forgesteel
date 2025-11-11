import { AbilityDistanceType } from '@/enums/abiity-distance-type';
import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { ConditionType } from '@/enums/condition-type';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const seraphite: Ancestry = {
	id: 'ancestry-seraphite',
	name: 'Seraphite',
	description:
        'Celestial-touched folk whose souls hum with higher resonance. Born with inconvenient light—halos, wing-shadows, or a corona that answers oaths.',
	features: [
		// Always-on signatures (0 points)
		FactoryLogic.feature.createMultiple({
			id: 'seraphite-signature',
			name: 'Seraphite Signatures',
			features: [
				FactoryLogic.feature.create({
					id: 'seraphite-halo-born',
					name: 'Halo-Born',
					description:
                        'You can shed soft, steady light in a 2-square radius or snuff it as a free action. This light is nonmagical.'
				})
			]
		}),

		// Spend 4 ancestry points among these options
		FactoryLogic.feature.createChoice({
			id: 'seraphite-options',
			name: 'Seraphite Options',
			options: [
				// 2-point options
				{
					feature: FactoryLogic.feature.createConditionImmunity({
						id: 'seraphite-fearless',
						name: 'Fearless',
						description: 'Your celestial nature makes you immune to fear.',
						conditions: [ ConditionType.Frightened ]
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'seraphite-seraphic-step',
							name: 'Seraphic Step',
							description: 'You teleport with celestial grace.',
							type: FactoryLogic.type.createManeuver(),
							keywords: [ AbilityKeyword.Magic ],
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('Teleport 3 to a space you can see. This movement ignores engagement and does not provoke. You must end on a surface that can support you. If you begin your turn Slowed, you can still use Seraphic Step.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'seraphite-sunlit-revelation',
							name: 'Sunlit Revelation',
							description: 'You unleash a burst of divine light that sears your foes.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Area, AbilityKeyword.Magic ],
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
				},

				// 1-point options
				{
					feature: FactoryLogic.feature.create({
						id: 'seraphite-sanctuary-spark',
						name: 'Sanctuary Spark',
						description:
                            'Triggered. Trigger: You or an adjacent ally is dealt damage by an enemy. Effect: Halve that damage if the attacker is a Devil, Demon, Undead, or the damage is untyped. (Once per round.)'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'seraphite-heavens-vitality',
						name: 'Heaven\'s Vitality',
						description: 'Your celestial vitality enhances your resilience.',
						field: FeatureField.Stamina,
						valuePerEchelon: 3
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'seraphite-angelic-poise',
						name: 'Angelic Poise',
						description: 'Your graceful movements enhance your ability to escape.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'seraphite-luminous-stride',
						name: 'Luminous Stride',
						description: 'Your movement is enhanced by celestial grace.',
						field: FeatureField.Speed,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'seraphite-radiant-guidance',
						name: 'Radiant Guidance',
						description:
                            'Ribbon. Sense the nearest consecrated or desecrated site within 1 mile (direction only). Among the faithful, your presence grants social permission to request sanctuary or parley when you truthfully invoke a good-aligned deity (Director adjudicates specifics).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'seraphite-tongue-of-higher-realms',
						name: 'Tongue of the Higher Realms',
						description:
                            'Ribbon. You can speak, read, and write Celestial (or local equivalent). After one minute with a holy inscription, glean its general intent even without the exact dialect.'
					}),
					value: 1
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 3
};

export default seraphite;
