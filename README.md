# ParantranzHelper
An helper utility to speed up translation paradox games mods using paratranz api and deepl

## Informations
You need node v18 and above in order to run the program

You need to add your <a href="#how-to">ParaTranz api key</a> 
and your [deepL api key](https://www.deepl.com/fr/account/summary) if you want to have DeepL translation

## Configuration
`paratranz_api_key` Your ParaTranz API Key, this argument is **required**

`paratranz_api_endpoint` Your ParaTranz API Endpoint, this argument is **required** 

`parantranz_project_id` Your ParaTranz Project Id, this argument is **not required**

`deepl_api_key` Your DeepL API Key, this argument is **required** if you want translations 

`deepl_api_endpoint` Your DeepL API Endpoint, this argument is **required** 

`use_paradox_game_files` This argument ask you if you want to translate automatically with Paradox game files this argument is **not required**. Can be `true` or `false`

`paradox_game_path` Your Paradox game path, this argument is **required** if `use_paradox_game_files` is `true`

`target_language` Your target language, this argument is **required** if `use_paradox_game_files` is `true`
and needs to be a valid game folder under `/game/localization`

`paratranz_files_blacklist` Your Paratranz file blacklist. Used to ignore translation from these specific files.
`paratranz_files_whitelist` Your Paratranz file whitelist. Used to ignore every other files.

## How to <div id="how-to"></div>
### Get your ParaTranz api key
Goto to your Paratranz profile and the click on settings.

Click to generate your api key and paste it in the app configuration with enclosing quotes

eg: `"paratranz_api_key" : "aaabbb000000eeffefe0000e0a100f00"`

### Get your DeepL api key
Goto [API Page](https://www.deepl.com/fr/pro-api?cta=header-pro-api/) while being connected to your DeepL account

Click on "Sign up for free" and pick Free plan (you can also pick paid plan but you will have to change the deepl api endpoint in configuration)

Proceed to identity verification (don't worry, you **won't** get billed) and go to [DeepL Account summary](https://www.deepl.com/account/summary)

You can now copy your api key and paste it in the app configuration

eg: `"deepl_api_key" : "ff000000-aa00-0000-ffff-a0a0a0ff0aa0:fx"`

### Use program
Install nodejs: [Lastest nodejs version](https://nodejs.org/) versions above 18 are officially supported

Start program by using this command with your terminal while in paratranz folder: `node helper.js`

Program will then ask you to provide the project id you want to work with.

Use `paratranz_project_id` line in `config.json` with your project id if you don't want to type it everytime.

eg: `"paratranz_project_id" : "6833"` will automatically work with AGOT FR translation project if you are a member of it.

ParaTranz helper will then suggest you a translation if `deepl_api_key` is set.

Press Y to accept, N to refuse (or R to rewrite. Not working atm).

## Current features

Automatic translation of original game files if `use_paradox_game_files` is `true`.

Automatic copy paste for Paradox tags (only supporting tags of 1 word length at the moment)

DeepL recommendations for text without tags if `deepl_api_key` is set.