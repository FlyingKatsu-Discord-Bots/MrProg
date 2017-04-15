title_parent: ?>
Description: Changes as of Version 0.1.5:  Instead of sending long detailed messages, the help command now responds with a link to the appropriate page in these docs, along with the user's access level (anyone, netop, mod, or admin). Additionally, the help command now responds to the same channel where it is invoked, instead of responding only by direct message.

# Command: Help

Mr.Prog will send a direct message to you, with a list of all available commands, or a detailed description of a specific command.

## Changes as of Version 0.1.5+

Instead of sending long detailed messages, the help command now responds with a link to the appropriate page in these docs, along with the user's access level (anyone, netop, mod, or admin).

Additionally, the help command now responds to the same channel where it is invoked, instead of responding only by direct message.

## Usage and Syntax

### Help: Simple
`?>help`

Responds with a list of all commands available for the current channel, along with access levels for each command.

### Help: Channel

`?>help channel CHANNEL`

Responds with a list of all commands recognized by the specified CHANNEL.

### Help: Command

`?>help command COMMAND`

Responds with a detailed description of the specifed command, similar to what's written in these docs.

## Permissions

This command is recognized in the following channels for the specified access levels:

* [#general](../channels/general.md "General Channel")
    * Anyone
* [#shop](../channels/shop.md "Shop Channel")
    * Netops
    * Mods
    * Admins
* [#battle](../channels/battle.md "Battle Channel")
    * Netops
    * Mods
    * Admins
* [#debug](../channels/debug.md "Debug Channel")
    * Mods
    * Admins
* [#direct-message](../channels/direct-message.md "Direct Messages")
    * Anyone
