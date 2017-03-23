# Waldorf

> Simple Mattermost Bot 🤡🤠

Uses Webhooks


# Installation

* Prerequisites: [Node.js](https://nodejs.org)
* Install Waldorf `sudo npm install -g waldorf`
* Create a directory for the Scripts e.g. `mkdir /opt/waldorf`


# Mattermost Setup

* In the System Console - Integrations - Custom Integrations:
    * Enable Incoming Webhooks
    * Enable Outgoing Webhooks
    * Enable Integrations to Override Usernames
     
* Create the Webhooks in the Team Settings - Integrations
    * an Incoming Webhook for every Channel where Waldorf should be able to say something
    * an Outgoing Webhook, you don't need to select a Channel here - then Waldorf will be able to subscribe to messages 
    in every Channel. Define desired Trigger Words, e.g. "@waldorf". As Callback URL you need to supply the IP Address
    and the Port where Waldorf listens, if Waldorf runs on the same server as Mattermost you can use e.g. 
    http://127.0.0.1:31337
    
    
# Start Waldorf

See `waldorf --help` for available options.

Example Start command:
```
waldorf -u http://127.0.0.1:8065/hooks/ \
    -n waldorf \
    -s /opt/waldorf \
    -t s1zz8e1wxzgwjfmsnz3c43dnpa \
    -c ij6osdf3ofnidp199ronuinwne:town-square \
    -c hiirtud1spfwmfegd3pejamzsr:another-channel 
```
The -t option supplies the Secret Mattermost generated for the Outgoing Webhook, the -c options define Channels and the 
Secrets of the Incoming Webhooks.


# Scripts

Just place Javascript Files in the /opt/waldorf folder and mind that you have to restart Waldorf when you change or add
Scripts there.

Example Scripts:
```javascript
// Stupid :)
schedule('37 13 * * *', () => pub('town-square', '1337 time!!1! 🤓'));
```

```javascript
// Respond "Hi @user" when someone says "Hello" or "hallo" ...
sub(/[Hh][ea]llo/, (match, user, channel) => pub(channel, `Hi @${user}`));
```

```javascript
// simple quote script
const fs = require('fs');
const file = '/opt/waldorf/quotes.json';

let quotes = [];

if (fs.existsSync(file)) quotes = JSON.parse(fs.readFileSync(file));

sub(/\!addquote (.*)/, (match, user, channel) => {
    quotes.push(match[1]);
    fs.writeFileSync(file, JSON.stringify(quotes));
});

sub(/\!randomquote/, (text, user, channel) => {
    pub(channel, '> ' + quotes[Math.floor(Math.random() * quotes.length)]);
});
```

# Script API
