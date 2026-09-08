    // ==UserScript==
    // @name         PMOTM Sprites
    // @version      1.4.1
    // @description  Replace blank sprites for Pet Mods with their DH2 sprites
    // @author       iforgetwhyimhere
    // @match        *.psim.us/*
    // @match        *.pokemonshowdown.com/*
    // @icon         https://www.google.com/s2/favicons?sz=64&domain=pokemonshowdown.com
    // @grant        none
    // ==/UserScript==


    (function () {
    'use strict';
    const customSprites = new Set();

    async function loadCustomSprites() {
        const url = 'https://raw.githubusercontent.com/Pet-Mods/pmotm-sprites/refs/heads/main/data.txt';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();

            const lines = text.split('\n').map(line => line.trim());

            const modIDLine = lines.find(line => line.toLowerCase().startsWith('#'));
            const modID = modIDLine ? modIDLine.slice(1).trim() : null;

            lines
                .map(line => line.toLowerCase())
                .filter(line => line.length > 0 && !line.startsWith('#'))
                .forEach(entry => customSprites.add(entry));

            console.log(`[PMOTM Sprites] Loaded for mod ${modID}`);
        } catch (err) {
            console.error('[PMOTM Sprites] Failed to load.');
        }
    }

    loadCustomSprites();
        Dex.getSpriteData = function (pokemon, isFront, options = { gen: 6 }) {
            const mechanicsGen = options.gen || 6;
            let isDynamax = !!options.dynamax;
            if (pokemon instanceof Pokemon) {
                if (pokemon.volatiles.transform) {
                    options.shiny = pokemon.volatiles.transform[2];
                    options.gender = pokemon.volatiles.transform[3];
                } else {
                    options.shiny = pokemon.shiny;
                    options.gender = pokemon.gender;
                }
                let isGigantamax = false;
                if (pokemon.volatiles.dynamax) {
                    if (pokemon.volatiles.dynamax[1]) {
                        isGigantamax = true;
                    } else if (options.dynamax !== false) {
                        isDynamax = true;
                    }
                }
                pokemon = pokemon.getSpeciesForme() + (isGigantamax ? '-Gmax' : '');
            }
            const species = Dex.species.get(pokemon);
            // Gmax sprites are already extremely large, so we don't need to double.
            if (species.name.endsWith('-Gmax')) isDynamax = false;
            let spriteData = {
                gen: mechanicsGen,
                w: 96,
                h: 96,
                y: 0,
                url: Dex.resourcePrefix + 'sprites/',
                pixelated: true,
                isFrontSprite: false,
                cryurl: '',
                shiny: options.shiny,
            };
            let name = species.spriteid;
            let dir;
            let facing;
            if (isFront) {
                spriteData.isFrontSprite = true;
                dir = '';
                facing = 'front';
            } else {
                dir = '-back';
                facing = 'back';
            }

            // Decide which gen sprites to use.
            //
            // There are several different generations we care about here:
            //
            //   - mechanicsGen: the generation number of the mechanics and battle (options.gen)
            //   - graphicsGen: the generation number of sprite/field graphics the user has requested.
            //     This will default to mechanicsGen, but may be altered depending on user preferences.
            //   - spriteData.gen: the generation number of a the specific Pokemon sprite in question.
            //     This defaults to graphicsGen, but if the graphicsGen doesn't have a sprite for the Pokemon
            //     (eg. Darmanitan in graphicsGen 2) then we go up gens until it exists.
            //
            let graphicsGen = mechanicsGen;
            if (Dex.prefs('nopastgens')) graphicsGen = 6;
            if (Dex.prefs('bwgfx') && graphicsGen >= 6) graphicsGen = 5;
            spriteData.gen = Math.max(graphicsGen, Math.min(species.gen, 5));
            const baseDir = ['', 'gen1', 'gen2', 'gen3', 'gen4', 'gen5', '', '', '', ''][spriteData.gen];

            let miscData = null;
            let speciesid = species.id;
            if (species.isTotem) speciesid = toID(name);
            if (window.BattlePokemonSprites) miscData = BattlePokemonSprites[speciesid];
            if (!miscData && window.BattlePokemonSpritesBW) miscData = BattlePokemonSpritesBW[speciesid];
            if (!miscData) miscData = {};

            if (miscData.num !== 0 && miscData.num > -5000) {
                let baseSpeciesid = toID(species.baseSpecies);
                spriteData.cryurl = 'audio/cries/' + baseSpeciesid;
                let formeid = species.formeid;
                if (species.isMega || formeid && (
                    formeid === '-crowned' ||
                    formeid === '-eternal' ||
                    formeid === '-eternamax' ||
                    formeid === '-four' ||
                    formeid === '-hangry' ||
                    formeid === '-hero' ||
                    formeid === '-lowkey' ||
                    formeid === '-noice' ||
                    formeid === '-primal' ||
                    formeid === '-rapidstrike' ||
                    formeid === '-roaming' ||
                    formeid === '-school' ||
                    formeid === '-sky' ||
                    formeid === '-starter' ||
                    formeid === '-super' ||
                    formeid === '-therian' ||
                    formeid === '-unbound' ||
                    baseSpeciesid === 'calyrex' ||
                    baseSpeciesid === 'kyurem' ||
                    baseSpeciesid === 'cramorant' ||
                    baseSpeciesid === 'indeedee' ||
                    baseSpeciesid === 'lycanroc' ||
                    baseSpeciesid === 'necrozma' ||
                    baseSpeciesid === 'oinkologne' ||
                    baseSpeciesid === 'oricorio' ||
                    baseSpeciesid === 'slowpoke' ||
                    baseSpeciesid === 'tatsugiri' ||
                    baseSpeciesid === 'zygarde'
                )) {
                    spriteData.cryurl += formeid;
                }
                spriteData.cryurl += '.mp3';
            }

            if (options.shiny && mechanicsGen > 1) dir += '-shiny';

            // April Fool's 2014
            if (Dex.afdMode || options.afd) {
                // Explicit false check above means AFD will be off if the user disables it - no matter what
                dir = 'afd' + dir;
                spriteData.url += dir + '/' + name + '.png';
                // Duplicate code but needed to make AFD tinymax work
                // April Fool's 2020
                if (isDynamax && !options.noScale) {
                    spriteData.w *= 0.25;
                    spriteData.h *= 0.25;
                    spriteData.y += -22;
                } else if (species.isTotem && !options.noScale) {
                    spriteData.w *= 0.5;
                    spriteData.h *= 0.5;
                    spriteData.y += -11;
                }
                return spriteData;
            }

            // Mod Cries
            if (options.mod) {
                spriteData.cryurl = `sprites/${options.mod}/audio/${toID(species.baseSpecies)}`;
                spriteData.cryurl += '.mp3';
            }

            let animatedSprite = false;
            if (!Dex.prefs('noanim') && !Dex.prefs('nogif') && spriteData.gen >= 5) {
                const animationArray = [];
                if (baseDir === '' && window.BattlePokemonSprites) {
                    animationArray.push([BattlePokemonSprites[speciesid], '']);
                }
                if (window.BattlePokemonSpritesBW) {
                    animationArray.push([BattlePokemonSpritesBW[speciesid], 'gen5']);
                }
                for (const [animationData, animDir] of animationArray) {
                    if (!animationData) continue;
                    if (animationData[facing + 'f'] && options.gender === 'F') facing += 'f';
                    if (!animationData[facing]) continue;
                    if (facing.endsWith('f')) name += '-f';
                    if (spriteData.gen >= 6) spriteData.pixelated = false;
                    dir = animDir + 'ani' + dir;
                    spriteData.w = animationData[facing].w;
                    spriteData.h = animationData[facing].h;
                    spriteData.url += dir + '/' + name + '.gif';
                    animatedSprite = true;
                    break;
                }
            }
            if (!animatedSprite) {
                // There is no entry or enough data in pokedex-mini.js
                // Handle these in case-by-case basis; either using BW sprites or matching the played gen.
                dir = (baseDir || 'gen5') + dir;

                // Gender differences don't exist prior to Gen 4,
                // so there are no sprites for it
                if (spriteData.gen >= 4 && miscData['frontf'] && options.gender === 'F') {
                    name += '-f';
                }

                spriteData.url += dir + '/' + name + '.png';
            }

            if (!options.noScale) {
                if (graphicsGen > 4) {
                    // no scaling
                } else if (spriteData.isFrontSprite) {
                    spriteData.w *= 2;
                    spriteData.h *= 2;
                    spriteData.y += -16;
                } else {
                    // old gen backsprites are multiplied by 1.5x by the 3D engine
                    spriteData.w *= 2 / 1.5;
                    spriteData.h *= 2 / 1.5;
                    spriteData.y += -11;
                }
                if (spriteData.gen <= 2) spriteData.y += 2;
            }
            if (isDynamax && !options.noScale) {
                spriteData.w *= 2;
                spriteData.h *= 2;
                spriteData.y += -22;
            } else if (species.isTotem && !options.noScale) {
                spriteData.w *= 1.5;
                spriteData.h *= 1.5;
                spriteData.y += -11;
            }
           if (customSprites.has(species.id)) {
               const direction = isFront ? 'front' : 'back';
               spriteData.url =
                   `https://raw.githubusercontent.com/scoopapa/DH2/refs/heads/main/data/mods/${modID}/sprites/${direction}/${species.id}.png`;
           }
           return spriteData;
        }
        BattleTooltips.prototype.showPokemonTooltip = function (
            clientPokemon, serverPokemon, isActive, illusionIndex
        ) {
            const pokemon = clientPokemon || serverPokemon;
            let text = '';
            let genderBuf = '';
            const gender = pokemon.gender;
            if (gender === 'M' || gender === 'F') {
                genderBuf = ` <img src="${Dex.fxPrefix}gender-${gender.toLowerCase()}.png" alt="${gender}" width="7" height="10" class="pixelated" /> `;
            }

            const ignoreNicks = this.battle.ignoreNicks || this.battle.ignoreOpponent;
            const nickname = ignoreNicks ? Dex.species.get(pokemon.speciesForme).baseSpecies : pokemon.name;
            let name = BattleLog.escapeHTML(nickname);
            if (pokemon.speciesForme !== nickname) {
                name += ` <small>(${BattleLog.escapeHTML(pokemon.speciesForme)})</small>`;
            }

            let levelBuf = (pokemon.level !== 100 ? ` <small>L${pokemon.level}</small>` : ``);
            if (!illusionIndex || illusionIndex === 1) {
                text += `<h2>${name}${genderBuf}${illusionIndex ? '' : levelBuf}<br />`;

                if (clientPokemon?.volatiles.formechange) {
                    if (clientPokemon.volatiles.transform) {
                        text += `<small>(Transformed into ${clientPokemon.volatiles.formechange[1]})</small><br />`;
                    } else {
                        text += `<small>(Changed forme: ${clientPokemon.volatiles.formechange[1]})</small><br />`;
                    }
                }

                let types = serverPokemon?.terastallized ? [serverPokemon.teraType] : this.getPokemonTypes(pokemon);
                let knownPokemon = serverPokemon || clientPokemon;

                if (pokemon.terastallized) {
                    text += `<small>(Terastallized)</small><br />`;
                } else if (clientPokemon?.volatiles.typechange || clientPokemon?.volatiles.typeadd) {
                    text += `<small>(Type changed)</small><br />`;
                }
                text += `<span class="textaligned-typeicons">${types.map(type => Dex.getTypeIcon(type)).join(' ')}</span>`;
                if (pokemon.terastallized) {
                    text += `&nbsp; &nbsp; <small>(base: <span class="textaligned-typeicons">${this.getPokemonTypes(pokemon, true).map(type => Dex.getTypeIcon(type)).join(' ')}</span>)</small>`;
                } else if (knownPokemon.teraType && !this.battle.rules['Terastal Clause']) {
                    text += `&nbsp; &nbsp; <small>(Tera Type: <span class="textaligned-typeicons">${Dex.getTypeIcon(knownPokemon.teraType)}</span>)</small>`;
                }
                text += `</h2>`;
            }

            if (illusionIndex) {
                text += `<p class="tooltip-section"><strong>Possible Illusion #${illusionIndex}</strong>${levelBuf}</p>`;
            }

            if (pokemon.fainted) {
                text += '<p><small>HP:</small> (fainted)</p>';
            } else if (this.battle.hardcoreMode) {
                if (serverPokemon) {
                    const status = pokemon.status ? ` <span class="status ${pokemon.status}">${pokemon.status.toUpperCase()}</span>` : '';
                    text += `<p><small>HP:</small> ${serverPokemon.hp}/${serverPokemon.maxhp}${status}</p>`;
                }
            } else {
                let exacthp = '';
                if (serverPokemon) {
                    exacthp = ` (${serverPokemon.hp}/${serverPokemon.maxhp})`;
                } else if (pokemon.maxhp === 48) {
                    exacthp = ` <small>(${pokemon.hp}/${pokemon.maxhp} pixels)</small>`;
                }
                const status = pokemon.status ? ` <span class="status ${pokemon.status}">${pokemon.status.toUpperCase()}</span>` : '';
                text += `<p><small>HP:</small> ${Pokemon.getHPText(pokemon, this.battle.reportExactHP)}${exacthp}${status}`;
                if (clientPokemon) {
                    if (pokemon.status === 'tox') {
                        if (pokemon.ability === 'Poison Heal' || pokemon.ability === 'Magic Guard') {
                            text += ` <small>Would take if ability removed: ${Math.floor(
                                100 / 16 * Math.min(clientPokemon.statusData.toxicTurns + 1, 15)
                            )}%</small>`;
                        } else {
                            text += ` Next damage: ${Math.floor(
                                100 / (clientPokemon.volatiles['dynamax'] ? 32 : 16) * Math.min(clientPokemon.statusData.toxicTurns + 1, 15)
                            )}%`;
                        }
                    } else if (pokemon.status === 'slp') {
                        text += ` Turns asleep: ${clientPokemon.statusData.sleepTurns}`;
                    }
                }
                text += '</p>';
            }

            const supportsAbilities = this.battle.gen > 2 && !this.battle.tier.includes("Let's Go");

            let abilityText = '';
            if (supportsAbilities) {
                abilityText = this.getPokemonAbilityText(
                    clientPokemon, serverPokemon, isActive, !!illusionIndex && illusionIndex > 1
                );
            }

            let itemText = '';
            if (serverPokemon) {
                let item = '';
                let itemEffect = '';
                if (clientPokemon?.prevItem) {
                    item = 'None';
                    let prevItem = this.battle.dex.items.get(clientPokemon.prevItem).name;
                    itemEffect += clientPokemon.prevItemEffect ? prevItem + ' was ' + clientPokemon.prevItemEffect : 'was ' + prevItem;
                }
                if (serverPokemon.item) item = this.battle.dex.items.get(serverPokemon.item).name;
                if (itemEffect) itemEffect = ' (' + itemEffect + ')';
                if (item) itemText = '<small>Item:</small> ' + item + itemEffect;
            } else if (clientPokemon) {
                let item = '';
                let itemEffect = clientPokemon.itemEffect || '';
                if (clientPokemon.prevItem) {
                    item = 'None';
                    if (itemEffect) itemEffect += '; ';
                    let prevItem = this.battle.dex.items.get(clientPokemon.prevItem).name;
                    itemEffect += clientPokemon.prevItemEffect ? prevItem + ' was ' + clientPokemon.prevItemEffect : 'was ' + prevItem;
                }
                if (pokemon.item) item = this.battle.dex.items.get(pokemon.item).name;
                if (itemEffect) itemEffect = ' (' + itemEffect + ')';
                if (item) itemText = '<small>Item:</small> ' + item + itemEffect;
            }

            if (abilityText || itemText) {
                text += '<p>';
                text += abilityText;
                if (abilityText && itemText) {
                    // ability/item on one line for your own switch tooltips, two lines everywhere else
                    text += (!isActive && serverPokemon ? ' / ' : '</p><p>');
                }
                text += itemText;
                text += '</p>';
            }

            text += this.renderStats(clientPokemon, serverPokemon, !isActive);

            if (serverPokemon && !isActive) {
                // move list
                text += `<p class="tooltip-section">`;
                const battlePokemon = clientPokemon || this.battle.findCorrespondingPokemon(pokemon);
                for (const moveid of serverPokemon.moves) {
                    const move = this.battle.dex.moves.get(moveid);
                    let moveName = `&#8226; ${move.name}`;
                    if (battlePokemon?.moveTrack) {
                        for (const row of battlePokemon.moveTrack) {
                            if (moveName === row[0]) {
                                moveName = this.getPPUseText(row, true);
                                break;
                            }
                        }
                    }
                    text += `${moveName}<br />`;
                }
                text += '</p>';
            } else if (!this.battle.hardcoreMode && clientPokemon?.moveTrack.length) {
                // move list (guessed)
                text += `<p class="tooltip-section">`;
                for (const row of clientPokemon.moveTrack) {
                    text += `${this.getPPUseText(row)}<br />`;
                }
                if (clientPokemon.moveTrack.filter(([moveName]) => {
                    if (moveName.startsWith('*')) return false;
                    const move = this.battle.dex.moves.get(moveName);
                    return !move.isZ && !move.isMax && move.name !== 'Mimic';
                }).length > 4) {
                    text += `(More than 4 moves is usually a sign of Illusion Zoroark/Zorua.) `;
                }
                if (this.battle.gen === 3) {
                    text += `(Pressure is not visible in Gen 3, so in certain situations, more PP may have been lost than shown here.) `;
                }
                if (this.pokemonHasClones(clientPokemon)) {
                    text += `(Your opponent has two indistinguishable Pokémon, making it impossible for you to tell which one has which moves/ability/item.) `;
                }
                text += `</p>`;
            }
            return text;
        }
        Dex.getPokemonIcon = function (pokemon, facingLeft) {
            if (pokemon === 'pokeball') {
                return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -0px 4px`;
            } else if (pokemon === 'pokeball-statused') {
                return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -40px 4px`;
            } else if (pokemon === 'pokeball-fainted') {
                return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -80px 4px;opacity:.4;filter:contrast(0)`;
            } else if (pokemon === 'pokeball-none') {
                return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -80px 4px`;
            }

            let id = toID(pokemon);
            if (!pokemon || typeof pokemon === 'string') pokemon = null;
            // @ts-expect-error safe, but too lazy to cast
            if (pokemon?.speciesForme) id = toID(pokemon.speciesForme);
            // @ts-expect-error safe, but too lazy to cast
            if (pokemon?.species) id = toID(pokemon.species);
            // @ts-expect-error safe, but too lazy to cast
            if (pokemon?.volatiles?.formechange && !pokemon.volatiles.transform) {
                // @ts-expect-error safe, but too lazy to cast
                id = toID(pokemon.volatiles.formechange[1]);
            }
            let num = this.getPokemonIconNum(id, pokemon?.gender === 'F', facingLeft);

           let top = Math.floor(num / 12) * 30;
            let left = (num % 12) * 40;
            let fainted = ((pokemon)?.fainted ?
                           `;opacity:.3;filter:grayscale(100%) brightness(.5)` : ``);

            if (customSprites.has(id)) {
                return `background:transparent url(https://raw.githubusercontent.com/scoopapa/DH2/refs/heads/main/data/mods/${modID}/sprites/icons/${id}.png) 0px 0px / 36px 36px no-repeat scroll${fainted}`;
            }
            return `background:transparent url(${Dex.resourcePrefix}sprites/pokemonicons-sheet.png?v20) no-repeat scroll -${left}px -${top}px${fainted}`;
        }
    })();
