# Mr. Prog
A Discord bot themed for MMBN fans (or anyone who wants a bot friend)

* [Documentation and Help Guide](https://warped2713.gitbooks.io/mrprog/content/)
* [Discord Test Server](https://discord.gg/An86Wxy)

## Dependencies
If you'd like to clone or fork this repo, you will need to [locally install these NodeJS packages](https://docs.npmjs.com/getting-started/installing-npm-packages-locally) in the root directory of the repo:
* [`npm install jsonfile`](https://www.npmjs.com/package/jsonfile)
  * Note: I modified this slightly to make Mr.Prog's JSON output files readable in regular notepad.
  * ~ Line 96: in `function writeFile()` after `str = JSON.stringify()`: 
  * `str = str.replace(/\n/ig, "\r\n")`
* [`npm install request`](https://www.npmjs.com/package/request)
* [`npm install discord.js`](https://github.com/hydrabolt/discord.js/)

## Variations and Reskinning
Mr.Prog bot's configuration files can be duplicated and modified to fit your tastes.  By default, the bot lets you create and interact with "NetNavi" partners, but you can use the configuration files to use different terminology, character presets, and images. Eventually this will probably be handled via HTML forms and database connections, but for now you can fork the repo and make modifications to config, enum, and npc files.
### Examples might include:
* Super Smash Bros
* Digimon
* Medabots
* Your custom roleplay characters


When the bot gets to version 0.5.0 (with basic battle and item features), I'll include links to these sample variations, so stay tuned!
