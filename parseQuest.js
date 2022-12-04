import axios from "axios";
import fs from "fs";

async function requestQuests(offset = 0) {
    const baseUrl = 'https://api.dofusdb.fr/quests'

    let res = await axios.get(baseUrl, {
        headers: {
            'Accept-Encoding': 'application/json',
        },
        params: {
            $skip: offset,
            $populate: false,
            $limit: 50,
            $sort: '-id',
            lang: 'fr',
        },
    });

    return res.data;
}

async function parseQuests(questQuery) {
    const parsedQuests = []
    const { data } = questQuery;

    data.forEach((quest) => {
        let requirements = null;

        if (quest.startCriterion) {
            requirements = {
                level: null,
                quests: [],
                class: null,
            };
            const criteria = quest.startCriterion.split('&');

            criteria.forEach((criteria) => {
                if (criteria.includes('Qf=')) {
                    const questId = criteria.split('Qf=')[1];

                    requirements.quests.push(questId);
                }

                if (criteria.includes('Qf!')) {
                    const questId = criteria.split('Qf!')[1];

                    requirements.quests.push(questId);
                }

                if (criteria.includes('PL=')) {
                    requirements.level = criteria.split('PL=')[1];
                }

                if (criteria.includes('PG=')) {
                    requirements.class = criteria.split('PG=')[1];
                }
            });
        }

        parsedQuests.push({
           id: quest.id,
           name: quest.name.fr,
           requirements: requirements,
        })
    });

    return parsedQuests;
}

function writeFile(questList) {
    const json = JSON.stringify(questList);
    fs.writeFile('quests.json', json, error => {
        if (error) {
            console.error(error);
        }
    });
}

async function run() {
    let questsList = [];

    for (let i = 0; i < 2; i++) {
        const request = await requestQuests(i*50);

        const parsedQuests = await parseQuests(request);

        questsList = questsList.concat(parsedQuests);
    }

    console.log(questsList);

    writeFile(questsList);
}

await run();
