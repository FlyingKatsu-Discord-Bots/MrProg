const SECRET = require("./require/config/bot.json");
const CONFIG = require("./require/config/server.js");
const NPC = require("./require/npc.js");
const CUSTOM = require("./require/custom.js");
const ENUM = require("./require/enum.js");
const CHARACTER = require("./require/character.js");

const FS = require('fs');
const REQUEST = require('request');
const DISCORD = require('discord.js');
const CLIENT = new DISCORD.Client();

const SERVER = {
  guild: null,
  roles: {
    partnered: null,
    mod: null,
    admin: null
  },
  channels: {
    main: null,
    info: null,
    battle: null,
    shop: null,
    oc: null,
    debug: null
  },
  isValid: true
};

const COMMONREGEX = {
  hash: /#/ig,
  newline: /\n/ig
};

String.prototype.strip = function(v) {
  return this.replace( COMMONREGEX[v] , "");
}

// =========================================================
//  STATE VARIABLES
// =========================================================
var allPartners = new Map();
var disconnected = false;

// =========================================================
//  UTILITY FUNCTIONS
// =========================================================
var FORMAT = {
  inline: function( text, prefix ) {
    let btk = "`";
    let pfx = prefix || "";
    return `${btk}${pfx}${text}${btk}`;
  },
  
  code: function( text, prefix ) {
    let btk3 = "```";
    let pfx = prefix || "";
    return `${btk3}\n${pfx}${text}\n${btk3}`;
  },
  
  mention: function( user ) {
      return `<@${user.username}#${user.discriminator}>`;
  },
  
  injectVar: function( owner, user, text ) {
    return text.replace(/@Owner/ig, owner.toString())
      .replace(/@User/ig, user.toString());
  },
  
  embed: function( input ) {
    let output = new DISCORD.RichEmbed();
    if( input.author ) output.setAuthor( input.author );
    if( input.title ) output.setTitle( input.title );
    if( input.desc ) output.setDescription( input.desc );
    if( input.thumb ) output.setThumbnail( input.thumb );
    if( input.imgurl ) output.setImage( input.imgurl );
    if( input.color ) output.setColor( input.color );
    if( input.foot ) output.setFooter( input.foot );
    return output;
  },
  
  isHexCode: function ( str ) {
    let code, i, len;    
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      // NOTE: decimals are shifted by one due to comparison as > < instead of >= <=
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 71) && // upper alpha (A-F)
          !(code > 96 && code < 103) ) // lower alpha (a-f)
      { return false; }
    }
    return true;
  },
  
  isNumeric: function ( str ) {
    let code, i, len;
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      // NOTE: decimals are shifted by one due to comparison as > < instead of >= <=
      if (!(code > 47 && code < 58)) // numeric (0-9)
      { return false; }
    }
    return true;
  },
  
  isAlphaNumericJP: function( str ) {
    // Adapted from Michael Martin-Smucker on StackOverflow
    // http://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript/25352300#25352300
    let code, i, len;    
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      // NOTE: decimals are shifted by one due to comparison as > < instead of >= <=
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123) && // lower alpha (a-z)
          // Japanese Chars
          !(code > 12351 && code < 12448) && // Hiragana 3040-309f
          !(code > 12447 && code < 12544) && // Katakana 30a0 - 30ff
          !(code > 65381 && code < 65440) && // Half-width kana ff66 - ff9f
          !(code > 19967 && code < 40880) && // Common Kanji 4e00 - 9faf
          !(code > 13311 && code < 19894)) // Rare Kanji 3400 - 4db5
      { return false; }
    }
    return true;
  }
};
if (Object.freeze) Object.freeze(FORMAT);

var UTIL = {
  setServer: function( channels ) {
    
    let tempMain = channels.main;
    
    // Set MAIN to DEBUG if MAIN is NULL
    if ( !channels.main ) {
      if ( channels.debug ) {
        tempMain = channels.debug;
        console.log("UTIL:: Channel DEBUG will be used because MAIN is null");
      } else {
        console.log("UTIL:: You must specify a DEBUG or MAIN channel ID!");
        SERVER.isValid = false;
      }
    }
    
    // Get the guild object for the server
    SERVER.guild = CLIENT.guilds.get( CONFIG.guildID );
    
    if ( SERVER.guild ) {      
      // Connect SERVER to actual channel objects
      // redirecting any null channel IDs to MAIN
      SERVER.channels.main = SERVER.guild.channels.get( tempMain );
      SERVER.channels.info = SERVER.guild.channels.get( channels.info || tempMain );
      SERVER.channels.battle = SERVER.guild.channels.get( channels.battle || tempMain );
      SERVER.channels.shop = SERVER.guild.channels.get( channels.shop || tempMain );
      SERVER.channels.oc = SERVER.guild.channels.get( channels.oc || tempMain );
      SERVER.channels.debug = SERVER.guild.channels.get( channels.debug || tempMain );
      
      // Set up roles
      UTIL.setRoles();
      
    } else {
      
      // If the guild wasn't found, the SERVER isn't valid
      console.log("Couldn't find the SERVER!");
      SERVER.isValid = false;
    }
    
    // If the main (or debug) channel wasn't found, the SERVER isn't valid
    if ( !SERVER.channels.main ) SERVER.isValid = false;
    
    if (Object.freeze) Object.freeze(SERVER);

  },
  
  setRoles: function() {
    SERVER.roles.partnered = SERVER.guild.roles.find('name', CONFIG.roles.partnered);
    SERVER.roles.mod = SERVER.guild.roles.find('name', CONFIG.roles.mod);
    SERVER.roles.admin = SERVER.guild.roles.find('name', CONFIG.roles.admin);
  },
  
  mapIf: function( resultArray, inputArray, condFn ) {
    var result = resultArray;
    for (var i=0; i < inputArray.length; i++) {
      if ( condFn(inputArray[i]) ) result.push(inputArray[i]);
    }
    return result;
  },
  
  boolMapReduce: function(input, arr, fnIN, fnOUT) {
    var result = input;
    for (var i=0; i<arr.length; i++) {
      result = fnOUT( result, fnIN(arr[i]) );
    }
    return result;
  },
  
  reduceAND: function(r, item) {
    return r && item;
  },
  
  reduceOR: function(r, item) {
    return r || item;
  },
  
  channelMatch: function( channel ) {
    return function( item ) {
      return SERVER.channels[item] === channel;
    }
  },
  
  filterCmdByChannel: function ( channel ) {
    return function( item ) {
      if ( typeof ENUM.Command[item] === "number" )  return COMMAND.isChannelPermitted( item, channel );
      return false;
    }
  },
  
  roleMatch: function( user ) {
    return function( item ) {
      return SERVER.guild.member(user).roles.has(SERVER.roles[item].id);
    }
  },
  
  filterCmdByUser: function ( user ) {
    return function( item ) {
      return COMMAND.isUserPermitted( item, user );
    }
  },
  
  sendFileRequest: function( uri, expectedType, dataHandler, statusResponder ) {
    
    REQUEST( uri , function(error, response, body) {      
      if( !error && response.statusCode === 200 ) {
        if ( expectedType === "image" ) {
          dataHandler( response, uri );
        } else {
          try {
            dataHandler( JSON.parse(body), uri );
          } catch (e) {
            //console.log(e);
            statusResponder( { reason: e } );
          }
        }
      } else {
        console.log("There was an error loading your file...\n" + error);
        statusResponder( { reason: error } );
      }
      console.log("========");
    })
      .on( 'response', function(response) {
        let self = this;
        let invalidCode = "";
        
        let ctype = response.headers["content-type"].split(" ")[0];
        if( expectedType === "image" ) {
          if( !ctype.includes("image/") && !ctype.includes("image/") ) {
            console.log("Type: " + ctype);
            console.log("Wrong File Type!  Expected Image.  Aborting...");
            invalidCode = "filetype";
            self.abort();
          }
        } else {
          if( !ctype.includes("text/plain") && !ctype.includes("application/json") ) {
            console.log("Type: " + ctype);
            console.log("Wrong File Type!  Expected JSON Text.  Aborting...");
            invalidCode = "filetype";
            self.abort();
          }
        }        
      
        let byteCounter = 0;
        response.on( 'data', function( data ) { 
          //console.log(`B:: ${byteCounter}`);    
          
          if( byteCounter + data.length > SECRET.maxfilesize * 1000 ) {
            console.log("File too large!  Aborting...");
            invalidCode = "filesize";
            self.abort();
            
          } else {
            byteCounter += data.length; 
            //console.log(`B:: decoded ${data.length} total: ${byteCounter}`);
          }
        } );
        response.on( 'end', function() {
          console.log("Finished loading file request");
          statusResponder( { code: this.statusCode, reason: invalidCode } );
        } );
      } );
  }
};
if (Object.freeze) Object.freeze(UTIL);

var COMMAND = {
  // Admin / Mod Functions
  shutdown: function(msg, args, useOC) {
    SERVER.channels.main
      .sendMessage(`${SERVER.roles.partnered} ${CONFIG.botname} is shutting down at ${msg.author}'s request`)
      .catch(console.log);
    CLIENT.destroy()
      .catch( console.error );
        /*function (error) {
        console.log(error);
        msg.reply("Failed to shutdown the bot. Have the bot admin check the console for error specifics.");
      } );*/
  },
  test: function(msg, args) {
    SERVER.channels.debug
      .sendEmbed( FORMAT.embed( { desc: `This is just a test.` } ) )
      .catch(console.log);
  },
  clear: function(msg, args) {
    // TODO: Check user individual permissions to delete messages
    let numDel = (args[0]) ? parseInt(args[0]) : 10;
    if ( !numDel || numDel <= 2 || numDel >= 200) {
      this.feedbackError('CLEAR command accepts only values greater than 2 and less than 200!', msg);
      return;
    } else {
      
      let channel = msg.channel;
      
      if (args[1]) {
        if ( SERVER.channels[ args[1].toLowerCase() ] ) {
         channel = SERVER.channels[ args[1].toLowerCase() ];
        } else {
          this.feedbackError('Not a valid channel. Choose one of (main|shop|battle|oc|debug)', msg);
          return;
        }
      }
      
      channel.bulkDelete(numDel)
        .then(
          channel
            .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
              'normal', 'warning', 
              `${numDel} MESSAGES DELETED.`, 
              `by @${msg.author.username}#${msg.author.discriminator} in #${channel.name}` ) ) )
            .catch(console.log) )
        .catch( console.error );
          /*function(error) {
            console.log(error);
            msg.reply(`Failed to delete messages for ${channel}. Please check bot permissions.`);
          } );*/
    }
  },
  
  // Informative Functions
  help: function(msg, args, useOC) {
    // Process arguments
    if ( args[0] ) {
      let option = args[0].toLowerCase();
      if ( this.helpArgs.hasOwnProperty(option) ) {
          this.helpArgs[option]( msg, args );
      } else {
        this.feedbackError( ` ${option} is not a valid option.`, msg );
        return;
      }
    } else {
      this.helpArgs.channel( msg, args );
    }    
  },
  helpArgs: {
    channel: function( msg, args ) {
      let channel = msg.channel;

      if( args[1] ) {
        channel = SERVER.channels[args[1].toLowerCase()];
        if ( !channel ) {
          msg.reply(`You did not specify a valid channel. Pick one of ( main | shop | battle | oc | debug )`)
          .catch(console.log);
          return;
        }
      }

      // Get all commands where channel is enabled
      let channelEnabled = UTIL.mapIf( [], Object.keys(ENUM.Command), UTIL.filterCmdByChannel(channel) );

      //console.log(channelEnabled);

      // Filter out all commands where user is not permitted
      let filteredCmd = UTIL.mapIf( [], channelEnabled, UTIL.filterCmdByUser(msg.author) );

      //console.log(filteredCmd);

      // Send the result
      msg.author
        .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
            'normal', 'normal', 
            `Loading command list, for commands allowed by ${msg.author} in #${channel.name} ...`, `${CONFIG.prefix}help command [command]` ) ) )
        .catch(console.log);
      msg.author
        .sendMessage( ENUM.Command.getList( filteredCmd ) )
        .catch(console.log);
    },
    command: function( msg, args ) {
      if ( args[1] ) {
        let cmd = ENUM.Command.isCommand(args[1].toLowerCase());
        if ( cmd ) {
          msg.author
            .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
                'normal', 'normal', 
                `Loading description for the command, ${FORMAT.inline(args[1])}...`, `${CONFIG.prefix}help command [command]` ) ) )
              .catch(console.log);
          msg.author
            .sendMessage( ENUM.Command.getDetails(cmd.id) )
            .catch(console.log);
        } else {
          COMMAND.feedbackError( ` ${FORMAT.inline(args[1])} is not a valid command.`, msg );
          return;
        }
      } else {
        COMMAND.feedbackError( ` You did not specify which command you needed help with`, msg );
      }
    }
  },
  init: function(msg, args, useOC) {},
  info: function(msg, args, useOC) {
    // Process arguments
    if ( args[0] ) {
      let option = args[0].toLowerCase();
      if ( this.infoArgs.hasOwnProperty(option) ) {
          this.infoArgs[option]( msg, args );
      } else {
        this.feedbackError( ` ${option} is not a valid option.`, msg );
        return;
      }
    } else {
      msg.reply(`You did not specify what you wanted to learn about. Pick one of ( preset | variant [preset] )`)
        .catch(console.log);
    }
  },
  infoArgs: {
    preset: function( msg, filter ) {
      if (filter[1]) {
        preset = ENUM.Preset.hasBase(filter[1].toLowerCase());
        if ( preset ) {
          msg.channel.sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
            'normal', 'normal', `Loading information about the ${FORMAT.inline(filter[1])} preset...`
             ) ) )
            .catch(console.log);
          msg.channel.sendEmbed( FORMAT.embed( ENUM.Preset.getSummary( preset.value ) ) )
            .catch(console.log);
        } else {
          msg.reply(`${FORMAT.inline(filter[1])} is not a valid PRESET keyword.`)
            .catch(console.log);
        }
      } else {
        msg.channel.sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
          'normal', 'normal', 'Loading information about PRESETS...'
           ) ) )
          .catch(console.log);
        msg.channel.sendMessage( ENUM.Preset.getDetails() )
          .catch(console.log);
      }
    },
    presets: function(a,b) { this.preset(a,b); },
    
    variant: function( msg, filter ) {
      if (filter[1] && filter[2]) {
        preset = ENUM.Preset.hasBase(filter[1].toLowerCase());
        variant = filter[2].toLowerCase();
        isVariant = ENUM.Preset.hasVariant(preset.id, variant);
        if ( preset && isVariant ) {
          msg.channel.sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
            'normal', 'normal', `Loading information about ${FORMAT.inline(filter[1])} ${FORMAT.inline(filter[2])}...`
             ) ) )
            .catch(console.log);
          msg.channel.sendEmbed( FORMAT.embed( 
            ENUM.Preset.getVariantDetails( preset.id, variant ) ) )
            .catch(console.log);
        } else {
          msg.reply(`${FORMAT.inline(filter[1])} ${FORMAT.inline(filter[2])} is not a valid [preset] [variant] pair.`)
            .catch(console.log);
        }
      } else {
        msg.reply(`You did not specify a [preset] [variant] pair.`)
        .catch(console.log);
      }
    },
    variants:  function(a,b) { this.variant(a,b); }
  },
  
  tips: function(msg, args, useOC) {
    
    let partner = null;
    
    if ( allPartners.has( msg.author.id ) ) {
      partner = allPartners.get(msg.author.id);
    }
    
    switch( true ) {
      case msg.type === "dm":
      case msg.channel === SERVER.channels.main:
      case msg.channel === SERVER.channels.oc:
        if (partner) {
          // Check in on partner status
          msg.channel
            .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
              `Hello, ${msg.author}!\n\nHow is your ${CONFIG.partnerLabel}, ${partner.getName()}, doing?` ) ) )
            .catch(console.log);
          // Get partner response
          msg.channel
            .sendEmbed( FORMAT.embed( partner.getEmbed( msg.author, useOC, 'feeling' ) ) )
            .catch(console.log);
        } else {
          // Remind user to create a partner for themselves
          msg.channel
            .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
              `Hello, ${msg.author}!\n\nType the following to make your own ${CONFIG.partnerLabel}:\n\n${FORMAT.code("create NAME BASE VARIANT", CONFIG.prefix)}` ) ) )
            .catch(console.log);
        }
        break;
        
      case msg.channel === SERVER.channels.battle:
        msg.channel
          .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
            NPC.guide.getDialogue('tips_battle') ) ) )
          .catch(console.log);
        break;
        
      case msg.channel === SERVER.channels.shop:
        msg.channel
          .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
            NPC.guide.getDialogue('tips_shop') ) ) )
          .catch(console.log);
        break;
        
      default:
        msg.channel
          .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
            NPC.guide.getDialogue('random') ) ) )
          .catch(console.log);
        break;
    }
  },
  
  // Partner Customization
  create: function(msg, args, useOC) {
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      msg.reply(`BUT YOU ALREADY HAVE A ${CONFIG.partnerLabel.toUpperCase()}`)
        .catch(console.log);
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'confused') ) )
        .catch(console.log);
    } else {

      let name = args[0] || null,
          base = args[1] || null,
          variant = args[2] || null;
      
      // Check Base
      if (base) {
        base = base.toLowerCase();
      } else {
        base = ENUM.Preset.properties[1].id;
      }
      
      if ( !ENUM.Preset.hasBase( base ) ) {
        msg.reply(`${FORMAT.inline(base)} is not a recognized [preset]`)
          .catch(console.log);
        return;
      }
      
      // Check Variant
      if (variant) {
        variant = variant.toLowerCase();
      } else {
        variant = Object.keys(ENUM.Preset.properties[ENUM.Preset[base]].variants)[0];
      }
      
      if ( !ENUM.Preset.hasVariant( base, variant ) ) {
        msg.reply(`${FORMAT.inline(base)} ${FORMAT.inline(variant)} is not a recognized [preset] [variant] pair`)
          .catch(console.log);
        return;
      }
      
      // Check Name
      if (!name || name === "*") {
        name = null;
      } else {
        let trimmedName = name;
        if ( name.substr(-CONFIG.suffix.length).toUpperCase() === CONFIG.suffix.toUpperCase() ) {
          trimmedName = trimmedName.substr(0, trimmedName.length - CONFIG.suffix.length);
        }
        if ( !trimmedName || !FORMAT.isAlphaNumericJP( trimmedName ) ) {
          msg.reply(`${FORMAT.inline(name)} is not a valid [name]\n[name] should be alphanumeric, kana, and/or kanji.\nAny required suffix will be added automatically.`)
            .catch(console.log);
          return;
        } else {
          name = name.substr(0,1).toUpperCase() + name.substr(1);
        }
      }
      
      // Create new
      allPartners.set( msg.author.id, 
        new CHARACTER.Partner( { 
          owner: msg.author, 
          name: name, 
          base: base, 
          variant: variant } ) );
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'greeting') ) )
        .catch(console.log);
      SERVER.guild.member(msg.author)
        .addRole( SERVER.roles.partnered )
        .catch(console.log);
    }
  },  
  rename: function(msg, args, useOC) {
    let name = args[0] || null;

    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      
      // Check Name
      if (!name || name === "*") {
        name = null;
      } else {
        let trimmedName = name;
        if ( name.substr(-CONFIG.suffix.length).toUpperCase() === CONFIG.suffix.toUpperCase() ) {
          trimmedName = trimmedName.substr(0, trimmedName.length - CONFIG.suffix.length);
        }
        if ( !trimmedName || !FORMAT.isAlphaNumericJP( trimmedName ) ) {
          msg.reply(`${FORMAT.inline(name)} is not a valid [name]\n[name] should be alphanumeric, kana, and/or kanji.\nAny required suffix will be added automatically.`)
            .catch(console.log);
          msg.channel.sendEmbed( FORMAT.embed( 
            allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'confused') ) )
            .catch(console.log);
          return;
        } else {
          name = name.substr(0,1).toUpperCase() + name.substr(1);
        }
      }
      
      partner.setName(name);
      
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'customized') ) )
        .catch(console.log);
    
    } else {
      msg.reply(`BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`)
        .catch(console.log);
    }
  },
  recolor: function(msg, args, useOC) {
    let color = (args[0]) ? args[0].strip("hash").slice(0,6) : null;
        
    if ( !color || ( color && !FORMAT.isHexCode( color ) ) ) {
      msg.reply(`${FORMAT.inline(color)} is not a valid [hexcolor]!`)
        .catch(console.log);
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'confused') ) )
        .catch(console.log);
      return;
    }
    
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      partner.setColor("#"+color);
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'customized') ) )
        .catch(console.log);
    } else {
      this.feedbackError( 
        `BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`, 
        msg );
    }
  },
  save: function(msg, args, useOC) {
    // Check if really partnered
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      
      // Process arguments
      if ( args[0] ) {
        let option = args[0].toLowerCase();
        let output = (this.saveArgs.hasOwnProperty(option)) ?
            this.saveArgs[option]( msg, partner, useOC ) : null;
        if (!output) {
          this.feedbackError( ` ${option} is not a valid option.`, msg, useOC, partner );
          return;
        }
        
        FS.writeFile( 
          output.file, 
          JSON.stringify(output.customdata, null, 2).replace(COMMONREGEX.newline,"\r\n"),
          (error) => {
            if (error) console.error(error);
            console.log("Writing...");
            console.log("ERROR: " + error);
            console.log("Done writing!");
            msg.author.send(`Here is your ${option} file!`, { file: output.file })
              .then( 
                FS.unlink( output.file, (error) => {
                  if (error) console.error(error);
                  console.log("File deleted!");
                } ),
                (error) => { if (error) console.error(error); }
                 )
              .catch(console.log);
            console.log("end of writefile handler");
        });
        
        
      } else {
        msg.reply(`You did not specify what file you wanted to download.`)
          .catch(console.log);
        msg.channel.sendEmbed( FORMAT.embed( 
          allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'confused') ) )
          .catch(console.log);
      }
      
    } else {
      msg.reply(`BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`)
        .catch(console.log);
    }
  },
  saveArgs: {
    dialogue: function( msg, partner, useOC ) {
      return { 
        customdata: partner.custom.modifiers, 
        file: `temp/dialogue_${msg.author.id}.txt` 
      };
    },
    personality: function( msg, partner, useOC ) {
      let d = ENUM.Personality
        .properties[ENUM.Personality[partner.getPersonality()]]
        .modifiers;
      return { 
        customdata: d, 
        file: `temp/personality_${partner.getPersonality()}_${msg.author.id}.txt` 
      };
    },
    phrases: function ( msg, partner, useOC ) {
      let d = partner.getPhrases();
      return { 
        customdata: d, 
        file: `temp/phrases_${msg.author.id}.txt` 
      };
    },
    partition: function( msg, partner, useOC ) {
      msg.reply("this hasn't been implemented yet!").catch(console.log);
      return;
    },
    folder: function( msg, partner, useOC ) {
      msg.reply("this hasn't been implemented yet!").catch(console.log);
      return;
    }    
  },
  load: function(msg, args, useOC) {
    // Check if really partnered
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      
      // Process arguments
      if ( args[0] ) {
        let option = args[0].toLowerCase();
        let output = (this.loadArgs.hasOwnProperty(option)) ?
            this.loadArgs[option]( msg, partner, useOC ) : null;
        if (!output) {
          this.feedbackError( ` ${option} is not a valid option.`, msg, useOC, partner );
          return;
        }
        
        // Get Attachment data
        if (msg.attachments.size > 0) {
          console.log("Checking for Attached File");
          let atfile = msg.attachments.first();
          
          UTIL.sendFileRequest( atfile.url, output.expectedType, output.dataHandler, output.statusResponder );

        // Get URL data
        } else if ( args[1] ) {
          console.log("Checking for URL");
          
          UTIL.sendFileRequest( args[1], output.expectedType, output.dataHandler, output.statusResponder );

        } else {
          console.log("No file detected!");
          console.log(args);
          this.feedbackError( 
            `You did not provide a file or file URL.`, 
            msg, useOC, partner );
          return;
        }
        
      } else {
        this.feedbackError( 
          `You did not specify what file you wanted to upload.`, 
          msg, useOC, partner );
      }
      
    } else {
      this.feedbackError( 
        `BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`, 
        msg );
    }
    
  },
  loadArgs: {
    avatar: function( msg, partner, useOC ) {
      return {
        expectedType: "image",
        dataHandler: function( response, uri ) {
          partner.setImg( uri );
          msg.channel.sendEmbed( FORMAT.embed( 
            allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'customized') ) )
            .catch(console.log);
          if (!CONFIG.enableOC) msg.reply("NOTE: EnableOC is currently disabled").catch(console.log);
          if (!useOC) msg.reply("NOTE: OC images are not permitted in this channel").catch(console.log);
        },
        statusResponder: function( status ) {
          console.log("Status Code: " + status.code);
          console.log("Reason: " + status.reason);
          if (status.reason === "filetype") {
            COMMAND.feedbackError( 
            `That file is incompatible! File must be a PNG or JPEG image.`, 
            msg, useOC, partner );
          } else if (status.reason === "filesize") {
            COMMAND.feedbackError( 
            `That file is too large! Maximum filesize allowed is ${SECRET.maxfilesize}`, 
            msg, useOC, partner );
          } else if ( status.reason ) {
            COMMAND.feedbackError( `${status.reason}`, msg, useOC, partner );
          }
        }
      };
    },
    dialogue: function( msg, partner, useOC ) {
      //msg.reply("this hasn't been implemented yet!").catch(console.log);
      return {
        expectedType: "json",
        dataHandler: function( json, uri ) {
          let counter = 0;
          for ( let sit in partner.custom.modifiers ) {
            if ( json.hasOwnProperty(sit) ) {
              //console.log(sit);
              //console.log(json[sit].mod);
              if ( json[sit].hasOwnProperty( "mod" ) && typeof json[sit].mod === "number") {
                partner.setModifier( sit, json[sit].mod );
                counter++;
              }
              if ( json[sit].hasOwnProperty( "dialogue" ) ) {
                for ( let feel in partner.custom.modifiers[sit].dialogue ) {
                  //console.log(feel);
                  //console.log(json[sit].dialogue[feel]);
                  if ( json[sit].dialogue.hasOwnProperty(feel) && typeof json[sit].dialogue[feel] === "string") {
                    counter++;
                    partner.setDialogue( sit, feel, json[sit].dialogue[feel] );
                  }
                }
              }
            }
          }
          if ( counter === 0 ) {
            COMMAND.feedbackError( 
              `No changes were made to ${partner.getName()}'s dialogue. Are you sure you uploaded the right file?`, msg, useOC, partner );
          } else {
            msg.reply(`${counter} changes made to ${partner.getName()}'s dialogue`)
              .catch(console.log);
            msg.channel.sendEmbed( FORMAT.embed( 
              allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'customized') ) )
              .catch(console.log);
          }          
        },
        statusResponder: function( status ) {
          console.log("Status Code: " + status.code);
          console.log("Reason: " + status.reason);
          if (status.reason === "filetype") {
            COMMAND.feedbackError( 
            `That file is incompatible! File must be a TXT or JSON file.`, 
            msg, useOC, partner );
          } else if (status.reason === "filesize") {
            COMMAND.feedbackError( 
            `That file is too large! Maximum filesize allowed is ${SECRET.maxfilesize}`, 
            msg, useOC, partner );
          } else if ( status.reason ) {
            COMMAND.feedbackError( `${status.reason}`, msg, useOC, partner );
          }
        }
      };
    },
    phrases: function( msg, partner, useOC ) {
      return {
        expectedType: "json",
        dataHandler: function( json, uri ) {
          let errorMsg = "";
          let customPhrases = [];
          let emptyModifiers = new CUSTOM.Modifiers();
          for ( let i = 0; i < 5 && i < json.length; i++ ) {
            if ( json[i].hasOwnProperty("sit") ) {
              if ( emptyModifiers.hasOwnProperty(json[i].sit) ) {
                if ( json[i].hasOwnProperty("phrase") ) {
                  // Check that length is <= 128 and > 0 
                  if ( json[i].phrase.length > 0 && json[i].phrase.length <= 128 ) {
                    // Check that it does not contain only asterisks
                    if ( !UTIL.boolMapReduce( 
                          true, 
                          json[i].phrase, 
                          function( item ) {
                            return item === "*" || item === " ";
                          }, 
                          UTIL.reduceAND) 
                    ) {
                      // FINALLY add it to the custom phrase array
                      customPhrases.push(json[i]);
                    } else {
                      errorMsg += `- Custom phrase must contain more than just asterisks * ! Skipping #${i}...\n`;
                    }
                  } else {
                    errorMsg += `- Custom phrase must be less than 128 characters and more than 0! Skipping #${i}...\n`;
                  }
                } else {
                  errorMsg += `- Missing a custom phrase definition! Skipping #${i}...\n`;
                }
              } else {
                errorMsg += `- Invalid situation keyword! Skipping #${i}...\n`;
              }
            } else {
              errorMsg += `- Missing a situation keyword! Skipping #${i}...\n`;
            }
          }
          if ( errorMsg ) {
            msg.author.sendMessage("**Load Phrases Error Log**\n"+errorMsg);
          }
          if ( customPhrases.length === 0 ) {
            COMMAND.feedbackError( 
              `No changes were made to ${partner.getName()}'s custom phrases. Are you sure you uploaded the right file?`, msg, useOC, partner );
          } else {
            partner.setPhrases(customPhrases);
            msg.reply(`${customPhrases.length} changes made to ${partner.getName()}'s custom phrases`)
              .catch(console.log);
            msg.channel.sendEmbed( FORMAT.embed( 
              allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'customized') ) )
              .catch(console.log);
          }          
        },
        statusResponder: function( status ) {
          console.log("Status Code: " + status.code);
          console.log("Reason: " + status.reason);
          if (status.reason === "filetype") {
            COMMAND.feedbackError( 
            `That file is incompatible! File must be a TXT or JSON file.`, 
            msg, useOC, partner );
          } else if (status.reason === "filesize") {
            COMMAND.feedbackError( 
            `That file is too large! Maximum filesize allowed is ${SECRET.maxfilesize}`, 
            msg, useOC, partner );
          } else if ( status.reason ) {
            COMMAND.feedbackError( `${status.reason}`, msg, useOC, partner );
          }
        }
      };
    },
    partition: function( msg, partner, useOC ) {
      msg.reply("this hasn't been implemented yet!").catch(console.log);
      return;
    },
    folder: function( msg, partner, useOC ) {
      msg.reply("this hasn't been implemented yet!").catch(console.log);
      return;
    }
  },
  reset: function(msg, args, useOC) {
    // Check if really partnered
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      
      // Reset the custom property, incrementing numReset
      partner.reset();
      
      // Bootup
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'greeting') ) )
        .catch(console.log);
      
    } else {
      this.feedbackError( 
        `BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`, 
        msg );
    }
    
  },
  
  // Partner Interaction
  netalerts: function(msg, args, useOC) {
    msg.reply('NOTE: This feature not yet fully supported. Planned for V.0.2.0')
      .catch(console.log);
    SERVER.channels.main
      .sendMessage(`${SERVER.roles.partnered}`)
      .catch(console.log);
    msg.channel
      .sendEmbed( FORMAT.embed( NPC.announcer.getEmbed('warning', 'error', 
        `Attention all NetOps! A virus has infected the ${SERVER.channels.battle} channel!`,
        "") ) )
      .catch(console.log);
  },
  jack: function(msg, args, useOC) {
    if ( allPartners.has(msg.author.id) ) {
      let partner = allPartners.get(msg.author.id);
      if ( args[0] ) {
        if ( args[0].toLowerCase() == 'in' ) {
          msg.channel
            .sendEmbed( partner.getEmbed(msg, 'netalert') )
            .catch(console.log);
        } else
        if ( args[0].toLowerCase() == 'out' ) {
          msg.channel
            .sendEmbed( partner.getEmbed(msg, 'bails') )
            .catch(console.log);
        } else {
          msg.channel
            .sendEmbed( partner.getEmbed(msg, 'confused') )
            .catch(console.log);
        }
      } else {
        msg.channel
            .sendEmbed( partner.getEmbed(msg, 'confused') )
            .catch(console.log);
      }
    } else {
      msg.channel
        .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 
          'normal', 'warning',
          `You don't have a ${CONFIG.partnerLabel} yet!\n\nType the following command to make yourself a ${CONFIG.partnerLabel}:\n\n${FORMAT.inline("CREATE NAME.EXE")}`,
          "" ) ) )
        .catch(console.log);
    }
    msg.reply('This feature not yet fully supported. Planned for V.0.2.0').catch(console.log);
  },
  hey: function(msg, args, useOC) {
    let phrase = args;
    // TODO: Double-check that this does not conflict with custom command words
    if (args[0] === CONFIG.prefix+"hey" ) phrase = args.slice(1);

    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      
      let sit = (phrase.length === 0) ? "greeting" : partner.getSitFromPhrase(phrase);
      //console.log(sit);
      //console.log(partner.getPhrases());
      
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, sit) ) )
        .catch(console.log);
    
    } else {
      msg.reply(`BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`)
        .catch(console.log);
    }
  },
  stats: function(msg, args, useOC) {
    // Check if really partnered
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);      
      
      msg.author.sendEmbed( FORMAT.embed( partner.getEmbed( msg.author, useOC, 'stats' ) ) )
        .catch(console.log);
      msg.author.sendMessage( partner.getBattleStats() )
        .catch(console.log);
      
    } else {
      msg.reply(`BUT YOU DON'T HAVE A ${CONFIG.partnerLabel.toUpperCase()} YET!!`)
        .catch(console.log);
    }    
  },  
  
  // Helper functions
  isUserPermitted: function( cmd, author ) {
    if ( ENUM.Command.properties[ENUM.Command[cmd]].perm.length == 0 ) return true;
    return UTIL.boolMapReduce( false, ENUM.Command.properties[ENUM.Command[cmd]].perm, UTIL.roleMatch(author), UTIL.reduceOR );
  },
  isChannelPermitted: function( cmd, channel ) {
    if ( channel.type === "dm" ) {
      return ENUM.Command.properties[ENUM.Command[cmd]].enableDM;
    } else {
      return UTIL.boolMapReduce( false, ENUM.Command.properties[ENUM.Command[cmd]].channels, UTIL.channelMatch(channel), UTIL.reduceOR );
    }
  },
  isPermitted: function( cmd, msg ) {
    return this.isChannelPermitted( cmd, msg.channel ) && this.isUserPermitted( cmd, msg.author );
  },  
  challenge: function(msg, args) {
    SERVER.channels.info
      .sendEmbed( FORMAT.embed ( NPC.announcer.getEmbed( 
        'normal', 'normal', ENUM.Challenge.getDetails(), "" ) ) )
      .catch(console.log);
  },
  feedbackError( text, msg, useOC, partner ) {
    msg.reply(text).catch(console.log);
    if ( partner ) {
      msg.channel.sendEmbed( FORMAT.embed( 
        allPartners.get(msg.author.id).getEmbed( msg.author, useOC, 'confused') ) )
        .catch(console.log);
    }
  }
};
if (Object.freeze) Object.freeze(COMMAND);

// =========================================================
//  EVENT HANDLING
// =========================================================
// Miscellaneous Events
CLIENT.on('guildMemberAvailable', () => {
  let d = new Date();
  console.log(d.toLocaleString());
  console.log('Someone came online');
});
CLIENT.on('disconnect', closeEvent => {
  let d = new Date();
  console.log(d.toLocaleString());
  if (closeEvent) {
    console.log('Mr.Prog went offline with code ' + closeEvent.code);
  } else {
    console.log('Mr.Prog went offline with unknown code');
  }
  disconnected = true;
  CLIENT.user.setAFK(true);
  CLIENT.user.setStatus('dnd');
  CLIENT.user.setGame("Unexpected Disconnect!");
});
CLIENT.on('reconnecting', () => {
  let d = new Date();
  console.log(d.toLocaleString());
  console.log('Mr.Prog is attempting to reconnect');
});
CLIENT.on('warn', warn => {
  let d = new Date();
  console.log(d.toLocaleString());
  if (warn) {
    console.log('Warning: ' + warn);
  }
});
CLIENT.on('error', error => {
  let d = new Date();
  console.log(d.toLocaleString());
  if (error) {
    console.log('Error: ' + error.message);
  } else {
    console.log('Unknown error');
  }
});

// Initialization Procedure
CLIENT.on( 'ready', () => {
  
  if (disconnected) {
    let d = new Date();
    console.log(d.toLocaleString());
    console.log("RECOVERED from D/C");
    
    CLIENT.user.setAFK(false);
    CLIENT.user.setStatus('online');
    CLIENT.user.setGame(CONFIG.game);
    
  } else {
    let d = new Date();
    console.log(d.toLocaleString());
    console.log('Mr.Prog the Discord bot is now online');
    CLIENT.user.setStatus('dnd');
    
    if ( CONFIG.isDebugMode ) {
      CLIENT.user.setGame("DEBUG MODE");
      UTIL.setServer( CONFIG.channels.debugmode );
    } else {
      CLIENT.user.setGame(CONFIG.game);
      UTIL.setServer( CONFIG.channels.normalmode );
    }

    if ( SERVER.isValid ) {
      SERVER.channels.main.sendMessage(
        `${SERVER.roles.partnered} ${CONFIG.botname} is now online!`
      ).catch(console.log);
      CLIENT.user.setStatus('online');
    } else {
      console.log("INVALID SERVER OR CHANNEL IDs. SHUTTING DOWN!");
      CLIENT.destroy().catch(console.log);
    } 
  }
} );

// Message Handling
CLIENT.on( 'message', msg => {
  
  // Ignore own messages
  if (msg.author.bot) return;
  
  // Find out if we should display OC avatars
  let useOC = CONFIG.enableOC && SERVER.channels.oc === msg.channel;
  
  // React to mention at me
  if ( msg.mentions.users.has(CLIENT.user.id) ) COMMAND.tips(msg, null, useOC);
  
  // Check if user fake-mentions their partner
  if ( COMMAND.isPermitted("hey", msg) && allPartners.has(msg.author.id) && msg.content.toLowerCase().includes("@"+allPartners.get(msg.author.id).getName().toLowerCase())) {
    COMMAND.hey(msg, msg.content.trim().split(/[ ,]+/), useOC);
    return;
  }
  
  // Ignore not commands
  if (!msg.content.startsWith(CONFIG.prefix)) return;

  // Get the arguments
  let args = msg.content.trim().split(/[ ,]+/);

  // Get the command name
  let cmd = args[0].toLowerCase().slice(CONFIG.prefix.length);
  args = args.slice(1);
  
  // Get the user's name 
  let name = (msg.channel.type === "text") ? msg.member.displayName : msg.author.username;
  
  // Check permissions for the command
  if (ENUM.Command.hasOwnProperty(cmd)) {
    
    if ( COMMAND.isPermitted(cmd, msg) ) {
    //if ( true ) {
      // process command
      COMMAND[ ENUM.Command.properties[ENUM.Command[cmd]].cmd ](msg, args, useOC);
    } else {
      // alert that this user is not permitted
      msg.author
        .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'error', 'error', 
        `ERROR!! ERROR!! ERROR!!\n\n${FORMAT.code(`User: ${name}\nChannel: ${msg.channel.name}\nCommand: ${CONFIG.prefix}${cmd} ${args.join(" ")}`)}\n\nACCESS DENIED!!`) ) )
        .catch(console.log);
      msg.author
        .sendMessage(`${name}, you are not permitted to use ${FORMAT.inline(cmd, CONFIG.prefix)} in ${msg.channel}`)
        .catch(console.log);
      /*msg.delete(1000)
        .then(msg => console.log(`Deleted message from ${msg.author}`))
        .catch(console.error);*/
    }
  } else {
    // alert that the command wasn't recognized
    msg.author
      .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'error', 'error', 
      `ERROR!! ERROR!! ERROR!!\n\n${FORMAT.code(`User: ${name}\nChannel: ${msg.channel.name}\nCommand: ${CONFIG.prefix}${cmd} ${args.join(" ")}`)}\n\nCOMMAND NOT RECOGNIZED!!`) ) )
      .catch(console.log);
    msg.author
      .sendMessage(`${name}, type ${FORMAT.inline(ENUM.Command.properties[ENUM.Command["help"]].id, CONFIG.prefix)} to list all recognized commands.`)
      .catch(console.log);
    /*msg.delete(1000)
      .then(msg => console.log(`Deleted message from ${msg.author}`))
      .catch(console.error);*/
  }
  
} );


// Login to Discord
CLIENT.login(SECRET.tk);