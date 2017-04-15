# Command: Display

The display command will post the profile of the specified netnavi in the current channel. If no netnavi is specified, it defaults to the user's primary partner.

* __Standard Details__
    * Name
    * Mood
    * Avatar
    * Color
    * Currency counts
* __Additional Details__
    * Date Created
    * Online Status
    * Ability
    * Installed Upgrades
    * Frequent Battle Chips
    * Battle Stats

## Changes as of Version 0.5.0+

This command is introduced in Version 0.5.0.

## Usage and Syntax

`?>display NAME UID`

NAME is the netnavi's name. Defaults to the user's primary partner name.
UID is the unique identifier for the given NAME.  Defaults to 0, or to the user's primary partner identifier if no name is given.

__Restrictions__: A user may keep their partner profile private by disabling the public option with [customize](customize.md).

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
