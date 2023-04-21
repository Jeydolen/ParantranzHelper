# ParantranzHelper
A help utility to speed up translation of mods for paradox games

## Informations
You need node v17.5 or node-fetch in order to run program

You need to add your <a href="#how-to">ParaTranz api key</a> 
and your [deepL api key](https://www.deepl.com/fr/account/summary) if you want to have DeepL translation

## How to <div id="how-to"></div>
### Get your ParaTranz api key
Goto to your Paratranz profile and the click on settings.

Click to generate your api key and paste it in the app configuration with enclosing quotes

eg: `const paratranz_api_key = "aaabbb000000eeffefe0000e0a100f00"`

### Get your DeepL api key
Goto [API Page](https://www.deepl.com/fr/pro-api?cta=header-pro-api/) while being connected to your DeepL account

Click on "Sign up for free" and pick Free plan (you can also pick paid plan but you will have to change the deepl api endpoint in configuration)

Proceed to identity verification (don't worry, you won't get billed) and go to [DeepL Account summary](https://www.deepl.com/account/summary)

You can now copy your api key and paste it in the app configuration

eg: `const deepl_api_key = "ff000000-aa00-0000-ffff-a0a0a0ff0aa0:fx"`

### Use program
Install nodejs: [Lastest nodejs version](https://nodejs.org/) version above 17.5 are officially supported

Start program by using this command with your terminal while in paratranz folder: `node helper.js`

Program will then ask you to provide the project id you want to work with change this line:

`let paratranz_project_id` with your project id if you don't want to type it everytime.

eg: `let paratranz_project_id = 6833;` will automatically work with AGOT FR translation project if you are a member of it.

ParatranzHelper will then load your paradox game files to look for official translation from Paradox and replace where it need to be done.

Warning: this might replace translation with wrong values but 90% of the time it works perfectly.

## Current features

Automatic translation of original game files 

Automatic copy paste for Paradox tags (only supporting 1 word tags at the moment)

DeepL recommendations for text without tags
