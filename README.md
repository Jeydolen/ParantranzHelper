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

eg: `const pt_api_key = "aaabbb000000eeffefe0000e0a100f00"`

### Get your DeepL api key
Goto [API Page](https://www.deepl.com/fr/pro-api?cta=header-pro-api/) while being connected to your DeepL account

Click on "Sign up for free" and pick Free plan (you can also pick paid plan but you will have to change the deepl api endpoint in configuration)

Proceed to identity verification (don't worry, you won't get billed) and go to [DeepL Account summary](https://www.deepl.com/account/summary)

You can now copy your api key and paste it in the app configuration

eg: `const dl_api_key = "ff000000-aa00-0000-ffff-a0a0a0ff0aa0:fx"`

## Current features

Automatic translation of original game files 

Automatic copy paste for Paradox tags (only supporting 1 word tags at the moment)

DeepL recommendations for text without tags
