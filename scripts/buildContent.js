const path = require('path');
const fs = require('fs-extra');
const propertiesParser = require('properties-parser');
const _ = require('lodash');
require('dotenv').config();

const getMessages = (
  basePath = path.resolve('./', 'locales/US/en'),
  messages = {}
) => {
  const files = fs.readdirSync(basePath);
  files.forEach((file) => {
    const [fileKey, extension] = file.split('.');
    if (/properties/.test(extension)) {
      const properties = propertiesParser.read(`${basePath}/${file}`);
      const parsedResult = Object.keys(properties).reduce((acc, prop) => {
        _.set(acc, prop, properties[prop]);
        return acc;
      }, {});
      messages[fileKey] = parsedResult;
    } else {
      messages[fileKey] = getMessages(`${basePath}/${file}`, {});
    }
  });
  return messages;
};

/** 
Read all folders in source_content by country + lang
For each country_lang combination, generate a JSON representation of content
Output >> build_content/en_IN.json
*/

const buildJSONContent = (sourceFolder, outputPath) => {
  const countries = fs.readdirSync(path.resolve('./', sourceFolder));
  countries.forEach((country) => {
    const languages = fs.readdirSync(
      path.resolve('./', `${sourceFolder}/${country}/`)
    );
    languages.forEach((lang) => {
      const messages = getMessages(
        path.resolve('./', `${sourceFolder}/${country}/${lang}`)
      );
      fs.outputJsonSync(
        path.resolve('./', `${outputPath}/${lang}_${country}.json`),
        messages,
        {
          spaces: 2,
        }
      );
      if (process.env.CLIENT) {
        const clientKeys =
          require(`../client_keys/${process.env.CLIENT}.json`).keys;
        const filteredMessages = _.pick(messages, clientKeys);
        fs.outputJsonSync(
          path.resolve(
            './',
            `${outputPath}/clients/${process.env.CLIENT}/${lang}_${country}.json`
          ),
          filteredMessages,
          {
            spaces: 2,
          }
        );
      }
    });
  });
  console.log(`Content build successful, output saved in ${outputPath}`);
};

buildJSONContent('source_content', 'build_content');
