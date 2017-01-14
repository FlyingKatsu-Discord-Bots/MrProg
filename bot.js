//const SECRET = require("./require/conf.json");
//const CONFIG = require("./require/config.js");
//const NPC = require("./require/npc.js");
//const CUSTOM = require("./require/custom.js");
//const ENUM = require("./require/enum.js");
//const PARTNER = require("./require/partner.js");

const DISCORD = require('discord.js');
const CLIENT = new DISCORD.Client();

const SERVER = {
  guild: null,
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


// =========================================================
//  STATE VARIABLES
// =========================================================
var allPartners = new Map();


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
    /*let em = input || {};
    let output = new Discord.RichEmbed( input );
    if ( em.author ) output.setAuthor( em.author );
    if ( em.title ) output.setTitle( em.title );
    if ( em.desc ) output.setDescription( em.desc );
    if ( em.thumb ) output.setThumbnail( em.thumb );
    if ( em.imgurl ) output.setImage( em.imgurl );
    if ( em.color ) output.setColor( em.color );
    if ( em.foot ) output.setFooter( em.foot );
    return output;*/
    return new Discord.RichEmbed( input );
  }
};
if (Object.freeze) Object.freeze(FORMAT);

var UTIL = {
  setServer( channels ) {
    
    // Set MAIN to DEBUG if MAIN is NULL
    if ( !channels.main ) {
      if ( channels.debug ) {
        channels.main = channels.debug;
        console.log("UTIL:: Channel DEBUG will be used because MAIN is null");
      } else {
        console.log("UTIL:: You must specify a DEBUG or MAIN channel ID!");
        SERVER.isValid = false;
      }
    }
    
    // Get the guild object for the server
    SERVER.guild = client.guilds.get( CONFIG.guildID );
    
    if ( SERVER.guild ) {      
      // Connect SERVER to actual channel objects
      // redirecting any null channel IDs to MAIN
      SERVER.channels.main = SERVER.guild.channels.get( CONFIG.channels.main );
      SERVER.channels.info = SERVER.guild.channels.get( CONFIG.channels.info || CONFIG.channels.main );
      SERVER.channels.battle = SERVER.guild.channels.get( CONFIG.channels.battle || CONFIG.channels.main );
      SERVER.channels.shop = SERVER.guild.channels.get( CONFIG.channels.shop || CONFIG.channels.main );
      SERVER.channels.oc = SERVER.guild.channels.get( CONFIG.channels.oc || CONFIG.channels.main );
      SERVER.channels.debug = SERVER.guild.channels.get( CONFIG.channels.debug || CONFIG.channels.main );
    } else {
      // If the guild wasn't found, the SERVER isn't valid
      SERVER.isValid = false;
    }
    
    // If the main (or debug) channel wasn't found, the SERVER isn't valid
    if ( !SERVER.channels.main ) SERVER.isValid = false;
    
    if (Object.freeze) Object.freeze(SERVER);

  },
  
  boolMapReduce: function(input, arr, fnIN, fnOUT) {
    var result = input;
    for (var i=0; i<arr.length; i++) {
      result = fnOut( result, fnIN(arr[i]) );
    }
    return result;
  },
  
  reduceAND: function(r, item) {
    return r && item;
  },
  
  reduceOR: function(r, item) {
    return r || item;
  }
  
  channelMatch: function( channel ) {
    return function( channel, item ) {
      return SERVER.channels[item] === channel;
    }
  }
};
if (Object.freeze) Object.freeze(UTIL);

// =========================================================
//  EVENT HANDLING
// =========================================================
// Miscellaneous Events
CLIENT.on('guildMemberAvailable', () => {
  console.log('Someone came online');
});
CLIENT.on('disconnect', closeEvent => {
  console.log('Mr.Prog went offline with code ' + closeEvent.code);
});
CLIENT.on('reconnecting', () => {
  console.log('Mr.Prog is attempting to reconnect');
});
CLIENT.on('warn', warn => {
  console.log('WARNING: ' + warn);
});
CLIENT.on('error', error => {
  console.log('ERROR: ' + error.message);
});

// Initialization Procedure
CLIENT.on( 'ready', () => {
  
  console.log('Mr.Prog the Discord bot is now online');
  
  if ( CONFIG.isDebugMode ) {
    UTIL.setServer( CONFIG.channels.debugmode );
  } else {
    UTIL.setServer( CONFIG.channels.normalmode );
  }
  
  if ( SERVER.isValid ) {
    SERVER.channels.main.sendMessage(
      `${SERVER.guild.roles.find("name", CONFIG.roles.partnered)} ${CONFIG.botname} is now online!`
    ).catch(console.log);
  } else {
    console.log("INVALID SERVER OR CHANNEL IDs. SHUTTING DOWN!");
    client.destroy().catch(console.log);
  }
  
} );

// Message Handling
CLIENT.on( 'message', msg => {
  
  // Ignore own messages
  if (msg.author.bot) return;
  
  // React to mention at me in MAIN or DM only
  if ( msg.mentions.users.exists('username', SECRET.botusername) 
      && (msg.type === "dm" || msg.channel === SERVER.channels.main) ) {
    if ( allPartners.has( msg.author.id ) ) {
      let partner = allPartners.get(msg.author.id);
      // Check in on partner status
      msg.channel
        .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
          `Hello, ${msg.author}!\n\nHow is your ${CONFIG.partnerLabel}, ${partner.name}, doing?`, 
          null ) ) )
        .catch(console.log);
      // Get partner response
      msg.channel
        .sendEmbed( FORMAT.embed( partner.getEmbed( msg, feeling ) ) )
        .catch(console.log);
    } else {
      // Remind user to create a partner for themselves
      msg.channel
        .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'normal', 'normal', 
          `Hello, ${msg.author}!\n\nType the following to make your own ${CONFIG.partnerLabel}:\n\n${FORMAT.code("create NAME BASE VARIANT", ${CONFIG.prefix})}`, 
          null ) ) )
        .catch(console.log);
    }
  }

  // Ignore not commands
  if (!msg.content.startsWith(CONFIG.prefix)) return;

  // Get the arguments
  let args = msg.content.trim().split(/[ ,]+/);

  // Get the command name
  let cmd = args[0].toLowerCase().slice(CONFIG.prefix.length);
  args = args.slice(1);

  // Check permissions for the command
  if (ENUM.Command.hasOwnProperty(cmd)) {
    //let isPermitted = true;
    let name = (msg.channel.type === "text") ? msg.member.displayName : msg.author.username;
    
    if ( ENUM.Command.isPermitted(cmd, msg) ) {
      // process command
      ENUM.Command.properties[ENUM.Command[cmd]].respond(msg, args);
    } else {
      // alert that this user is not permitted
      msg.author
        .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'error', 'error', 
        `ERROR!! ERROR!! ERROR!!\n\n${FORMAT.code(`User: ${name}\nChannel: ${msg.channel.name}\nCommand: ${CONFIG.prefix}${args.join(" ")}`)}\n\nACCESS DENIED!!`,
        null ) ) )
        .catch(console.log);
      msg.author
        .sendMessage(`${msg.author}, you are not permitted to use ${FORMAT.inline(cmd, CONFIG.prefix)} in ${msg.channel}`)
        .catch(console.log);
      msg.delete(1000)
        .then(msg => console.log(`Deleted message from ${msg.author}`))
        .catch(console.error);
    }
  } else {
    // alert that the command wasn't recognized
    msg.author
      .sendEmbed( FORMAT.embed( NPC.guide.getEmbed( 'error', 'error', 
      `ERROR!! ERROR!! ERROR!!\n\n${FORMAT.code(`User: ${name}\nChannel: ${msg.channel.name}\nCommand: ${CONFIG.prefix}${args.join(" ")}`)}\n\nCOMMAND NOT RECOGNIZED!!`, null ) ) )
      .catch(console.log);
    msg.author
      .sendMessage(`${msg.author}, type ${FORMAT.inline(cmd, CONFIG.prefix)} to list all recognized commands.`)
      .catch(console.log);
    msg.delete(1000)
      .then(msg => console.log(`Deleted message from ${msg.author}`))
      .catch(console.error);
  }
  
} );


// Login to Discord
CLIENT.login(SECRET.tk);